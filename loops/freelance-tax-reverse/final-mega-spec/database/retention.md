# Data Retention Policy — TaxKlaro

**Status:** COMPLETE
**Last updated:** 2026-03-02
**Cross-references:**
- Database schema (table definitions): [database/schema.md](schema.md)
- Auth (soft-delete and hard-delete procedures): [api/auth.md](../api/auth.md)
- Privacy policy (retention disclosures): [legal/privacy-policy.md](../legal/privacy-policy.md)
- CI/CD (scheduled cleanup jobs): [deployment/ci-cd.md](../deployment/ci-cd.md)
- Premium tiers (data access by tier): [premium/tiers.md](../premium/tiers.md)

---

## Table of Contents

1. [Retention Principles](#1-retention-principles)
2. [Retention Schedule by Table](#2-retention-schedule-by-table)
3. [User Account Lifecycle](#3-user-account-lifecycle)
4. [Computation Record Lifecycle](#4-computation-record-lifecycle)
5. [Session and Token Lifecycle](#5-session-and-token-lifecycle)
6. [Billing Record Lifecycle](#6-billing-record-lifecycle)
7. [Audit Log Lifecycle](#7-audit-log-lifecycle)
8. [PDF Export Lifecycle](#8-pdf-export-lifecycle)
9. [Scheduled Cleanup Jobs](#9-scheduled-cleanup-jobs)
10. [Legal Basis for Retention Periods](#10-legal-basis-for-retention-periods)
11. [Right to Erasure (Data Subject Request)](#11-right-to-erasure-data-subject-request)
12. [Data Residency and Backup Retention](#12-data-residency-and-backup-retention)

---

## 1. Retention Principles

### 1.1 Governing Framework

TaxKlaro's data retention policy is designed to satisfy three overlapping obligations:

1. **Philippine Data Privacy Act (DPA) of 2012 (RA 10173)**: Personal information may only be retained for as long as necessary for the declared purpose. Obsolete or no longer necessary data must be disposed of securely.
2. **National Internal Revenue Code (NIRC) record-keeping**: Taxpayers are legally required to keep books and records for 10 years (ordinary assessment period: 3 years from filing deadline; extraordinary period: 10 years for fraud/non-filing). TaxKlaro does NOT act as the taxpayer's record-keeper, but its service logs support audit traceability.
3. **Product functionality**: Computation history (for returning users to reference past tax years) and billing history (for subscription and invoice disputes) have legitimate product-function retention needs.

### 1.2 Minimization Default

Where no legal obligation requires longer retention, TaxKlaro applies the shorter period. Anonymized or aggregated data (no PII, no linked user ID) may be retained indefinitely for product analytics.

---

## 2. Retention Schedule by Table

| Table | Retention Rule | Purge Trigger | Anonymize or Delete |
|-------|---------------|---------------|---------------------|
| `users` | Retained while account active. Soft-deleted on user request. Hard-deleted 90 days after soft-delete. | `deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '90 days'` | Hard delete row; PII anonymized at soft-delete time (see §3) |
| `user_sessions` | Expired sessions: 30 days after expiry. Active sessions: revoked on user logout or account delete. | `expires_at < NOW() - INTERVAL '30 days'` | Hard delete row |
| `oauth_accounts` | Deleted with parent user (CASCADE) | Parent `users` delete | Cascade |
| `email_verification_tokens` | 24 hours after creation (expired or used) | `expires_at < NOW()` | Hard delete row |
| `password_reset_tokens` | 1 hour after creation (expired or used) | `expires_at < NOW()` | Hard delete row |
| `computations` | Retained for active users indefinitely (product value). Retained 90 days after account soft-delete (tax audit support). | Parent user hard-deleted after 90-day window | Hard delete row (CASCADE from users) |
| `computation_cwt_entries` | Same lifecycle as parent `computations` | CASCADE from computations | Cascade |
| `computation_quarterly_payments` | Same lifecycle as parent `computations` | CASCADE from computations | Cascade |
| `subscriptions` | Retained 7 years after expiry (billing dispute / tax documentation) | `status = 'EXPIRED' AND updated_at < NOW() - INTERVAL '7 years'` | Hard delete row |
| `invoices` | Retained 7 years after invoice date (official receipt obligation under NIRC Sec. 237) | `created_at < NOW() - INTERVAL '7 years'` | Hard delete row |
| `cpa_clients` | Retained while parent CPA user active. Deleted when client user hard-deleted. | CPA user hard-delete OR client user hard-delete | Hard delete row |
| `api_keys` | Retained until explicitly revoked or user deleted | User hard-delete | Cascade |
| `audit_logs` | Retained 1 year from log entry date | `created_at < NOW() - INTERVAL '1 year'` | Hard delete row |
| `pdf_exports` | R2 object: deleted 30 days after creation (signed URL expires at 7 days; 30-day hard cutoff). DB row: deleted when R2 object is deleted. | `created_at < NOW() - INTERVAL '30 days'` | Hard delete row + R2 `DeleteObject` |
| `batch_jobs` | Retained 90 days after completion/failure | `status IN ('COMPLETED','FAILED') AND updated_at < NOW() - INTERVAL '90 days'` | Hard delete row |

---

## 3. User Account Lifecycle

### 3.1 Active Account

An active account is any `users` row where `deleted_at IS NULL`. All data linked to an active account is retained indefinitely.

### 3.2 Soft Delete (User-Initiated Deletion)

When a user requests account deletion via `DELETE /v1/users/me`:

1. `users.deleted_at` is set to `NOW()`.
2. All `user_sessions` for the user are deleted immediately.
3. Any active subscription is set to cancel at period end (not immediate) via PayMongo/Stripe API.
4. PII is anonymized **immediately** at soft-delete time:
   - `users.email` → `deleted-{uuid}@deleted.invalid`
   - `users.tin` → `NULL`
   - `users.rdo_code` → `NULL`
   - `users.psic_code` → `NULL`
   - `users.contact_number` → `NULL`
   - `users.birthday` → `NULL`
   - `users.registered_address` → `NULL`
   - `users.business_name` → `NULL`
   - `users.full_name` → `Deleted User`
5. `users.password_hash` → `NULL` (login disabled immediately).
6. Computation records are retained for 90 days with `user_id` still linked (supports tax audit queries for that window).

The user cannot log in after soft-delete. The user cannot re-register with the same email (because the email is now `deleted-{uuid}@deleted.invalid`). If the user changes their mind within 90 days, they must contact support — account recovery is possible within the 90-day window by reversing `deleted_at` and restoring PII from an offline backup if retained.

### 3.3 Hard Delete (Scheduled Job)

A daily cron job (see [deployment/ci-cd.md §10](../deployment/ci-cd.md)) runs at 03:00 PHT and executes:

```sql
-- Hard-delete users soft-deleted more than 90 days ago
DELETE FROM users
WHERE deleted_at IS NOT NULL
  AND deleted_at < NOW() - INTERVAL '90 days';
```

`ON DELETE CASCADE` on the `users.id` foreign key propagates this deletion to all dependent tables: `user_sessions`, `oauth_accounts`, `computations`, `computation_cwt_entries`, `computation_quarterly_payments`, `subscriptions` (except those past 7-year billing retention — see §6), `api_keys`, `cpa_clients`, `audit_logs`, `pdf_exports`.

**Exception for `invoices`**: Invoices are not CASCADE-deleted because they must be retained 7 years for official receipt obligations. When a user is hard-deleted, invoice rows retain their data but `user_id` is set to `NULL` (invoices table has `user_id REFERENCES users(id) ON DELETE SET NULL`).

---

## 4. Computation Record Lifecycle

### 4.1 Active User Computations

For active (non-deleted) users, computation records are retained indefinitely. Users on the Free tier can retrieve their 10 most recent computations; Pro users can retrieve all computations with full history. The data is never automatically deleted for active users.

### 4.2 Computation Anonymization

There is no anonymization of computations for active users. Computations are personal tax data linked to the user. They are only anonymized as part of account deletion (see §3).

### 4.3 Post-Deletion Retention Window

After an account soft-delete, computation records are retained for 90 days. This window exists because:
- The taxpayer may need to prove they used a compliant tax computation method during a BIR audit initiated within the 3-year ordinary assessment period.
- The 90-day window gives the deleted user time to request a data export before data is permanently destroyed.

After 90 days, computations are cascade-deleted with the parent user row.

### 4.4 Aggregated Analytics (No PII)

After computation records are deleted, aggregated non-PII statistics (e.g., count of computations by tax year, regime distribution percentages, average savings amounts with no user linkage) may be retained indefinitely for product analytics. These are written to a separate `analytics_snapshots` table (not defined in schema.md because it contains no PII) and are not subject to DPA retention limits.

---

## 5. Session and Token Lifecycle

### 5.1 Active Sessions

An active session is any `user_sessions` row where `expires_at > NOW()` and `revoked_at IS NULL`. Active sessions roll their `expires_at` 30 days forward on every authenticated request, up to a 365-day absolute maximum from `created_at`. After 365 days, the session expires unconditionally and the user must re-authenticate.

### 5.2 Expired Session Purge

A daily cron job runs at 03:00 PHT:
```sql
DELETE FROM user_sessions
WHERE expires_at < NOW() - INTERVAL '30 days';
```

The 30-day lag after expiry exists to provide a brief window for debugging and anomaly detection (e.g., investigating suspicious login patterns within the last month).

### 5.3 Revoked Sessions

Sessions revoked via logout or account deletion are hard-deleted immediately (not kept in expired state). The cron job will also catch any that were missed.

### 5.4 Email Verification Tokens

Tokens are deleted when:
- Used (successfully verify email) — deleted immediately after use
- Expired (24 hours from creation without use) — deleted by daily cron:
  ```sql
  DELETE FROM email_verification_tokens WHERE expires_at < NOW();
  ```

### 5.5 Password Reset Tokens

Tokens are deleted when:
- Used (password successfully reset) — deleted immediately after use
- Expired (1 hour from creation without use) — deleted by daily cron:
  ```sql
  DELETE FROM password_reset_tokens WHERE expires_at < NOW();
  ```

### 5.6 API Keys

API keys (`api_keys` table) are retained until explicitly revoked by the user or until the parent user account is hard-deleted (CASCADE). API keys may optionally have an `expires_at` field set by the user at creation time. Expired keys are not auto-deleted; they are simply rejected at authentication time. Users may delete expired keys manually via the dashboard.

---

## 6. Billing Record Lifecycle

### 6.1 Subscriptions

Subscription rows are retained for 7 years after `status` transitions to `EXPIRED`. This satisfies:
- **NIA (National Internal Revenue Code) record-keeping**: Financial records supporting income and deductions must be kept for 3 years (ordinary) to 10 years (fraud). 7 years is a conservative midpoint that covers most dispute windows.
- **Consumer protection**: Users may dispute subscription charges up to 60 days after the charge (credit card dispute window); 7 years covers far beyond this.

Purge job (runs monthly on the 1st at 04:00 PHT):
```sql
DELETE FROM subscriptions
WHERE status = 'EXPIRED'
  AND updated_at < NOW() - INTERVAL '7 years';
```

### 6.2 Invoices

Invoices are retained for 7 years from `created_at`. This is the official receipt retention requirement under NIRC Sec. 237 (businesses must keep official receipts/invoices for 3 years from transaction date; 7 years gives a safe buffer).

Purge job (runs monthly on the 1st at 04:00 PHT):
```sql
DELETE FROM invoices
WHERE created_at < NOW() - INTERVAL '7 years';
```

As noted in §3.3, `invoices.user_id` is set to `NULL` when the user is hard-deleted, so the invoice row persists even after user deletion until its own 7-year expiry.

---

## 7. Audit Log Lifecycle

### 7.1 Retention Period: 1 Year

Audit log entries are retained for 1 year from `created_at`. This supports:
- Security incident investigation (most forensic investigations conclude within 90 days)
- Compliance queries (BIR assessments typically commence within 12 months of the tax year end)
- Performance analytics and debugging

### 7.2 Purge Job

Runs daily at 03:00 PHT:
```sql
DELETE FROM audit_logs
WHERE created_at < NOW() - INTERVAL '1 year';
```

### 7.3 Critical Audit Events (Extended Retention)

The following audit event types are retained for 3 years (not 1 year) because they may be relevant to fraud investigations or BIR enforcement actions:

| Event Type | Retention |
|-----------|-----------|
| `account.deleted` | 3 years |
| `subscription.cancelled` | 3 years |
| `api_key.created` | 3 years |
| `api_key.revoked` | 3 years |
| `computation.batch_created` | 3 years |

Implementation: the daily purge query has an exception:
```sql
DELETE FROM audit_logs
WHERE created_at < NOW() - INTERVAL '1 year'
  AND event_type NOT IN (
    'account.deleted',
    'subscription.cancelled',
    'api_key.created',
    'api_key.revoked',
    'computation.batch_created'
  );

DELETE FROM audit_logs
WHERE created_at < NOW() - INTERVAL '3 years'
  AND event_type IN (
    'account.deleted',
    'subscription.cancelled',
    'api_key.created',
    'api_key.revoked',
    'computation.batch_created'
  );
```

---

## 8. PDF Export Lifecycle

### 8.1 R2 Object Retention

PDF files are stored in Cloudflare R2 bucket `taxoptimizer-exports` (Singapore `apac` region). Each PDF object:
- Has a key: `exports/{user_id}/{computation_id}/{template}/{timestamp}.pdf`
- Is created when the user clicks "Download PDF" (or triggered by batch job)
- Expires 30 days after creation via R2 object lifecycle rule

**R2 Lifecycle Rule** (set in Cloudflare R2 dashboard or via API):
```json
{
  "rules": [
    {
      "id": "expire-pdf-exports",
      "status": "Enabled",
      "filter": { "prefix": "exports/" },
      "expiration": { "days": 30 }
    }
  ]
}
```

### 8.2 Signed URL Expiry

Signed URLs for PDF downloads expire 7 days after generation. A user who waits more than 7 days must request a new signed URL via `POST /v1/computations/{id}/pdf` — this regenerates the PDF from the stored computation data (if the computation record still exists) and creates a new signed URL. The R2 object may still exist within the 30-day window (in which case regeneration is instant); after 30 days, the PDF is regenerated from scratch.

### 8.3 DB Row Purge

The `pdf_exports` DB row mirrors the R2 object lifecycle:
```sql
DELETE FROM pdf_exports
WHERE created_at < NOW() - INTERVAL '30 days';
```

This runs in the daily cron job at 03:00 PHT. DB rows for PDF exports belonging to deleted users are cascade-deleted when the user row is hard-deleted (before the 30-day limit matters).

---

## 9. Scheduled Cleanup Jobs

All cleanup jobs run as part of the API server's scheduled task system (implemented with `node-cron` inside the API server process). Jobs run at PHT (UTC+8) times.

| Job | Schedule (cron) | SQL Operations | Impact |
|-----|----------------|----------------|--------|
| `cleanup:sessions` | `0 3 * * *` (03:00 PHT daily) | DELETE expired user_sessions | Low — index on `expires_at` makes this fast |
| `cleanup:tokens` | `0 3 * * *` (03:00 PHT daily) | DELETE expired email_verification_tokens + password_reset_tokens | Minimal — tokens are few |
| `cleanup:users-hard-delete` | `0 3 * * *` (03:00 PHT daily) | DELETE users WHERE deleted_at < 90 days ago (CASCADE) | Medium — cascades to computations + related tables |
| `cleanup:audit-logs` | `0 3 * * *` (03:00 PHT daily) | DELETE audit_logs WHERE created_at < 1 year (with 3-year exceptions) | Medium — audit_logs table can grow large |
| `cleanup:pdf-exports-db` | `0 3 * * *` (03:00 PHT daily) | DELETE pdf_exports WHERE created_at < 30 days | Low |
| `cleanup:billing-records` | `0 4 1 * *` (04:00 PHT, 1st of month) | DELETE subscriptions + invoices past retention period | Rare — only affects 7-year-old records |
| `cleanup:batch-jobs` | `0 3 * * *` (03:00 PHT daily) | DELETE batch_jobs WHERE status in terminal state AND updated_at < 90 days | Low |

**Transaction safety:** Each cleanup job runs in a single database transaction. If the transaction fails (e.g., connection timeout), it rolls back and the cron job logs an error to Sentry. The job will retry on the next scheduled run.

**Monitoring:** Each cleanup job logs a structured JSON entry to the application log:
```json
{
  "job": "cleanup:sessions",
  "rows_deleted": 142,
  "duration_ms": 23,
  "timestamp": "2026-03-02T19:00:00.123Z"
}
```
If `rows_deleted > 10000` in a single run, Sentry is alerted with `cleanup:anomaly` event (may indicate data accumulation issue or missed scheduled runs).

---

## 10. Legal Basis for Retention Periods

| Data Category | Retention Period | Legal Basis |
|---------------|-----------------|-------------|
| User account and PII | Until deletion + 90 days | RA 10173 (DPA) Sec. 11(e): retained only as long as necessary for declared purpose |
| Session tokens | 30 days post-expiry | Operational security: short window for abuse detection |
| Email/password reset tokens | Until use or expiry (max 24h/1h) | Security best practice: single-use tokens must not linger |
| Computation records (active user) | Indefinite while account active | Product functionality: user's tax history is core product value |
| Computation records (deleted user) | 90 days post soft-delete | RA 10173 Sec. 16 (right to erasure balanced against Art. IV Sec. 11(b) legitimate purpose); BIR assessment risk window support |
| Invoices and billing records | 7 years | NIRC Sec. 237: official receipts/invoices 3 years minimum; 7 years conservative buffer for BIR assessment period (Sec. 203: ordinary 3 years, Sec. 222: 10 years fraud) |
| Audit logs (standard) | 1 year | Operational security and debugging; no statutory requirement |
| Audit logs (security events) | 3 years | Fraud investigation support; aligns with BIR ordinary assessment window |
| PDF exports | 30 days | No legal obligation to retain; regenerable from computation data |

---

## 11. Right to Erasure (Data Subject Request)

Under RA 10173 Sec. 16(d), data subjects have the right to erasure. The mechanism for erasure is:

1. **In-app deletion:** `DELETE /v1/users/me` endpoint (see [api/auth.md §10](../api/auth.md)). Immediately anonymizes PII and soft-deletes account. Hard deletion in 90 days.

2. **Manual request via support:** A user may email `privacy@taxklaro.ph` to request deletion. Support verifies identity (matches email on file + one of: last 4 digits of TIN, most recent computation date, date of birth). Upon verification, support triggers the same soft-delete procedure as the API endpoint.

3. **Timeline compliance:** RA 10173 requires response within **30 calendar days** of a verified erasure request. The soft-delete with immediate PII anonymization ensures this is satisfied immediately. Full hard deletion occurs within 90 days.

4. **Exceptions to erasure:** The following data is not erasable on demand:
   - Invoice rows: retained 7 years per NIRC official receipt requirements. The user's PII is removed but the transaction record (amount, date, subscription tier) is retained.
   - Anonymized aggregate analytics: these contain no PII and are not subject to erasure.

---

## 12. Data Residency and Backup Retention

### 12.1 Data Residency

All primary data resides in Supabase PostgreSQL, `ap-southeast-1` region (AWS Singapore). No personal data is replicated outside the Asia-Pacific region. Cloudflare R2 PDF exports are stored in the `apac` region (Singapore).

### 12.2 Supabase Backup Retention

Supabase Pro plan provides:
- **Daily automated backups**: retained for 7 days (rolling)
- **Point-in-Time Recovery (PITR)**: available for any point within the last 7 days using WAL logs

After 7 days, old backup snapshots are automatically purged by Supabase. There is no persistent long-term backup stored by TaxKlaro beyond the 7-day Supabase window. For disaster recovery of billing records (7-year retention) and audit logs (1-3 year retention), the live database is the source of truth — backups are for operational recovery, not long-term archival.

### 12.3 Log Retention

Application logs (stdout from Fly.io containers) are sent to Sentry. Sentry retains error events for 90 days on the Team plan. Performance trace data is retained for 30 days. For longer-term log storage, operators may configure a Fly.io log drain to a persistent storage service (e.g., Papertrail or Logtail) — this is optional and not required for baseline operation.
