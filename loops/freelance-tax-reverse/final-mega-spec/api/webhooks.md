# Outbound Webhooks — Philippine Freelance & Self-Employed Income Tax Optimizer

**Status:** COMPLETE
**Last updated:** 2026-03-02
**Cross-references:**
- API endpoints (inbound Stripe/PayMongo webhooks): [api/endpoints.md §14](endpoints.md)
- Auth model (API key auth for webhook management): [api/auth.md](auth.md)
- Rate limiting: [api/rate-limiting.md](rate-limiting.md)
- Premium tiers (Enterprise-only): [premium/tiers.md](../premium/tiers.md)
- Database schema (webhook_endpoints, webhook_deliveries tables): [database/schema.md](../database/schema.md)
- Batch API (events triggered by batch jobs): [api/endpoints.md §11](endpoints.md)
- Deployment (Redis for delivery queue): [deployment/infrastructure.md](../deployment/infrastructure.md)
- Environment variables: [deployment/environment.md](../deployment/environment.md)

---

## Table of Contents

1. [Overview](#1-overview)
2. [Who Can Use Outbound Webhooks](#2-who-can-use-outbound-webhooks)
3. [Webhook Endpoint Management API](#3-webhook-endpoint-management-api)
   - 3.1 `POST /webhook-endpoints` — Register
   - 3.2 `GET /webhook-endpoints` — List
   - 3.3 `GET /webhook-endpoints/:endpoint_id` — Get One
   - 3.4 `PATCH /webhook-endpoints/:endpoint_id` — Update
   - 3.5 `DELETE /webhook-endpoints/:endpoint_id` — Delete
   - 3.6 `POST /webhook-endpoints/:endpoint_id/test` — Send Test Event
   - 3.7 `GET /webhook-endpoints/:endpoint_id/deliveries` — Delivery History
4. [Event Payload Envelope](#4-event-payload-envelope)
5. [Event Catalog](#5-event-catalog)
   - 5.1 Batch Job Events
   - 5.2 Subscription Events
   - 5.3 Client Management Events
6. [Per-Event Payload Schemas](#6-per-event-payload-schemas)
   - 6.1 `batch.job.queued`
   - 6.2 `batch.job.started`
   - 6.3 `batch.job.completed`
   - 6.4 `batch.job.partial_failure`
   - 6.5 `batch.job.failed`
   - 6.6 `subscription.trial.started`
   - 6.7 `subscription.trial.ending`
   - 6.8 `subscription.trial.ended`
   - 6.9 `subscription.activated`
   - 6.10 `subscription.renewed`
   - 6.11 `subscription.payment_failed`
   - 6.12 `subscription.cancelled`
   - 6.13 `subscription.expired`
   - 6.14 `subscription.plan_changed`
   - 6.15 `client.added`
   - 6.16 `client.removed`
7. [HMAC-SHA256 Signature Validation](#7-hmac-sha256-signature-validation)
   - 7.1 Signature Header Format
   - 7.2 Signature Computation Algorithm
   - 7.3 Receiver Validation Pseudocode
   - 7.4 Timing-Safe Comparison Requirement
8. [Retry Policy](#8-retry-policy)
   - 8.1 Retry Trigger Conditions
   - 8.2 Retry Schedule
   - 8.3 Retry State Machine
   - 8.4 Failure Escalation
9. [Event Delivery Guarantees](#9-event-delivery-guarantees)
10. [Database Tables for Webhooks](#10-database-tables-for-webhooks)
    - 10.1 `webhook_endpoints`
    - 10.2 `webhook_deliveries`
11. [Event Filtering Per Endpoint](#11-event-filtering-per-endpoint)
12. [Security Requirements for Receiver URLs](#12-security-requirements-for-receiver-urls)
13. [Rate Limits for Webhook Management API](#13-rate-limits-for-webhook-management-api)
14. [Environment Variables](#14-environment-variables)

---

## 1. Overview

TaxOptimizer sends **outbound webhook HTTP POST requests** to registered Enterprise subscriber URLs when significant events occur on their account: batch job state changes, subscription lifecycle events, and CPA client management events.

**What outbound webhooks are NOT:**
- The inbound `POST /webhooks/stripe` and `POST /webhooks/paymongo` endpoints (defined in `endpoints.md §14`) — those are webhooks FROM Stripe/PayMongo TO TaxOptimizer and are unrelated to this spec.
- Real-time computation streaming — individual computations do not emit webhook events; only batch jobs do.

**Delivery method:** Each event is a single HTTP POST request with a JSON body to the registered URL. The request must receive a 2xx response within 30 seconds or it is considered failed.

**Ordering guarantee:** No ordering is guaranteed between distinct events. Within a single event type for a single resource (e.g., successive status updates for the same batch job), events are delivered in order of occurrence but network conditions may cause out-of-order delivery. Receivers must use the event's `occurred_at` timestamp and idempotency key for ordering.

---

## 2. Who Can Use Outbound Webhooks

| Capability | FREE | PRO | ENTERPRISE |
|-----------|------|-----|------------|
| Register webhook endpoints | No | No | Yes |
| Receive batch job events | No | No | Yes |
| Receive subscription events | No | No | Yes |
| Receive client management events | No | No | Yes |
| Maximum registered endpoints | 0 | 0 | 5 |
| Event delivery history retention | — | — | 30 days |

Attempting to call webhook management endpoints (`/webhook-endpoints/*`) with a non-Enterprise session or API key returns `403 ERR_REQUIRES_ENTERPRISE`.

---

## 3. Webhook Endpoint Management API

All endpoints in this section require Enterprise subscription. All route paths are relative to the API base URL `https://api.taxoptimizer.ph/v1`.

### 3.1 `POST /webhook-endpoints`

Register a new webhook endpoint URL to receive events.

**Authentication required:** Session cookie (with CSRF token) or API key. Enterprise only.

**Request body:**

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `url` | string | Yes | Must be a valid HTTPS URL. Max 2048 characters. URL must not be a private/loopback address (see §12). |
| `description` | string | No | Human-readable label. Max 200 chars. Default: `""` (empty string). |
| `events` | array of string | No | List of event type strings to subscribe to. If omitted or empty array `[]`, subscribes to ALL event types. Each string must be a valid event type from §5. Max 20 entries. |
| `enabled` | boolean | No | Whether this endpoint is active. Default: `true`. |

**Example request:**
```json
{
  "url": "https://cpa-system.example.ph/tax-optimizer-events",
  "description": "Production batch job notifications",
  "events": ["batch.job.completed", "batch.job.partial_failure", "batch.job.failed"],
  "enabled": true
}
```

**Response: `201 Created`**

```json
{
  "id": "whe_01hzxq2j3k4m5n6p7q8r9s0t1u",
  "url": "https://cpa-system.example.ph/tax-optimizer-events",
  "description": "Production batch job notifications",
  "events": ["batch.job.completed", "batch.job.partial_failure", "batch.job.failed"],
  "enabled": true,
  "secret": "whsec_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",
  "created_at": "2026-03-02T14:30:00.000Z",
  "updated_at": "2026-03-02T14:30:00.000Z"
}
```

The `secret` field is returned ONLY on creation and NEVER again. The caller must store it securely to validate incoming webhook signatures. If lost, the endpoint must be deleted and re-created.

**Secret format:** `whsec_` prefix followed by 48 URL-safe base64 characters (36 random bytes → base64 URL-encoded without padding). Total length: 54 characters.

**Errors:**

| HTTP | Code | Condition |
|------|------|-----------|
| 400 | `ERR_VALIDATION_FAILED` | URL missing, invalid format, not HTTPS, or private/loopback address |
| 400 | `ERR_VALIDATION_FAILED` | `events` contains an unrecognized event type string |
| 401 | `ERR_UNAUTHENTICATED` | Not logged in |
| 403 | `ERR_REQUIRES_ENTERPRISE` | Not Enterprise subscriber |
| 409 | `ERR_DUPLICATE_WEBHOOK_URL` | The same HTTPS URL is already registered for this account |
| 422 | `ERR_WEBHOOK_LIMIT_REACHED` | Account already has 5 registered endpoints (maximum) |

---

### 3.2 `GET /webhook-endpoints`

List all registered webhook endpoints for the authenticated account.

**Authentication required:** Session cookie or API key. Enterprise only.

**Query parameters:** None.

**Response: `200 OK`**

```json
{
  "data": [
    {
      "id": "whe_01hzxq2j3k4m5n6p7q8r9s0t1u",
      "url": "https://cpa-system.example.ph/tax-optimizer-events",
      "description": "Production batch job notifications",
      "events": ["batch.job.completed", "batch.job.partial_failure", "batch.job.failed"],
      "enabled": true,
      "created_at": "2026-03-02T14:30:00.000Z",
      "updated_at": "2026-03-02T14:30:00.000Z"
    }
  ],
  "total": 1
}
```

Note: `secret` is NEVER returned in list or get responses. Only returned on creation.

**Errors:**

| HTTP | Code | Condition |
|------|------|-----------|
| 401 | `ERR_UNAUTHENTICATED` | Not logged in |
| 403 | `ERR_REQUIRES_ENTERPRISE` | Not Enterprise subscriber |

---

### 3.3 `GET /webhook-endpoints/:endpoint_id`

Get a single registered webhook endpoint.

**Authentication required:** Session cookie or API key. Enterprise only. Owning user only.

**Path parameter:** `endpoint_id` — the `id` string of the webhook endpoint.

**Response: `200 OK`**

Same shape as one element from `GET /webhook-endpoints` response (no `secret` field).

**Errors:**

| HTTP | Code | Condition |
|------|------|-----------|
| 401 | `ERR_UNAUTHENTICATED` | Not logged in |
| 403 | `ERR_REQUIRES_ENTERPRISE` | Not Enterprise subscriber |
| 403 | `ERR_FORBIDDEN` | Endpoint belongs to another account |
| 404 | `ERR_NOT_FOUND` | Endpoint ID not found |

---

### 3.4 `PATCH /webhook-endpoints/:endpoint_id`

Update a registered webhook endpoint. Only provided fields are updated; omitted fields are unchanged.

**Authentication required:** Session cookie (with CSRF token) or API key. Enterprise only. Owning user only.

**Request body (all fields optional):**

| Field | Type | Validation |
|-------|------|-----------|
| `url` | string | Must be valid HTTPS, non-private URL. Max 2048 chars. Changing URL triggers a re-validation check. |
| `description` | string | Max 200 chars. |
| `events` | array of string | Each must be a valid event type. `[]` means all events. Max 20 entries. |
| `enabled` | boolean | Set to `false` to pause delivery without deleting. Set to `true` to resume. |

**Example request (disable endpoint):**
```json
{
  "enabled": false
}
```

**Example request (change event subscription):**
```json
{
  "events": ["batch.job.completed", "subscription.trial.ending", "subscription.expired"]
}
```

**Response: `200 OK`**

Returns the updated endpoint object (same shape as `GET /webhook-endpoints/:endpoint_id`, no `secret`).

**Note:** Changing the URL does NOT rotate the secret. To rotate the secret, delete and re-create the endpoint.

**Errors:**

| HTTP | Code | Condition |
|------|------|-----------|
| 400 | `ERR_VALIDATION_FAILED` | URL invalid or private/loopback |
| 400 | `ERR_VALIDATION_FAILED` | `events` contains unrecognized type |
| 401 | `ERR_UNAUTHENTICATED` | Not logged in |
| 403 | `ERR_REQUIRES_ENTERPRISE` | Not Enterprise subscriber |
| 403 | `ERR_FORBIDDEN` | Endpoint belongs to another account |
| 404 | `ERR_NOT_FOUND` | Endpoint ID not found |
| 409 | `ERR_DUPLICATE_WEBHOOK_URL` | New URL already registered for this account on a different endpoint |

---

### 3.5 `DELETE /webhook-endpoints/:endpoint_id`

Delete a registered webhook endpoint. All delivery history for this endpoint is also deleted.

**Authentication required:** Session cookie (with CSRF token) or API key. Enterprise only. Owning user only.

**Response: `204 No Content`**

**Side effects:**
- Deletes the `webhook_endpoints` row.
- Deletes all `webhook_deliveries` rows for this endpoint (cannot be recovered).
- Cancels any pending retry attempts for this endpoint in the delivery queue.

**Errors:**

| HTTP | Code | Condition |
|------|------|-----------|
| 401 | `ERR_UNAUTHENTICATED` | Not logged in |
| 403 | `ERR_REQUIRES_ENTERPRISE` | Not Enterprise subscriber |
| 403 | `ERR_FORBIDDEN` | Endpoint belongs to another account |
| 404 | `ERR_NOT_FOUND` | Endpoint ID not found |

---

### 3.6 `POST /webhook-endpoints/:endpoint_id/test`

Send a test event payload to the endpoint to verify connectivity and signature validation. The test event is NOT a real event — no actual state change occurs. Delivery of the test event is recorded in the endpoint's delivery history.

**Authentication required:** Session cookie (with CSRF token) or API key. Enterprise only. Owning user only.

**Request body:** None (empty body or `{}`).

**What is sent to the endpoint:** A synthetic `test.ping` event with the following payload structure:

```json
{
  "id": "evt_01hzxtest000000000000000000",
  "type": "test.ping",
  "occurred_at": "2026-03-02T14:30:00.000Z",
  "api_version": "2026-03-01",
  "livemode": true,
  "data": {
    "message": "This is a test event from TaxOptimizer. Your webhook endpoint is working correctly.",
    "endpoint_id": "whe_01hzxq2j3k4m5n6p7q8r9s0t1u"
  }
}
```

**Response: `200 OK`** (returned immediately after dispatching; does not wait for delivery confirmation)

```json
{
  "delivery_id": "whd_01hzxtest1234567890abcdef",
  "event_id": "evt_01hzxtest000000000000000000",
  "event_type": "test.ping",
  "status": "ATTEMPTING",
  "dispatched_at": "2026-03-02T14:30:00.000Z"
}
```

**Errors:**

| HTTP | Code | Condition |
|------|------|-----------|
| 401 | `ERR_UNAUTHENTICATED` | Not logged in |
| 403 | `ERR_REQUIRES_ENTERPRISE` | Not Enterprise subscriber |
| 403 | `ERR_FORBIDDEN` | Endpoint belongs to another account |
| 404 | `ERR_NOT_FOUND` | Endpoint ID not found |
| 422 | `ERR_ENDPOINT_DISABLED` | Endpoint `enabled = false`; enable it first |
| 429 | `ERR_RATE_LIMIT_EXCEEDED` | Max 3 test deliveries per endpoint per hour |

---

### 3.7 `GET /webhook-endpoints/:endpoint_id/deliveries`

List delivery history for a specific endpoint. Includes both successful and failed deliveries.

**Authentication required:** Session cookie or API key. Enterprise only. Owning user only.

**Query parameters:**

| Parameter | Type | Default | Validation |
|-----------|------|---------|-----------|
| `cursor` | string | (none) | Pagination cursor. Opaque string from previous response `next_cursor`. |
| `limit` | integer | 20 | Min 1, max 100. |
| `status` | string | (all) | Filter by status: `DELIVERED`, `FAILED`, `EXHAUSTED`, `ATTEMPTING`. |
| `event_type` | string | (all) | Filter by event type (any valid event type string, e.g., `batch.job.completed`). |

**Response: `200 OK`**

```json
{
  "data": [
    {
      "id": "whd_01hzxq2j3k4m5n6p7q8r9s0t1v",
      "endpoint_id": "whe_01hzxq2j3k4m5n6p7q8r9s0t1u",
      "event_id": "evt_01hzxq2j3k4m5n6p7q8r9s0t1w",
      "event_type": "batch.job.completed",
      "status": "DELIVERED",
      "attempt_count": 1,
      "last_attempted_at": "2026-03-02T14:30:05.000Z",
      "delivered_at": "2026-03-02T14:30:05.123Z",
      "response_status_code": 200,
      "response_body_preview": "{\"ok\":true}",
      "next_retry_at": null,
      "created_at": "2026-03-02T14:30:00.000Z"
    }
  ],
  "next_cursor": null,
  "has_more": false
}
```

**`response_body_preview`:** First 500 bytes of the response body received from the endpoint, UTF-8 encoded. `null` if no response was received (timeout or connection refused).

**Errors:**

| HTTP | Code | Condition |
|------|------|-----------|
| 401 | `ERR_UNAUTHENTICATED` | Not logged in |
| 403 | `ERR_REQUIRES_ENTERPRISE` | Not Enterprise subscriber |
| 403 | `ERR_FORBIDDEN` | Endpoint belongs to another account |
| 404 | `ERR_NOT_FOUND` | Endpoint ID not found |

---

## 4. Event Payload Envelope

Every outbound webhook POST body is a JSON object with the following top-level envelope. The event-specific data is always under the `data` key.

### 4.1 Envelope Schema

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Globally unique event ID. Format: `evt_` prefix followed by 26 lowercase alphanumeric characters (ULID without hyphens). Example: `evt_01hzxq2j3k4m5n6p7q8r9s0t1w`. Use this field for idempotency de-duplication. |
| `type` | string | Event type string. See §5 for all valid values. |
| `occurred_at` | string | ISO 8601 UTC timestamp of when the event occurred (state change time). Format: `"2026-03-02T14:30:00.000Z"`. |
| `api_version` | string | Date-versioned API version that generated this event. Always `"2026-03-01"` for the initial release. Consumers should store this for forward compatibility. |
| `livemode` | boolean | `true` for production events. `false` for events generated by `POST /webhook-endpoints/:id/test`. |
| `data` | object | Event-specific payload. See §6 for each event type's `data` schema. |

### 4.2 Complete Envelope Example

```json
{
  "id": "evt_01hzxq2j3k4m5n6p7q8r9s0t1w",
  "type": "batch.job.completed",
  "occurred_at": "2026-03-02T15:45:30.000Z",
  "api_version": "2026-03-01",
  "livemode": true,
  "data": {
    "batch_id": "batch_01hzxq2j3k4m5n6p7q8r9s0t1x",
    "user_id": "usr_01hzxq2j3k4m5n6p7q8r9s0t1y",
    "total_items": 25,
    "completed_items": 25,
    "failed_items": 0,
    "queued_at": "2026-03-02T15:44:00.000Z",
    "started_at": "2026-03-02T15:44:02.000Z",
    "completed_at": "2026-03-02T15:45:30.000Z",
    "results_url": "https://api.taxoptimizer.ph/v1/batch/batch_01hzxq2j3k4m5n6p7q8r9s0t1x/results"
  }
}
```

### 4.3 HTTP Request Headers Sent With Every Event

| Header | Value |
|--------|-------|
| `Content-Type` | `application/json; charset=utf-8` |
| `User-Agent` | `TaxOptimizer-Webhook/1.0 (+https://taxoptimizer.ph/docs/webhooks)` |
| `X-TaxOptimizer-Signature` | `sha256=<hex_digest>` — see §7 |
| `X-TaxOptimizer-Event` | Event type string. Example: `batch.job.completed` |
| `X-TaxOptimizer-Delivery` | Delivery ID. Example: `whd_01hzxq2j3k4m5n6p7q8r9s0t1v` |
| `X-TaxOptimizer-Event-Id` | Event ID. Example: `evt_01hzxq2j3k4m5n6p7q8r9s0t1w` |
| `X-TaxOptimizer-Api-Version` | `2026-03-01` |

---

## 5. Event Catalog

### 5.1 Batch Job Events

All batch events are only sent to endpoints that are subscribed to the relevant event type (or subscribed to all events via empty `events` array).

| Event Type | Description | Trigger |
|-----------|-------------|---------|
| `batch.job.queued` | A new batch job was submitted and accepted into the queue. | `POST /batch/computations` returns `202` |
| `batch.job.started` | The batch job worker picked up the job and began processing items. | Worker dequeues and starts processing |
| `batch.job.completed` | All items in the batch job were processed successfully with zero failures. | Last item processed, `failed_items = 0` |
| `batch.job.partial_failure` | Batch job finished but at least one item failed (1 ≤ `failed_items` < `total_items`). | Last item processed, `failed_items > 0` AND `completed_items > 0` |
| `batch.job.failed` | All items in the batch job failed (zero successes). | Last item processed, `completed_items = 0` |

### 5.2 Subscription Events

| Event Type | Description | Trigger |
|-----------|-------------|---------|
| `subscription.trial.started` | A new Pro or Enterprise trial was started for the user. | User initiates Pro/Enterprise trial at registration or upgrade |
| `subscription.trial.ending` | Trial period ends in exactly 3 calendar days. | Scheduled daily job at 09:00 PHT identifies trials ending in 3 days |
| `subscription.trial.ended` | Trial period ended without conversion to a paid plan. | Scheduled job marks trial as `EXPIRED` |
| `subscription.activated` | Paid subscription successfully activated (first payment confirmed). | Stripe/PayMongo `checkout.session.completed` or `payment.paid` webhook processed |
| `subscription.renewed` | Recurring billing cycle renewed (payment succeeded for renewal). | Stripe `invoice.payment_succeeded` for renewal invoice processed |
| `subscription.payment_failed` | A subscription renewal payment failed. | Stripe `invoice.payment_failed` processed |
| `subscription.cancelled` | User cancelled the subscription (access continues until `period_end`). | User submits `POST /billing/cancel` |
| `subscription.expired` | Subscription fully expired: either (a) `cancel_at_period_end = true` and `period_end` reached, or (b) all payment retries exhausted. | Scheduled job or Stripe `customer.subscription.deleted` processed |
| `subscription.plan_changed` | Plan changed from one tier to another (upgrade or downgrade). | Stripe `customer.subscription.updated` with a changed price/product processed |

### 5.3 Client Management Events

Applies to CPA Enterprise accounts managing clients.

| Event Type | Description | Trigger |
|-----------|-------------|---------|
| `client.added` | A new client was added to the CPA's roster. | `POST /clients` returns `201` |
| `client.removed` | A client was removed from the CPA's roster. | `DELETE /clients/:client_id` returns `204` |

---

## 6. Per-Event Payload Schemas

All schemas below describe the `data` object inside the envelope (see §4.1).

### 6.1 `batch.job.queued`

```json
{
  "batch_id": "batch_01hzxq2j3k4m5n6p7q8r9s0t1x",
  "user_id": "usr_01hzxq2j3k4m5n6p7q8r9s0t1y",
  "total_items": 25,
  "label_prefix": "AY2025 Batch",
  "queued_at": "2026-03-02T14:30:00.000Z",
  "estimated_completion_seconds": 30,
  "status_url": "https://api.taxoptimizer.ph/v1/batch/batch_01hzxq2j3k4m5n6p7q8r9s0t1x"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `batch_id` | string | UUID of the batch job, prefixed with `batch_`. |
| `user_id` | string | UUID of the authenticated user who submitted the batch, prefixed with `usr_`. |
| `total_items` | integer | Number of computation items in the batch. Range: 1–50. |
| `label_prefix` | string | The `label_prefix` provided at submission. Empty string `""` if not provided. |
| `queued_at` | string | ISO 8601 UTC timestamp when the batch was accepted. |
| `estimated_completion_seconds` | integer | Server estimate of processing time in seconds. Always a positive integer. Based on `total_items × 1.2` seconds, minimum 5. |
| `status_url` | string | Full HTTPS URL to poll for batch status. Format: `https://api.taxoptimizer.ph/v1/batch/{batch_id}`. |

---

### 6.2 `batch.job.started`

```json
{
  "batch_id": "batch_01hzxq2j3k4m5n6p7q8r9s0t1x",
  "user_id": "usr_01hzxq2j3k4m5n6p7q8r9s0t1y",
  "total_items": 25,
  "queued_at": "2026-03-02T14:30:00.000Z",
  "started_at": "2026-03-02T14:30:02.000Z",
  "status_url": "https://api.taxoptimizer.ph/v1/batch/batch_01hzxq2j3k4m5n6p7q8r9s0t1x"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `batch_id` | string | UUID of the batch job. |
| `user_id` | string | UUID of the submitting user. |
| `total_items` | integer | Total number of items in the batch. |
| `queued_at` | string | ISO 8601 UTC timestamp when the batch was accepted into the queue. |
| `started_at` | string | ISO 8601 UTC timestamp when the worker began processing this batch. |
| `status_url` | string | Full HTTPS URL to poll for batch status. |

---

### 6.3 `batch.job.completed`

```json
{
  "batch_id": "batch_01hzxq2j3k4m5n6p7q8r9s0t1x",
  "user_id": "usr_01hzxq2j3k4m5n6p7q8r9s0t1y",
  "total_items": 25,
  "completed_items": 25,
  "failed_items": 0,
  "queued_at": "2026-03-02T14:30:00.000Z",
  "started_at": "2026-03-02T14:30:02.000Z",
  "completed_at": "2026-03-02T14:30:32.000Z",
  "processing_duration_seconds": 30,
  "results_url": "https://api.taxoptimizer.ph/v1/batch/batch_01hzxq2j3k4m5n6p7q8r9s0t1x/results"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `batch_id` | string | UUID of the batch job. |
| `user_id` | string | UUID of the submitting user. |
| `total_items` | integer | Total number of items submitted. |
| `completed_items` | integer | Number of items successfully computed. Equal to `total_items` for this event type. |
| `failed_items` | integer | Always `0` for this event type. |
| `queued_at` | string | ISO 8601 UTC timestamp when the batch was accepted. |
| `started_at` | string | ISO 8601 UTC timestamp when processing began. |
| `completed_at` | string | ISO 8601 UTC timestamp when the last item finished. |
| `processing_duration_seconds` | integer | Elapsed seconds from `started_at` to `completed_at`, rounded to nearest integer. |
| `results_url` | string | Full HTTPS URL to fetch paginated batch results. |

---

### 6.4 `batch.job.partial_failure`

```json
{
  "batch_id": "batch_01hzxq2j3k4m5n6p7q8r9s0t1x",
  "user_id": "usr_01hzxq2j3k4m5n6p7q8r9s0t1y",
  "total_items": 25,
  "completed_items": 23,
  "failed_items": 2,
  "queued_at": "2026-03-02T14:30:00.000Z",
  "started_at": "2026-03-02T14:30:02.000Z",
  "completed_at": "2026-03-02T14:30:35.000Z",
  "processing_duration_seconds": 33,
  "failure_summary": [
    {
      "item_index": 5,
      "external_id": "client_006",
      "error_code": "ERR_GROSS_RECEIPTS_NEGATIVE",
      "error_message": "gross_receipts must be greater than or equal to 0"
    },
    {
      "item_index": 18,
      "external_id": "client_019",
      "error_code": "ERR_TAX_YEAR_OUT_OF_RANGE",
      "error_message": "tax_year must be between 2018 and 2026"
    }
  ],
  "results_url": "https://api.taxoptimizer.ph/v1/batch/batch_01hzxq2j3k4m5n6p7q8r9s0t1x/results"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `batch_id` | string | UUID of the batch job. |
| `user_id` | string | UUID of the submitting user. |
| `total_items` | integer | Total number of items submitted. |
| `completed_items` | integer | Items successfully computed. At least 1 for this event type. |
| `failed_items` | integer | Items that failed validation or computation. At least 1 for this event type. |
| `queued_at` | string | ISO 8601 UTC when batch was accepted. |
| `started_at` | string | ISO 8601 UTC when processing began. |
| `completed_at` | string | ISO 8601 UTC when the last item finished (success or failure). |
| `processing_duration_seconds` | integer | Elapsed seconds from `started_at` to `completed_at`. |
| `failure_summary` | array | Array of failure entries. Contains at most 10 entries; if more than 10 items failed, the first 10 failures (by item index ascending) are listed. Full failure data is available via `results_url`. |
| `failure_summary[].item_index` | integer | Zero-based position of the failed item in the original `computations` array. Range: 0–49. |
| `failure_summary[].external_id` | string or null | The `external_id` provided for this item at submission, or `null` if none was provided. |
| `failure_summary[].error_code` | string | One of the `ERR_*` codes from `engine/error-states.md`. |
| `failure_summary[].error_message` | string | Human-readable error description. Max 500 chars. |
| `results_url` | string | Full HTTPS URL to fetch all results including failure details. |

---

### 6.5 `batch.job.failed`

```json
{
  "batch_id": "batch_01hzxq2j3k4m5n6p7q8r9s0t1x",
  "user_id": "usr_01hzxq2j3k4m5n6p7q8r9s0t1y",
  "total_items": 3,
  "completed_items": 0,
  "failed_items": 3,
  "queued_at": "2026-03-02T14:30:00.000Z",
  "started_at": "2026-03-02T14:30:02.000Z",
  "completed_at": "2026-03-02T14:30:08.000Z",
  "processing_duration_seconds": 6,
  "failure_summary": [
    {
      "item_index": 0,
      "external_id": null,
      "error_code": "ERR_TAX_YEAR_OUT_OF_RANGE",
      "error_message": "tax_year must be between 2018 and 2026"
    },
    {
      "item_index": 1,
      "external_id": null,
      "error_code": "ERR_TAX_YEAR_OUT_OF_RANGE",
      "error_message": "tax_year must be between 2018 and 2026"
    },
    {
      "item_index": 2,
      "external_id": null,
      "error_code": "ERR_GROSS_RECEIPTS_NEGATIVE",
      "error_message": "gross_receipts must be greater than or equal to 0"
    }
  ],
  "results_url": "https://api.taxoptimizer.ph/v1/batch/batch_01hzxq2j3k4m5n6p7q8r9s0t1x/results"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `batch_id` | string | UUID of the batch job. |
| `user_id` | string | UUID of the submitting user. |
| `total_items` | integer | Total items submitted. |
| `completed_items` | integer | Always `0` for this event type. |
| `failed_items` | integer | Equal to `total_items` for this event type. |
| `queued_at` | string | ISO 8601 UTC when batch was accepted. |
| `started_at` | string | ISO 8601 UTC when processing began. |
| `completed_at` | string | ISO 8601 UTC when the last item was processed. |
| `processing_duration_seconds` | integer | Elapsed seconds from `started_at` to `completed_at`. |
| `failure_summary` | array | Same structure as §6.4. Up to 10 entries for the first 10 failures by item index. |
| `results_url` | string | Full HTTPS URL to fetch all results with failure details. |

---

### 6.6 `subscription.trial.started`

```json
{
  "user_id": "usr_01hzxq2j3k4m5n6p7q8r9s0t1y",
  "subscription_id": "sub_01hzxq2j3k4m5n6p7q8r9s0t1z",
  "plan": "PRO",
  "trial_started_at": "2026-03-02T14:30:00.000Z",
  "trial_ends_at": "2026-03-16T14:30:00.000Z",
  "trial_duration_days": 14
}
```

| Field | Type | Description |
|-------|------|-------------|
| `user_id` | string | UUID of the user. |
| `subscription_id` | string | UUID of the subscription row. |
| `plan` | string | `"PRO"` or `"ENTERPRISE"`. |
| `trial_started_at` | string | ISO 8601 UTC when the trial began. |
| `trial_ends_at` | string | ISO 8601 UTC when the trial ends. |
| `trial_duration_days` | integer | `14` for Pro, `7` for Enterprise. |

---

### 6.7 `subscription.trial.ending`

Fired once per trial, 3 calendar days before trial end. Based on the daily job at 09:00 Philippine Time (UTC+8 = 01:00 UTC).

```json
{
  "user_id": "usr_01hzxq2j3k4m5n6p7q8r9s0t1y",
  "subscription_id": "sub_01hzxq2j3k4m5n6p7q8r9s0t1z",
  "plan": "PRO",
  "trial_ends_at": "2026-03-16T14:30:00.000Z",
  "days_remaining": 3,
  "upgrade_url": "https://taxoptimizer.ph/billing/upgrade"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `user_id` | string | UUID of the user. |
| `subscription_id` | string | UUID of the subscription row. |
| `plan` | string | `"PRO"` or `"ENTERPRISE"`. |
| `trial_ends_at` | string | ISO 8601 UTC when the trial ends. |
| `days_remaining` | integer | Always `3` for this event type (the event fires at exactly 3 days remaining). |
| `upgrade_url` | string | Full HTTPS URL to the billing upgrade page. Always `https://taxoptimizer.ph/billing/upgrade`. |

---

### 6.8 `subscription.trial.ended`

```json
{
  "user_id": "usr_01hzxq2j3k4m5n6p7q8r9s0t1y",
  "subscription_id": "sub_01hzxq2j3k4m5n6p7q8r9s0t1z",
  "plan": "PRO",
  "trial_started_at": "2026-03-02T14:30:00.000Z",
  "trial_ended_at": "2026-03-16T14:30:00.000Z",
  "converted": false,
  "downgraded_to": "FREE"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `user_id` | string | UUID of the user. |
| `subscription_id` | string | UUID of the subscription row. |
| `plan` | string | The plan whose trial ended: `"PRO"` or `"ENTERPRISE"`. |
| `trial_started_at` | string | ISO 8601 UTC when the trial started. |
| `trial_ended_at` | string | ISO 8601 UTC when the trial expired. |
| `converted` | boolean | `true` if the user added payment and converted to paid before trial end. `false` if trial expired without conversion. |
| `downgraded_to` | string | `"FREE"` if `converted = false`. `null` if `converted = true` (user stays on paid plan). |

---

### 6.9 `subscription.activated`

```json
{
  "user_id": "usr_01hzxq2j3k4m5n6p7q8r9s0t1y",
  "subscription_id": "sub_01hzxq2j3k4m5n6p7q8r9s0t1z",
  "plan": "PRO",
  "billing_cycle": "MONTHLY",
  "amount_paid": "200.00",
  "currency": "PHP",
  "current_period_start": "2026-03-02T00:00:00.000Z",
  "current_period_end": "2026-04-02T00:00:00.000Z",
  "provider": "stripe",
  "provider_subscription_id": "sub_1QxxxxxxxxxxxxxxxxxX"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `user_id` | string | UUID of the user. |
| `subscription_id` | string | UUID of the TaxOptimizer subscription row. |
| `plan` | string | `"PRO"` or `"ENTERPRISE"`. |
| `billing_cycle` | string | `"MONTHLY"` or `"ANNUAL"`. |
| `amount_paid` | string | Amount charged for this billing cycle, as decimal string with 2 decimal places. Example: `"200.00"` for Pro monthly. |
| `currency` | string | Always `"PHP"`. |
| `current_period_start` | string | ISO 8601 UTC start of the new billing period. |
| `current_period_end` | string | ISO 8601 UTC end of the billing period (next renewal date). |
| `provider` | string | Payment provider that processed the transaction. `"stripe"` or `"paymongo"`. |
| `provider_subscription_id` | string | The payment provider's subscription identifier. |

---

### 6.10 `subscription.renewed`

```json
{
  "user_id": "usr_01hzxq2j3k4m5n6p7q8r9s0t1y",
  "subscription_id": "sub_01hzxq2j3k4m5n6p7q8r9s0t1z",
  "plan": "PRO",
  "billing_cycle": "MONTHLY",
  "amount_paid": "200.00",
  "currency": "PHP",
  "current_period_start": "2026-04-02T00:00:00.000Z",
  "current_period_end": "2026-05-02T00:00:00.000Z",
  "renewal_number": 2,
  "provider": "stripe",
  "provider_invoice_id": "in_1QxxxxxxxxxxxxxxxxX"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `user_id` | string | UUID of the user. |
| `subscription_id` | string | UUID of the TaxOptimizer subscription row. |
| `plan` | string | `"PRO"` or `"ENTERPRISE"`. |
| `billing_cycle` | string | `"MONTHLY"` or `"ANNUAL"`. |
| `amount_paid` | string | Amount charged for this renewal cycle, decimal string 2 dp. |
| `currency` | string | Always `"PHP"`. |
| `current_period_start` | string | ISO 8601 UTC start of the renewed billing period. |
| `current_period_end` | string | ISO 8601 UTC end of the renewed billing period. |
| `renewal_number` | integer | How many times this subscription has renewed. First renewal after initial activation is `2` (activation was `1`). Always ≥ 2. |
| `provider` | string | `"stripe"` or `"paymongo"`. |
| `provider_invoice_id` | string | The payment provider's invoice ID for this renewal. |

---

### 6.11 `subscription.payment_failed`

```json
{
  "user_id": "usr_01hzxq2j3k4m5n6p7q8r9s0t1y",
  "subscription_id": "sub_01hzxq2j3k4m5n6p7q8r9s0t1z",
  "plan": "PRO",
  "billing_cycle": "MONTHLY",
  "amount_attempted": "200.00",
  "currency": "PHP",
  "failure_reason": "card_declined",
  "provider": "stripe",
  "provider_invoice_id": "in_1QxxxxxxxxxxxxxxxxX",
  "new_status": "PAST_DUE",
  "grace_period_ends_at": "2026-04-05T00:00:00.000Z",
  "update_payment_url": "https://taxoptimizer.ph/billing/update-payment"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `user_id` | string | UUID of the user. |
| `subscription_id` | string | UUID of the TaxOptimizer subscription row. |
| `plan` | string | `"PRO"` or `"ENTERPRISE"`. |
| `billing_cycle` | string | `"MONTHLY"` or `"ANNUAL"`. |
| `amount_attempted` | string | Amount that was attempted to be charged, decimal string 2 dp. |
| `currency` | string | Always `"PHP"`. |
| `failure_reason` | string | Reason code from the payment provider. One of: `"card_declined"`, `"insufficient_funds"`, `"expired_card"`, `"card_velocity_exceeded"`, `"bank_not_supported"`, `"processing_error"`, `"authentication_required"`, `"unknown"`. |
| `provider` | string | `"stripe"` or `"paymongo"`. |
| `provider_invoice_id` | string | The payment provider's invoice ID for the failed attempt. |
| `new_status` | string | Always `"PAST_DUE"` for this event type. |
| `grace_period_ends_at` | string | ISO 8601 UTC when the grace period ends. Computed as `now + 3 days`. After this, subscription status becomes `EXPIRED` if payment is not updated. |
| `update_payment_url` | string | Full HTTPS URL to the payment update page. Always `https://taxoptimizer.ph/billing/update-payment`. |

---

### 6.12 `subscription.cancelled`

```json
{
  "user_id": "usr_01hzxq2j3k4m5n6p7q8r9s0t1y",
  "subscription_id": "sub_01hzxq2j3k4m5n6p7q8r9s0t1z",
  "plan": "PRO",
  "billing_cycle": "MONTHLY",
  "cancelled_at": "2026-03-15T10:00:00.000Z",
  "access_until": "2026-04-02T00:00:00.000Z",
  "cancellation_reason": "too_expensive",
  "cancel_at_period_end": true
}
```

| Field | Type | Description |
|-------|------|-------------|
| `user_id` | string | UUID of the user. |
| `subscription_id` | string | UUID of the subscription row. |
| `plan` | string | `"PRO"` or `"ENTERPRISE"`. |
| `billing_cycle` | string | `"MONTHLY"` or `"ANNUAL"`. |
| `cancelled_at` | string | ISO 8601 UTC when the user submitted the cancellation request. |
| `access_until` | string | ISO 8601 UTC until which the user retains Pro/Enterprise access. Equal to the subscription's `current_period_end`. |
| `cancellation_reason` | string or null | Reason selected by the user on the cancellation form. One of: `"too_expensive"`, `"not_using_it"`, `"missing_features"`, `"switching_to_cpa"`, `"one_time_use"`, `"other"`. `null` if the user skipped the reason question. |
| `cancel_at_period_end` | boolean | Always `true` for this event type. Access continues until the end of the current billing period. |

---

### 6.13 `subscription.expired`

```json
{
  "user_id": "usr_01hzxq2j3k4m5n6p7q8r9s0t1y",
  "subscription_id": "sub_01hzxq2j3k4m5n6p7q8r9s0t1z",
  "previous_plan": "PRO",
  "expired_at": "2026-04-02T00:00:00.000Z",
  "expiry_reason": "period_end_after_cancellation",
  "current_plan": "FREE"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `user_id` | string | UUID of the user. |
| `subscription_id` | string | UUID of the subscription row. |
| `previous_plan` | string | The plan that just expired: `"PRO"` or `"ENTERPRISE"`. |
| `expired_at` | string | ISO 8601 UTC when expiry was processed. |
| `expiry_reason` | string | Reason for expiry. One of: `"period_end_after_cancellation"` (user cancelled and period ended), `"payment_retries_exhausted"` (all payment retries failed after PAST_DUE), `"trial_expired_no_conversion"` (trial ended without adding payment). |
| `current_plan` | string | Always `"FREE"` after expiry. |

---

### 6.14 `subscription.plan_changed`

```json
{
  "user_id": "usr_01hzxq2j3k4m5n6p7q8r9s0t1y",
  "subscription_id": "sub_01hzxq2j3k4m5n6p7q8r9s0t1z",
  "previous_plan": "PRO",
  "new_plan": "ENTERPRISE",
  "change_type": "upgrade",
  "previous_billing_cycle": "MONTHLY",
  "new_billing_cycle": "ANNUAL",
  "effective_at": "2026-03-15T00:00:00.000Z",
  "proration_amount": "1180.00",
  "currency": "PHP"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `user_id` | string | UUID of the user. |
| `subscription_id` | string | UUID of the subscription row. |
| `previous_plan` | string | Previous plan: `"FREE"`, `"PRO"`, or `"ENTERPRISE"`. |
| `new_plan` | string | New plan: `"FREE"`, `"PRO"`, or `"ENTERPRISE"`. |
| `change_type` | string | `"upgrade"` (moving to a higher tier or from monthly to annual) or `"downgrade"` (moving to lower tier). Determined by the platform based on plan hierarchy: FREE < PRO < ENTERPRISE, and MONTHLY < ANNUAL for same tier. |
| `previous_billing_cycle` | string or null | `"MONTHLY"`, `"ANNUAL"`, or `null` for FREE. |
| `new_billing_cycle` | string or null | `"MONTHLY"`, `"ANNUAL"`, or `null` for FREE. |
| `effective_at` | string | ISO 8601 UTC when the plan change took effect. For upgrades this is immediately. For downgrades this is the start of the next billing cycle. |
| `proration_amount` | string | The proration charge (positive = charged, negative = credited) in PHP, decimal string 2 dp. `"0.00"` if no proration was applied (e.g., end-of-cycle downgrade). |
| `currency` | string | Always `"PHP"`. |

---

### 6.15 `client.added`

```json
{
  "cpa_user_id": "usr_01hzxq2j3k4m5n6p7q8r9s0t1y",
  "client_id": "cli_01hzxq2j3k4m5n6p7q8r9s0t1a",
  "client_user_id": "usr_01hzxq2j3k4m5n6p7q8r9s0t1b",
  "display_name": "Juan dela Cruz",
  "added_at": "2026-03-02T14:30:00.000Z"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `cpa_user_id` | string | UUID of the CPA user who added the client. |
| `client_id` | string | UUID of the `cpa_clients` row. This is the CPA-client relationship ID, not the client's user ID. |
| `client_user_id` | string | UUID of the client's TaxOptimizer user account. |
| `display_name` | string | The display name set for this client in the CPA's roster. Max 200 chars. |
| `added_at` | string | ISO 8601 UTC when the client was added. |

---

### 6.16 `client.removed`

```json
{
  "cpa_user_id": "usr_01hzxq2j3k4m5n6p7q8r9s0t1y",
  "client_id": "cli_01hzxq2j3k4m5n6p7q8r9s0t1a",
  "client_user_id": "usr_01hzxq2j3k4m5n6p7q8r9s0t1b",
  "display_name": "Juan dela Cruz",
  "removed_at": "2026-03-02T14:30:00.000Z"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `cpa_user_id` | string | UUID of the CPA user who removed the client. |
| `client_id` | string | UUID of the now-deleted `cpa_clients` row. |
| `client_user_id` | string | UUID of the client's TaxOptimizer user account. |
| `display_name` | string | The display name the client had in the CPA's roster at the time of removal. |
| `removed_at` | string | ISO 8601 UTC when the removal occurred. |

---

## 7. HMAC-SHA256 Signature Validation

Every outbound webhook request includes an `X-TaxOptimizer-Signature` header. The receiver must validate this signature to confirm the request originated from TaxOptimizer and that the payload was not tampered with in transit.

### 7.1 Signature Header Format

```
X-TaxOptimizer-Signature: sha256=a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4
```

- The value is always the literal string `sha256=` followed by exactly 64 lowercase hexadecimal characters.
- The 64 hex characters represent 32 bytes (256 bits) — the raw HMAC-SHA256 digest encoded as lowercase hex.

### 7.2 Signature Computation Algorithm

TaxOptimizer computes the signature as follows, using the **raw request body bytes** (before any JSON parsing) and the endpoint's **secret key**:

```
signature = HMAC-SHA256(key=endpoint_secret, message=raw_request_body_bytes)
header_value = "sha256=" + hex_encode_lowercase(signature)
```

**Key details:**
- `endpoint_secret` is the full string value returned at endpoint creation (e.g., `whsec_a1b2c3d4...`), encoded as UTF-8 bytes. The `whsec_` prefix is included in the key material.
- `raw_request_body_bytes` is the exact bytes received by the endpoint over the network — the UTF-8 encoded JSON string, with no modifications (no whitespace normalization, no re-serialization).
- The HMAC uses SHA-256 as the underlying hash function.
- The signature is the full 32-byte HMAC digest, hex-encoded as 64 lowercase characters.

### 7.3 Receiver Validation Pseudocode

```python
import hmac
import hashlib

def validate_webhook_signature(
    raw_body: bytes,
    signature_header: str,
    secret: str
) -> bool:
    # Step 1: Parse the header value
    if not signature_header.startswith("sha256="):
        return False  # Wrong format; reject
    received_hex = signature_header[len("sha256="):]

    # Step 2: Compute expected signature
    expected_digest = hmac.new(
        key=secret.encode("utf-8"),
        msg=raw_body,
        digestmod=hashlib.sha256
    ).digest()
    expected_hex = expected_digest.hex()  # 64 lowercase hex chars

    # Step 3: Timing-safe comparison (see §7.4)
    return hmac.compare_digest(expected_hex, received_hex)
```

**Node.js equivalent:**
```javascript
import { createHmac, timingSafeEqual } from 'crypto';

function validateWebhookSignature(
  rawBody: Buffer,
  signatureHeader: string,
  secret: string
): boolean {
  if (!signatureHeader.startsWith('sha256=')) return false;
  const receivedHex = signatureHeader.slice('sha256='.length);

  const expectedHex = createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  // timingSafeEqual requires equal-length buffers
  const expectedBuf = Buffer.from(expectedHex, 'utf8');
  const receivedBuf = Buffer.from(receivedHex, 'utf8');
  if (expectedBuf.length !== receivedBuf.length) return false;

  return timingSafeEqual(expectedBuf, receivedBuf);
}
```

### 7.4 Timing-Safe Comparison Requirement

The final string comparison MUST use a constant-time (timing-safe) comparison function, NOT a naive `===` string equality check. A naive check exits early on the first differing character, creating a timing side-channel that allows attackers to forge valid signatures by measuring response times.

- Python: use `hmac.compare_digest(a, b)` (constant time for equal-length strings)
- Node.js: use `crypto.timingSafeEqual(bufA, bufB)` (constant time for equal-length Buffers)
- PHP: use `hash_equals($expected, $received)` (constant time)
- Go: use `subtle.ConstantTimeCompare(a, b)` from `crypto/subtle` (constant time)
- Any other language: use the language's cryptographic library constant-time comparison function

Comparing buffers of different lengths is always a length-revealing side-channel. If the lengths differ, return `false` immediately without invoking the timing-safe comparator (as done in the Node.js example above, where the differing-length case is already `false`).

---

## 8. Retry Policy

### 8.1 Retry Trigger Conditions

A webhook delivery attempt is considered **failed** and eligible for retry when the TaxOptimizer delivery worker receives any of the following responses within the 30-second timeout window:

| Condition | Description |
|-----------|-------------|
| HTTP 5xx status code | Any 500–599 response. The receiving server encountered an error. |
| HTTP 429 status code | The receiving server is rate-limiting TaxOptimizer's delivery. |
| Connection refused | The endpoint URL's server is unreachable (DNS resolved but connection rejected). |
| DNS resolution failure | The endpoint URL's hostname cannot be resolved. |
| TLS/SSL handshake failure | SSL certificate invalid, expired, or hostname mismatch. |
| Timeout after 30 seconds | No complete HTTP response received within 30 seconds of opening the connection. |
| Connection reset | TCP connection reset by the receiver during request sending or response receipt. |

A webhook delivery is considered **successful** (no retry) when the TaxOptimizer worker receives:
- Any HTTP 2xx status code (200, 201, 202, 204, etc.) within 30 seconds.

HTTP 4xx responses (except 429) are considered **non-retryable failures**: they indicate a client error (invalid URL, authentication issue, etc.) that repeated delivery will not fix. The delivery is marked `FAILED` immediately and no retries are scheduled.

### 8.2 Retry Schedule

When an attempt fails with a retryable condition, subsequent retry attempts are scheduled according to this exponential backoff table:

| Attempt Number | Delay After Previous Failure | Cumulative Elapsed Time | Jitter Applied |
|---------------|------------------------------|-------------------------|---------------|
| 1 (initial) | 0 (immediate after event) | 0 seconds | None |
| 2 (first retry) | 10 seconds | 10 seconds | ±2 seconds uniform random |
| 3 (second retry) | 30 seconds | 40 seconds | ±5 seconds uniform random |
| 4 (third retry) | 5 minutes (300 seconds) | ~340 seconds (~5.7 min) | ±30 seconds uniform random |
| 5 (fourth retry) | 30 minutes (1800 seconds) | ~2140 seconds (~35.7 min) | ±120 seconds uniform random |
| 6 (fifth retry) | 2 hours (7200 seconds) | ~9340 seconds (~2.6 hours) | ±300 seconds uniform random |

After attempt 6 (the 5th retry) fails, no further attempts are made. The delivery status is set to `EXHAUSTED`.

**Total delivery window:** Approximately 2.6 hours from the initial event occurrence to final failure.

**Jitter:** Each retry delay has uniform random jitter added to prevent thunderstorm effects when multiple endpoints fail simultaneously. The jitter range is listed in the table above. The minimum applied delay is always `max(1, scheduled_delay + jitter)` seconds — jitter never produces a delay below 1 second.

### 8.3 Retry State Machine

```
(Event occurs)
      │
      ▼
  ATTEMPTING ──── 2xx response ──────────────────────────────► DELIVERED
      │
      ├── 4xx response (non-429) ─────────────────────────────► FAILED
      │                                                          (no retry)
      │
      ├── 5xx / 429 / timeout / connection error
      │           │
      │           ▼
      │     (Schedule retry attempt N+1)
      │     (If attempt N < 6: wait delay, return to ATTEMPTING)
      │     (If attempt N = 6: mark EXHAUSTED)
      │
      └── (max attempts reached) ──────────────────────────────► EXHAUSTED
```

States:
- `ATTEMPTING`: A delivery is in progress or the first attempt has not yet occurred.
- `DELIVERED`: The most recent attempt received a 2xx HTTP response. Terminal state.
- `FAILED`: The most recent attempt received a non-retryable error (4xx non-429). Terminal state.
- `EXHAUSTED`: All 6 delivery attempts were made and none succeeded. Terminal state.

### 8.4 Failure Escalation

There is no automatic alerting or email to the Enterprise user when a delivery is `EXHAUSTED`. The user can monitor delivery status via:
1. `GET /webhook-endpoints/:endpoint_id/deliveries` — delivery history API
2. The TaxOptimizer dashboard under Settings → Webhooks → Delivery History

If 3 or more deliveries to the same endpoint reach `EXHAUSTED` status within a 24-hour window, the endpoint is automatically **disabled** (`enabled = false`) and a `webhook.endpoint.auto_disabled` system event is logged to `webhook_deliveries` (but NOT delivered to any endpoint, since delivery is now disabled). Re-enabling the endpoint requires a `PATCH /webhook-endpoints/:endpoint_id` with `{ "enabled": true }`.

**Rationale for auto-disable:** Prevents accumulating unbounded retry queues for permanently unavailable endpoints.

---

## 9. Event Delivery Guarantees

### 9.1 At-Least-Once Delivery

TaxOptimizer guarantees **at-least-once** delivery: each event will be delivered to each subscribed endpoint at least once, given that the endpoint is reachable within the retry window (approximately 2.6 hours).

**Not guaranteed:** Exactly-once delivery. In rare circumstances (e.g., network partition causing ambiguous delivery status), TaxOptimizer may dispatch a delivery attempt more than once for the same event. Receivers MUST be idempotent.

### 9.2 Idempotency

Each event has a stable, globally unique `id` in the envelope (the `evt_` prefixed string). Each delivery attempt has a unique `X-TaxOptimizer-Delivery` header value (the `whd_` prefixed string).

Receivers should de-duplicate on `event.id` (not on `delivery_id`), storing successfully processed event IDs in a local set (with an expiry window of at least 72 hours to cover the full retry window). On receiving an event:

```
1. Parse envelope, extract event.id
2. Check if event.id has been processed before
   a. If yes: return 200 immediately (idempotent no-op)
   b. If no: process the event, then mark event.id as seen, then return 200
```

### 9.3 Ordering

- No ordering guarantee exists between different event types.
- For a single resource and event type (e.g., successive `batch.job.*` events for the same `batch_id`), TaxOptimizer dispatches events in the order they occur. However, network conditions can cause out-of-order receipt.
- Receivers should use `occurred_at` to determine event ordering when processing a stream of events for the same resource.

### 9.4 Event Persistence

Events are stored in the database (`webhook_deliveries` table) for 30 days from the event's `occurred_at` timestamp. After 30 days, both the delivery records and the event payloads are deleted by the scheduled cleanup job. Receivers should not rely on TaxOptimizer's event history as their system of record.

### 9.5 Disabled Endpoint Behavior

If an endpoint is `enabled = false` at the time an event would be delivered:
- The event is NOT queued for that endpoint.
- No delivery record is created for the skipped delivery.
- The event is permanently lost for that endpoint — it will not be delivered retroactively when the endpoint is re-enabled.

**Implication:** Enterprise users who temporarily disable endpoints will miss events during the disabled window. This is by design — re-enabling creates no backfill.

---

## 10. Database Tables for Webhooks

The following DDL is additive to `database/schema.md`. These tables must be included in the initial migration.

### 10.1 `webhook_endpoints`

One row per registered webhook endpoint per Enterprise user account.

```sql
-- 2.11 Webhook delivery status
CREATE TYPE webhook_delivery_status_enum AS ENUM (
  'ATTEMPTING',  -- In progress or awaiting first dispatch.
  'DELIVERED',   -- 2xx received. Terminal.
  'FAILED',      -- Non-retryable 4xx received. Terminal.
  'EXHAUSTED'    -- All 6 attempts failed with retryable errors. Terminal.
);

CREATE TABLE webhook_endpoints (
  id                UUID          NOT NULL DEFAULT gen_random_uuid(),
  -- Internal primary key. Referenced by webhook_deliveries.
  -- NOT the external-facing endpoint ID string. The external-facing ID
  -- is derived via: 'whe_' || base62_encode(id). See §3.1.

  user_id           UUID          NOT NULL,
  -- Owner. Must be an Enterprise subscriber. Enforced at API layer.

  url               TEXT          NOT NULL,
  -- HTTPS URL to POST events to. Max 2048 chars.
  -- Validated at creation: must be HTTPS, non-private, non-loopback.

  description       TEXT          NOT NULL DEFAULT '',
  -- Human-readable label. Max 200 chars. May be empty string.

  secret_hash       TEXT          NOT NULL,
  -- Argon2id hash of the raw secret (whsec_... string).
  -- The raw secret is shown only at creation and never stored in plaintext.
  -- Hashing parameters: same as user passwords (see api/auth.md §5.1):
  --   memory: 65536 KiB, iterations: 3, parallelism: 4, hash_length: 32.
  -- Used only for verification if needed; signature is computed from raw secret
  -- stored only in memory during the request lifecycle (fetched from a KMS
  -- or encrypted column — see WEBHOOK_SECRET_ENCRYPTION_KEY env var).

  secret_encrypted  BYTEA         NOT NULL,
  -- AES-256-GCM encrypted raw secret. Encryption key from
  -- WEBHOOK_SECRET_ENCRYPTION_KEY environment variable (32-byte key,
  -- base64 URL-encoded). Needed to re-derive the HMAC for outgoing requests.
  -- Format: 12-byte nonce || ciphertext (nonce prepended, not separate column).

  events            TEXT[]        NOT NULL DEFAULT ARRAY[]::TEXT[],
  -- Subscribed event type strings. Empty array = all events.
  -- Each element is a valid event type from §5 (e.g., 'batch.job.completed').
  -- Validated at API layer against the canonical event type list.

  enabled           BOOLEAN       NOT NULL DEFAULT TRUE,
  -- FALSE = endpoint will not receive any events until re-enabled.

  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT webhook_endpoints_pkey
    PRIMARY KEY (id),

  CONSTRAINT webhook_endpoints_user_fk
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

  CONSTRAINT webhook_endpoints_url_max_length
    CHECK (char_length(url) <= 2048),

  CONSTRAINT webhook_endpoints_description_max_length
    CHECK (char_length(description) <= 200),

  CONSTRAINT webhook_endpoints_url_https
    CHECK (url LIKE 'https://%'),

  CONSTRAINT webhook_endpoints_user_url_unique
    UNIQUE (user_id, url),
  -- One endpoint per URL per user. Prevents duplicate registration.

  CONSTRAINT webhook_endpoints_per_user_limit
    -- Enforced at the API layer (not DB), but documented here:
    -- Max 5 webhook_endpoints rows per user_id. Checked via count query
    -- before INSERT. DB does not enforce this via constraint.
    -- Included as a note, not a real SQL constraint.
    CHECK (true)
);

CREATE TRIGGER webhook_endpoints_updated_at
  BEFORE UPDATE ON webhook_endpoints
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Index: find all endpoints for a user (list all, create checks)
CREATE INDEX webhook_endpoints_user_idx
  ON webhook_endpoints (user_id);

-- Index: find enabled endpoints subscribed to a given event type
-- Used by the event dispatcher to find which endpoints to notify.
-- GIN index on the events array for @> (contains) queries:
CREATE INDEX webhook_endpoints_events_gin_idx
  ON webhook_endpoints USING GIN (events)
  WHERE enabled = TRUE;
```

### 10.2 `webhook_deliveries`

One row per delivery attempt per event per endpoint.

```sql
CREATE TABLE webhook_deliveries (
  id                    UUID                           NOT NULL DEFAULT gen_random_uuid(),
  -- Primary key. External-facing delivery ID: 'whd_' || base62_encode(id).

  endpoint_id           UUID                           NOT NULL,
  -- References webhook_endpoints.id.

  event_id              TEXT                           NOT NULL,
  -- Stable event ID (the evt_... string from the event envelope).
  -- NOT a foreign key — events are not stored as their own table rows;
  -- the payload is stored in this row.

  event_type            TEXT                           NOT NULL,
  -- Event type string (e.g., 'batch.job.completed'). Denormalized for
  -- efficient filtering without JSON parsing.

  event_payload         JSONB                          NOT NULL,
  -- Full event JSON payload (the complete envelope including 'data').
  -- Stored to allow re-delivery inspection and future re-delivery support.

  status                webhook_delivery_status_enum   NOT NULL DEFAULT 'ATTEMPTING',

  attempt_count         SMALLINT                       NOT NULL DEFAULT 0,
  -- Number of delivery attempts made so far. Incremented on each attempt.
  -- Range: 0 (not yet attempted) to 6 (all attempts exhausted).

  last_attempted_at     TIMESTAMPTZ                    NULL,
  -- Timestamp of the most recent delivery attempt. NULL if not yet attempted.

  delivered_at          TIMESTAMPTZ                    NULL,
  -- Timestamp when a 2xx response was received. NULL until DELIVERED.

  next_retry_at         TIMESTAMPTZ                    NULL,
  -- When the next retry attempt is scheduled. NULL if DELIVERED, FAILED,
  -- or EXHAUSTED. Set by the retry scheduler after each failed attempt.

  response_status_code  SMALLINT                       NULL,
  -- HTTP status code from the most recent attempt response.
  -- NULL if no HTTP response was received (timeout, connection error).
  -- Range: 100–599.

  response_body_preview TEXT                           NULL,
  -- First 500 bytes of the response body from the most recent attempt.
  -- NULL if no response body received.

  error_detail          TEXT                           NULL,
  -- Human-readable description of non-HTTP errors (timeout, DNS failure,
  -- TLS error, connection refused). NULL if HTTP response was received.
  -- Examples: 'timeout after 30s', 'dns_resolution_failed: NXDOMAIN',
  -- 'tls_handshake_failed: certificate expired 2026-01-15'.

  created_at            TIMESTAMPTZ                    NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ                    NOT NULL DEFAULT NOW(),

  CONSTRAINT webhook_deliveries_pkey
    PRIMARY KEY (id),

  CONSTRAINT webhook_deliveries_endpoint_fk
    FOREIGN KEY (endpoint_id) REFERENCES webhook_endpoints(id) ON DELETE CASCADE,

  CONSTRAINT webhook_deliveries_attempt_count_range
    CHECK (attempt_count BETWEEN 0 AND 6),

  CONSTRAINT webhook_deliveries_status_delivered_consistency
    CHECK (
      (status = 'DELIVERED' AND delivered_at IS NOT NULL) OR
      (status != 'DELIVERED' AND delivered_at IS NULL)
    ),

  CONSTRAINT webhook_deliveries_response_code_range
    CHECK (response_status_code IS NULL OR response_status_code BETWEEN 100 AND 599)
);

CREATE TRIGGER webhook_deliveries_updated_at
  BEFORE UPDATE ON webhook_deliveries
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Index: delivery history for a specific endpoint, newest first
-- Used by: GET /webhook-endpoints/:id/deliveries
CREATE INDEX webhook_deliveries_endpoint_created_idx
  ON webhook_deliveries (endpoint_id, created_at DESC);

-- Index: find pending retries to process (retry scheduler job)
-- Used by the background retry worker every 5 seconds.
CREATE INDEX webhook_deliveries_next_retry_idx
  ON webhook_deliveries (next_retry_at)
  WHERE status = 'ATTEMPTING' AND next_retry_at IS NOT NULL;

-- Index: find all deliveries for a given event (de-duplication check)
-- Used by the dispatcher before creating a new delivery record.
CREATE INDEX webhook_deliveries_event_id_idx
  ON webhook_deliveries (event_id);

-- Partial index: find EXHAUSTED deliveries by endpoint for auto-disable logic
CREATE INDEX webhook_deliveries_exhausted_endpoint_idx
  ON webhook_deliveries (endpoint_id, created_at DESC)
  WHERE status = 'EXHAUSTED';
```

---

## 11. Event Filtering Per Endpoint

When an event occurs, the delivery dispatcher queries the `webhook_endpoints` table to find all enabled endpoints for the user that should receive this event:

```sql
SELECT id, url, secret_encrypted
FROM webhook_endpoints
WHERE user_id = $1
  AND enabled = TRUE
  AND (
    events = ARRAY[]::TEXT[]         -- empty array = subscribed to ALL events
    OR $2 = ANY(events)              -- OR this specific event type is in the array
  );
```

Where `$1` is the `user_id` and `$2` is the event type string (e.g., `'batch.job.completed'`).

For each matching endpoint, a `webhook_deliveries` row is inserted and the delivery is queued in Redis for the worker.

**Idempotency at dispatch:** Before inserting a new `webhook_deliveries` row, the dispatcher checks:

```sql
SELECT COUNT(*) FROM webhook_deliveries
WHERE event_id = $1 AND endpoint_id = $2;
```

If count > 0, the delivery for this `(event_id, endpoint_id)` pair already exists (duplicate dispatch protection). The dispatcher skips insertion and does not queue a new delivery attempt.

---

## 12. Security Requirements for Receiver URLs

The following URL categories are rejected at registration time with `400 ERR_VALIDATION_FAILED`:

| Category | Rejected Pattern | Reason |
|---------|-----------------|--------|
| HTTP (not HTTPS) | Any URL with `http://` scheme | Webhook payloads may contain sensitive subscription data; must be encrypted in transit |
| Loopback | `127.0.0.1`, `::1`, `localhost` (resolved to 127.x or ::1) | SSRF prevention |
| Private IPv4 ranges | `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16` | SSRF prevention |
| Link-local | `169.254.0.0/16`, `fe80::/10` | SSRF prevention |
| Multicast | `224.0.0.0/4`, `ff00::/8` | SSRF prevention |
| Private IPv6 ranges | `fc00::/7` (ULA) | SSRF prevention |
| Reserved/unspecified | `0.0.0.0`, `::` | Invalid destination |
| URL without a public TLD | Bare hostnames like `http://internal-server` | Must have a valid public domain |

**DNS rebinding prevention:** The IP address check is performed at the DNS resolution time immediately before each delivery attempt, not only at registration time. If the resolved IP falls into any of the blocked ranges, the delivery attempt fails with a non-retryable error (the delivery status is set to `FAILED` immediately with `error_detail = 'ssrf_blocked: resolved_ip_in_private_range'`).

---

## 13. Rate Limits for Webhook Management API

Webhook management endpoints share the `GENERAL` rate limit group defined in `api/rate-limiting.md`. No separate group is defined for webhook endpoints.

| Tier | Requests per minute | Requests per hour |
|------|---------------------|-------------------|
| FREE | Not applicable (webhook management requires Enterprise) | Not applicable |
| PRO | Not applicable | Not applicable |
| ENTERPRISE | 30/minute | 200/hour |

`POST /webhook-endpoints/:id/test` has a per-endpoint additional limit of 3 test deliveries per endpoint per hour (enforced in application logic, not via Redis rate limiter).

---

## 14. Environment Variables

The following environment variables are required for the webhook delivery subsystem. Add to `deployment/environment.md`.

| Variable | Required | Description | Example Value |
|----------|----------|-------------|---------------|
| `WEBHOOK_SECRET_ENCRYPTION_KEY` | Yes | 32-byte AES-256-GCM key for encrypting webhook endpoint secrets at rest. Base64 URL-encoded (no padding). Must be exactly 43 characters (32 bytes → base64url). Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` | `aBcDeFgHiJkLmNoPqRsTuVwXyZ0123456789abcde` (example, not real) |
| `WEBHOOK_DELIVERY_CONCURRENCY` | No | Number of concurrent webhook delivery workers. Default: `10`. Higher values increase delivery throughput but also increase outbound HTTP connection load. | `10` |
| `WEBHOOK_DELIVERY_TIMEOUT_SECONDS` | No | Timeout in seconds for outgoing webhook HTTP requests. Default: `30`. Must be between 5 and 60. | `30` |
| `WEBHOOK_RETRY_QUEUE_KEY` | No | Redis key prefix for the webhook retry queue. Default: `wh:retry:`. | `wh:retry:` |

---

*Cross-reference: `database/schema.md` must be updated to include the `webhook_delivery_status_enum`, `webhook_endpoints`, and `webhook_deliveries` DDL from §10 above. The `database/migrations.md` spec must include these tables in the initial migration.*
