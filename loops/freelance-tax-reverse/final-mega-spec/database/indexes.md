# Database Indexes — Philippine Freelance & Self-Employed Income Tax Optimizer

**Status:** COMPLETE
**Last updated:** 2026-03-02
**Database engine:** PostgreSQL 16
**Cross-references:**
- Full schema DDL (indexes as `CREATE INDEX` statements): [database/schema.md §9](schema.md)
- Migration that creates indexes: [database/migrations.md §7 (0003_initial_indexes.sql)](migrations.md)
- Webhook table indexes (defined in webhook DDL): [api/webhooks.md §10](../api/webhooks.md)
- Query patterns sourced from: [api/endpoints.md](../api/endpoints.md)

---

## Table of Contents

1. [Index Design Principles](#1-index-design-principles)
2. [Cardinality Reference](#2-cardinality-reference)
3. [users Indexes](#3-users-indexes)
4. [user_sessions Indexes](#4-user_sessions-indexes)
5. [oauth_accounts Indexes](#5-oauth_accounts-indexes)
6. [password_reset_tokens Indexes](#6-password_reset_tokens-indexes)
7. [email_verification_tokens Indexes](#7-email_verification_tokens-indexes)
8. [computations Indexes](#8-computations-indexes)
9. [computation_cwt_entries Indexes](#9-computation_cwt_entries-indexes)
10. [computation_quarterly_payments Indexes](#10-computation_quarterly_payments-indexes)
11. [subscriptions Indexes](#11-subscriptions-indexes)
12. [invoices Indexes](#12-invoices-indexes)
13. [cpa_clients Indexes](#13-cpa_clients-indexes)
14. [cpa_client_computations Indexes](#14-cpa_client_computations-indexes)
15. [api_keys Indexes](#15-api_keys-indexes)
16. [audit_logs Indexes](#16-audit_logs-indexes)
17. [pdf_exports Indexes](#17-pdf_exports-indexes)
18. [webhook_endpoints Indexes](#18-webhook_endpoints-indexes)
19. [webhook_deliveries Indexes](#19-webhook_deliveries-indexes)
20. [Implicit Indexes from Constraints](#20-implicit-indexes-from-constraints)
21. [Index Maintenance Notes](#21-index-maintenance-notes)
22. [Missing-Index Detection Queries](#22-missing-index-detection-queries)

---

## 1. Index Design Principles

### 1.1 Index Type Selection

| Scenario | Index Type | Reason |
|---|---|---|
| Equality or range lookups on scalar columns | B-tree (default) | Supports `=`, `<`, `>`, `BETWEEN`, `ORDER BY`, `IS NULL` |
| Array containment queries (`@>`, `ANY`) | GIN | Supports searching within array columns (e.g., `events @> '{batch.job.completed}'`) |
| JSONB key/value lookups | GIN with `jsonb_ops` | Supports `@>`, `?`, `?|`, `?&` operators on JSONB columns |
| Low-selectivity column as leading key | Partial index | Filters to active/relevant subset, reducing index size and write cost |
| Case-insensitive text equality | Expression index on `lower(col)` | Avoids full table scan on case-insensitive login queries |

All indexes in this spec default to B-tree unless otherwise noted.

### 1.2 Partial Indexes

A partial index includes `WHERE <condition>` to cover only the rows that actually need to be indexed. Benefits:
- Smaller index → fits in memory → faster scans
- Lower write cost (only rows matching the WHERE clause update the index)
- Optimizer can use the index only when the query's WHERE clause is compatible with the partial condition

**Rule:** When more than 80% of rows in a column share the same value (e.g., `is_saved = FALSE` for most computations), index only the rare-value minority (e.g., `WHERE is_saved = TRUE`).

### 1.3 Covering Indexes

An index that includes all columns needed by a query (via `INCLUDE (col)`) avoids a heap fetch (index-only scan). Used sparingly — only when the query is on the hot path and the heap fetch is measured as a bottleneck.

### 1.4 Write Overhead Assessment

Every index adds write cost to INSERT and UPDATE operations. The schema has high write volume only on:
- `computations` — every anonymous and authenticated computation inserts a row
- `audit_logs` — every action inserts a row (no updates; INSERT-only)
- `webhook_deliveries` — every delivery attempt inserts/updates rows

Indexes on these tables are limited to those with proven query needs. Exploratory analytics queries use the denormalized typed columns on `computations` (not JSONB) and can use lighter sequential scans on the `audit_logs` table for ad-hoc analytics.

---

## 2. Cardinality Reference

Estimated cardinality at 18 months post-launch, derived from storage estimates in [schema.md §11](schema.md).

| Table | Projected Row Count | Notes |
|---|---|---|
| users | 50,000 | Unique registered accounts |
| user_sessions | 200,000 | Active + recently revoked sessions |
| oauth_accounts | 30,000 | ~60% of users authenticate via Google |
| password_reset_tokens | 5,000 | Short-lived; cleaned up daily |
| email_verification_tokens | 5,000 | Short-lived; cleaned up daily |
| computations | 500,000 | ~10 computations per active user |
| computation_cwt_entries | 1,500,000 | ~3 entries per computation with CWT |
| computation_quarterly_payments | 750,000 | ~1.5 payments per computation |
| subscriptions | 50,000 | One per user |
| invoices | 30,000 | ~0.6 invoices per user |
| cpa_clients | 20,000 | ~40 clients per CPA user |
| cpa_client_computations | 100,000 | ~5 computations per client |
| api_keys | 500 | ~5 keys per Enterprise user, ~100 Enterprise users |
| audit_logs | 5,000,000 | ~100 log entries per user lifetime |
| pdf_exports | 100,000 | ~2 exports per paying user |
| webhook_endpoints | 500 | ~5 per Enterprise user |
| webhook_deliveries | 500,000 | ~1,000 deliveries per active Enterprise user |

---

## 3. users Indexes

### 3.1 `users_pkey` — PRIMARY KEY (id)

```sql
-- Implicit; created by: CONSTRAINT users_pkey PRIMARY KEY (id)
-- Index type: B-tree
-- Columns: id (UUID)
-- Partial: No
```

**Query patterns supported:**
- `SELECT * FROM users WHERE id = $1` — every authenticated request resolves user record from session
- `SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL` — active user check
- All FK lookups from child tables (`user_sessions.user_id`, `computations.user_id`, etc.)

**Cardinality:** 50,000 unique values. Selectivity: 100% (each value identifies exactly one row).

**Write cost:** UUID PKs are random (non-sequential); each INSERT causes a random page write in the B-tree. At 50,000 rows over 18 months, this is not a bottleneck. If write volume exceeds 1,000 inserts/hour, consider UUIDv7 (time-ordered) for the PK to reduce B-tree fragmentation.

---

### 3.2 `users_email_unique` — UNIQUE (email)

```sql
-- Implicit; created by: CONSTRAINT users_email_unique UNIQUE (email)
-- Index type: B-tree
-- Columns: email (TEXT)
-- Partial: No
```

**Query patterns supported:**
- `SELECT id, password_hash FROM users WHERE email = $1` — email/password login lookup

**Note:** This index is case-sensitive. Application layer normalizes email to lowercase before every insert and login query, so the case-sensitive index works correctly. The expression index (3.3) provides defense-in-depth.

---

### 3.3 `users_email_lower_idx` — UNIQUE expression index on `lower(email)`

```sql
CREATE UNIQUE INDEX users_email_lower_idx
  ON users (lower(email));
-- Index type: B-tree (expression index)
-- Expression: lower(email)
-- Partial: No
```

**Query patterns supported:**
- `SELECT id FROM users WHERE lower(email) = lower($1)` — case-insensitive duplicate check before insert
- Defense-in-depth: enforces uniqueness even if application layer fails to lowercase the email

**Cardinality:** 50,000 distinct lowercase email values. No duplicates expected (UNIQUE).

**Write cost:** Evaluated once per INSERT/UPDATE on `email`. Negligible.

---

### 3.4 `users_active_idx` — Partial index on `id` WHERE `deleted_at IS NULL`

```sql
CREATE INDEX users_active_idx
  ON users (id)
  WHERE deleted_at IS NULL;
-- Index type: B-tree
-- Columns: id (UUID)
-- Partial: WHERE deleted_at IS NULL
```

**Query patterns supported:**
- `SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL` — every authentication middleware check
- Admin dashboard: `SELECT COUNT(*) FROM users WHERE deleted_at IS NULL` — active user count

**Selectivity of partial condition:** Expected ~99.9% of rows have `deleted_at IS NULL` (deletions are rare). However, the partial index is still valuable because it makes the planner's intent explicit and avoids the heap fetch cost of checking `deleted_at` for rows that already matched on `id` via the PK. The primary benefit is the explicit filter the partial WHERE clause provides to the query planner — it prevents the planner from choosing a sequential scan on this table when the `deleted_at IS NULL` filter is present.

**Write cost:** Every INSERT adds to this index (most users are active). Each soft-delete UPDATE removes the row from the index. Low churn.

---

### 3.5 `users_tin_idx` — Partial index on `tin` WHERE `tin IS NOT NULL`

```sql
CREATE INDEX users_tin_idx
  ON users (tin)
  WHERE tin IS NOT NULL;
-- Index type: B-tree
-- Columns: tin (VARCHAR(16))
-- Partial: WHERE tin IS NOT NULL
```

**Query patterns supported:**
- `SELECT id FROM users WHERE tin = $1` — admin lookup by TIN, CPA "find existing user" by TIN
- `GET /api/v1/admin/users?tin=123-456-789` — admin search endpoint

**Cardinality:** ~30,000 non-NULL TIN values (estimated 60% of users have entered a TIN). TIN values are unique in practice (each BIR-assigned TIN is unique per individual), but the constraint is not enforced at the DB level. Duplicate TINs can exist if two user accounts claim the same TIN (an edge case the application handles with a warning, not a hard block).

**Write cost:** Only rows with non-NULL `tin` update this index. Most updates to the `users` table that change `tin` are one-time profile setup events.

---

### 3.6 `users_stripe_customer_idx` — Partial index on `stripe_customer_id` WHERE `stripe_customer_id IS NOT NULL`

```sql
CREATE INDEX users_stripe_customer_idx
  ON users (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;
-- Index type: B-tree
-- Columns: stripe_customer_id (TEXT)
-- Partial: WHERE stripe_customer_id IS NOT NULL
```

**Query patterns supported:**
- `SELECT id FROM users WHERE stripe_customer_id = $1` — PayMongo/Stripe webhook processing: look up which user a billing event belongs to
- Called on every inbound payment provider webhook event

**Cardinality:** ~20,000 non-NULL values (paying and trialing users only). Values are unique in practice (one PayMongo customer per user).

**Write cost:** Set once when a user first initiates a billing event. No subsequent updates. Low churn.

---

## 4. user_sessions Indexes

### 4.1 `user_sessions_pkey` — PRIMARY KEY (id)

```sql
-- Implicit; created by: CONSTRAINT user_sessions_pkey PRIMARY KEY (id)
-- Index type: B-tree
-- Columns: id (UUID)
-- Partial: No
```

**Query patterns supported:**
- Direct session lookup by internal ID (admin operations, session revocation by ID)

---

### 4.2 `user_sessions_token_unique` — UNIQUE (session_token_hash)

```sql
-- Implicit; created by: CONSTRAINT user_sessions_token_unique UNIQUE (session_token_hash)
-- Index type: B-tree
-- Columns: session_token_hash (TEXT)
-- Partial: No
```

**Query patterns supported:**
- `SELECT user_id, expires_at, revoked_at FROM user_sessions WHERE session_token_hash = $1` — every single authenticated HTTP request (highest-frequency query in the system)

**Cardinality:** 200,000 unique token hashes. Each value identifies exactly one session.

**Write cost:** One index update per session creation (INSERT) and per session revocation (UPDATE setting `revoked_at`). Expected ~10,000 inserts/month. Negligible.

**Performance note:** This index is on the absolute critical path — every authenticated API request hits it. It must remain in memory (index fits in ~20 MB at 200,000 rows × 96 bytes per B-tree entry — well within pg_shared_buffers).

---

### 4.3 `user_sessions_user_active_idx` — Index on `(user_id, expires_at)` WHERE `revoked_at IS NULL`

```sql
CREATE INDEX user_sessions_user_active_idx
  ON user_sessions (user_id, expires_at)
  WHERE revoked_at IS NULL;
-- Index type: B-tree (composite)
-- Columns: user_id (UUID), expires_at (TIMESTAMPTZ)
-- Partial: WHERE revoked_at IS NULL
```

**Query patterns supported:**
- `SELECT id, created_at, last_used_at, ip_address, user_agent FROM user_sessions WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > NOW() ORDER BY expires_at DESC` — account security page: list user's active sessions
- `UPDATE user_sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL` — password change: revoke all sessions for a user (bulk revocation)

**Cardinality of leading key:** ~200,000 rows, ~50,000 distinct `user_id` values. Average 4 active sessions per user. The partial condition (`revoked_at IS NULL`) filters to active sessions only, reducing index size significantly since revoked sessions accumulate over time.

---

### 4.4 `user_sessions_expires_at_idx` — Partial index on `expires_at` WHERE `revoked_at IS NULL`

```sql
CREATE INDEX user_sessions_expires_at_idx
  ON user_sessions (expires_at)
  WHERE revoked_at IS NULL;
-- Index type: B-tree
-- Columns: expires_at (TIMESTAMPTZ)
-- Partial: WHERE revoked_at IS NULL
```

**Query patterns supported:**
- `DELETE FROM user_sessions WHERE expires_at < NOW() - INTERVAL '7 days'` — daily cleanup job: purge expired sessions. The 7-day grace period allows the cleanup job to retain recently-expired sessions for audit purposes before hard deletion.

**Write cost:** Every non-revoked session INSERT updates this index. Every session revocation (UPDATE) removes the row from this partial index. Moderate churn. Index stays small because it only contains non-revoked sessions.

---

## 5. oauth_accounts Indexes

### 5.1 `oauth_accounts_pkey` — PRIMARY KEY (id)

```sql
-- Implicit; created by: CONSTRAINT oauth_accounts_pkey PRIMARY KEY (id)
-- Index type: B-tree
-- Columns: id (UUID)
-- Partial: No
```

**Query patterns supported:**
- Direct lookup for unlinking a specific OAuth provider from a user account.

---

### 5.2 `oauth_accounts_provider_user` — UNIQUE (provider, provider_user_id)

```sql
-- Implicit; created by: CONSTRAINT oauth_accounts_provider_user UNIQUE (provider, provider_user_id)
-- Index type: B-tree (composite)
-- Columns: provider (VARCHAR(20)), provider_user_id (TEXT)
-- Partial: No
```

**Query patterns supported:**
- `SELECT user_id FROM oauth_accounts WHERE provider = 'google' AND provider_user_id = $1` — Google OAuth callback: find existing account linked to this Google sub
- Uniqueness enforcement: prevent two TaxOptimizer users from linking the same Google account

**Cardinality:** ~30,000 rows, ~30,000 distinct `(provider, provider_user_id)` pairs (one account per Google sub per user).

---

### 5.3 `oauth_accounts_user_idx` — Index on `user_id`

```sql
CREATE INDEX oauth_accounts_user_idx
  ON oauth_accounts (user_id);
-- Index type: B-tree
-- Columns: user_id (UUID)
-- Partial: No
```

**Query patterns supported:**
- `SELECT provider, provider_user_id FROM oauth_accounts WHERE user_id = $1` — account settings page: list all linked OAuth providers for a user

**Cardinality:** ~30,000 rows, ~25,000 distinct `user_id` values. Most users have exactly one OAuth account linked.

---

## 6. password_reset_tokens Indexes

### 6.1 `prt_pkey` — PRIMARY KEY (id)

```sql
-- Implicit; created by: CONSTRAINT prt_pkey PRIMARY KEY (id)
-- Index type: B-tree
-- Columns: id (UUID)
-- Partial: No
```

**Query patterns supported:** Direct lookup by internal ID for admin revocation.

---

### 6.2 `prt_token_unique` — UNIQUE (token_hash)

```sql
-- Implicit; created by: CONSTRAINT prt_token_unique UNIQUE (token_hash)
-- Index type: B-tree
-- Columns: token_hash (TEXT)
-- Partial: No
```

**Query patterns supported:**
- `SELECT user_id, expires_at, used_at FROM password_reset_tokens WHERE token_hash = $1` — password reset form submission: validate the token the user clicked from their email

**Cardinality:** ~5,000 rows (short-lived; cleaned up daily). Values are unique (each reset generates a fresh cryptographic token).

---

### 6.3 `prt_expires_cleanup_idx` — Partial index on `expires_at` WHERE `used_at IS NULL`

```sql
CREATE INDEX prt_expires_cleanup_idx
  ON password_reset_tokens (expires_at)
  WHERE used_at IS NULL;
-- Index type: B-tree
-- Columns: expires_at (TIMESTAMPTZ)
-- Partial: WHERE used_at IS NULL
```

**Query patterns supported:**
- `DELETE FROM password_reset_tokens WHERE expires_at < NOW() OR used_at IS NOT NULL` — daily cleanup job: purge expired and used tokens

**Write cost:** Low. Token table has low volume (~100 rows/day at scale). Partial condition keeps the index small.

---

## 7. email_verification_tokens Indexes

### 7.1 `evt_pkey` — PRIMARY KEY (id)

```sql
-- Implicit; created by: CONSTRAINT evt_pkey PRIMARY KEY (id)
-- Index type: B-tree
-- Columns: id (UUID)
-- Partial: No
```

---

### 7.2 `evt_token_unique` — UNIQUE (token_hash)

```sql
-- Implicit; created by: CONSTRAINT evt_token_unique UNIQUE (token_hash)
-- Index type: B-tree
-- Columns: token_hash (TEXT)
-- Partial: No
```

**Query patterns supported:**
- `SELECT user_id, email, expires_at, used_at FROM email_verification_tokens WHERE token_hash = $1` — email verification link click: validate the verification token

---

### 7.3 `evt_expires_cleanup_idx` — Partial index on `expires_at` WHERE `used_at IS NULL`

```sql
CREATE INDEX evt_expires_cleanup_idx
  ON email_verification_tokens (expires_at)
  WHERE used_at IS NULL;
-- Index type: B-tree
-- Columns: expires_at (TIMESTAMPTZ)
-- Partial: WHERE used_at IS NULL
```

**Query patterns supported:**
- `DELETE FROM email_verification_tokens WHERE expires_at < NOW() OR used_at IS NOT NULL` — daily cleanup job

---

## 8. computations Indexes

The `computations` table is the highest-volume table for reads. The following indexes cover all query patterns from `GET /api/v1/computations`, `GET /api/v1/computations/:id`, and the admin dashboard.

### 8.1 `computations_pkey` — PRIMARY KEY (id)

```sql
-- Implicit; created by: CONSTRAINT computations_pkey PRIMARY KEY (id)
-- Index type: B-tree
-- Columns: id (UUID)
-- Partial: No
```

**Query patterns supported:**
- `SELECT * FROM computations WHERE id = $1` — `GET /api/v1/computations/:id` for any client
- `SELECT * FROM computations WHERE id = $1 AND user_id = $2` — authenticated user: fetch specific computation
- FK lookups from `computation_cwt_entries`, `computation_quarterly_payments`, `pdf_exports`, `cpa_client_computations`

**Cardinality:** 500,000 unique values.

---

### 8.2 `computations_user_saved_idx` — Partial composite on `(user_id, created_at DESC)` WHERE saved

```sql
CREATE INDEX computations_user_saved_idx
  ON computations (user_id, created_at DESC)
  WHERE is_saved = TRUE AND user_id IS NOT NULL;
-- Index type: B-tree (composite, partial)
-- Columns: user_id (UUID), created_at (TIMESTAMPTZ DESC)
-- Partial: WHERE is_saved = TRUE AND user_id IS NOT NULL
```

**Query patterns supported:**
- `SELECT id, label, tax_year, filing_period, recommended_path, recommended_tax_due, created_at FROM computations WHERE user_id = $1 AND is_saved = TRUE ORDER BY created_at DESC LIMIT 20` — `GET /api/v1/computations?saved=true` — user's history page (most common authenticated read query)
- `SELECT COUNT(*) FROM computations WHERE user_id = $1 AND is_saved = TRUE` — history count for dashboard header

**Partial condition rationale:** At 500,000 total computations, an estimated 80% are unsaved (anonymous or transient). Only ~100,000 rows are saved. The partial index covers only the ~100,000 saved rows, keeping the index approximately 5× smaller than a full index.

**Composite column order:** `user_id` first (equality filter), then `created_at DESC` (sort order). This index supports the `ORDER BY created_at DESC` without a sort step.

---

### 8.3 `computations_anon_created_idx` — Partial index on `created_at` WHERE `user_id IS NULL`

```sql
CREATE INDEX computations_anon_created_idx
  ON computations (created_at)
  WHERE user_id IS NULL;
-- Index type: B-tree (partial)
-- Columns: created_at (TIMESTAMPTZ)
-- Partial: WHERE user_id IS NULL
```

**Query patterns supported:**
- `SELECT * FROM computations WHERE id = $1 AND user_id IS NULL` — share link lookup when accessed by an unauthenticated visitor (the `id` lookup hits the PK; this index covers supplementary time-based queries)
- `SELECT COUNT(*) FROM computations WHERE user_id IS NULL AND created_at > NOW() - INTERVAL '1 day'` — admin analytics: count today's anonymous computations

**Partial condition:** ~400,000 of 500,000 computations are anonymous (80%). The partial index covers the anonymous subset.

---

### 8.4 `computations_share_token_idx` — UNIQUE partial on `share_token`

```sql
CREATE UNIQUE INDEX computations_share_token_idx
  ON computations (share_token)
  WHERE share_token IS NOT NULL;
-- Index type: B-tree (unique, partial)
-- Columns: share_token (VARCHAR(36))
-- Partial: WHERE share_token IS NOT NULL
```

**Query patterns supported:**
- `SELECT * FROM computations WHERE share_token = $1` — `GET /s/:share_token` — public share URL resolution. This is a high-volume public-facing query (anyone with the link can access it without authentication).
- Uniqueness enforcement: ensures no two computations share the same public share token

**Cardinality:** ~10,000 rows with non-NULL `share_token` (estimated 2% of total computations are shared). Partial index size is small (~200 KB at 10,000 rows).

---

### 8.5 `computations_user_status_idx` — Partial composite on `(user_id, status, created_at DESC)`

```sql
CREATE INDEX computations_user_status_idx
  ON computations (user_id, status, created_at DESC)
  WHERE user_id IS NOT NULL;
-- Index type: B-tree (composite, partial)
-- Columns: user_id (UUID), status (computation_status_enum), created_at (TIMESTAMPTZ DESC)
-- Partial: WHERE user_id IS NOT NULL
```

**Query patterns supported:**
- `SELECT * FROM computations WHERE user_id = $1 AND status = 'COMPLETE' ORDER BY created_at DESC` — API filter: user's completed computations only
- `SELECT * FROM computations WHERE user_id = $1 AND status = 'DRAFT' ORDER BY created_at DESC LIMIT 1` — resume in-progress wizard: find the most recent draft computation for this user
- `SELECT COUNT(*) FROM computations WHERE user_id = $1 AND status = 'ERROR'` — user error history count

**Why not combine with `computations_user_saved_idx`:** The `status` filter is independent of the `is_saved` filter. Users can filter by status regardless of save state. Two separate partial indexes are more targeted than a single composite covering all cases.

---

### 8.6 `computations_tax_year_idx` — Index on `(tax_year, filing_period)`

```sql
CREATE INDEX computations_tax_year_idx
  ON computations (tax_year, filing_period);
-- Index type: B-tree (composite)
-- Columns: tax_year (SMALLINT), filing_period (filing_period_enum)
-- Partial: No
```

**Query patterns supported:**
- `SELECT COUNT(*), recommended_path FROM computations WHERE tax_year = $1 GROUP BY recommended_path` — admin analytics: regime distribution by tax year
- `SELECT AVG(gross_receipts) FROM computations WHERE tax_year = $1 AND filing_period = 'ANNUAL' AND status = 'COMPLETE'` — admin stats: average gross income for annual filers in a given year
- `SELECT COUNT(*) FROM computations WHERE tax_year = $1 AND filing_period = 'Q1'` — quarterly filing engagement metrics

**Cardinality:** `tax_year` has low cardinality (2018–2030 = 13 values). `filing_period` has 4 values. Combined, there are ~52 distinct `(tax_year, filing_period)` pairs across 500,000 rows — ~9,600 rows per combination on average. This is a range/analytics index, not a point-lookup index.

---

### 8.7 `computations_engine_version_idx` — Index on `engine_version`

```sql
CREATE INDEX computations_engine_version_idx
  ON computations (engine_version);
-- Index type: B-tree
-- Columns: engine_version (VARCHAR(20))
-- Partial: No
```

**Query patterns supported:**
- `SELECT COUNT(*), status FROM computations WHERE engine_version = $1 GROUP BY status` — regression analysis: after an engine version bump, find how many computations were run on the old version and compare their results
- `SELECT id FROM computations WHERE engine_version < '1.5.0' AND status = 'COMPLETE' LIMIT 1000` — re-computation job: re-run old computations through the new engine for comparison

**Cardinality:** Low cardinality (a small number of engine versions over the product's lifetime — expected fewer than 50 over 18 months). Most rows cluster around the current version.

---

### 8.8 `computations_anon_cleanup_idx` — Partial on `created_at` WHERE anonymous unsaved

```sql
CREATE INDEX computations_anon_cleanup_idx
  ON computations (created_at)
  WHERE user_id IS NULL AND is_saved = FALSE;
-- Index type: B-tree (partial)
-- Columns: created_at (TIMESTAMPTZ)
-- Partial: WHERE user_id IS NULL AND is_saved = FALSE
```

**Query patterns supported:**
- `DELETE FROM computations WHERE user_id IS NULL AND is_saved = FALSE AND created_at < NOW() - INTERVAL '30 days'` — daily retention job: purge old anonymous unsaved computations per retention policy ([retention.md](retention.md))

**Partial condition rationale:** The cleanup job only targets `user_id IS NULL AND is_saved = FALSE`. This is the largest segment (80% of all rows). Without a partial index, the cleanup query would do a sequential scan of the entire table. The partial index makes the cleanup job run in milliseconds regardless of table size.

---

### 8.9 `computations_auth_cleanup_idx` — Partial on `(user_id, created_at)` WHERE authenticated unsaved

```sql
CREATE INDEX computations_auth_cleanup_idx
  ON computations (user_id, created_at)
  WHERE user_id IS NOT NULL AND is_saved = FALSE;
-- Index type: B-tree (composite, partial)
-- Columns: user_id (UUID), created_at (TIMESTAMPTZ)
-- Partial: WHERE user_id IS NOT NULL AND is_saved = FALSE
```

**Query patterns supported:**
- `DELETE FROM computations WHERE user_id IS NOT NULL AND is_saved = FALSE AND created_at < NOW() - INTERVAL '365 days'` — yearly retention job: purge old authenticated unsaved computations per retention policy
- `SELECT COUNT(*) FROM computations WHERE user_id = $1 AND is_saved = FALSE` — check whether to prompt user to save their most recent computation

---

### 8.10 `computations_path_year_idx` — Partial on `(tax_year, recommended_path)` WHERE COMPLETE

```sql
CREATE INDEX computations_path_year_idx
  ON computations (tax_year, recommended_path)
  WHERE status = 'COMPLETE';
-- Index type: B-tree (composite, partial)
-- Columns: tax_year (SMALLINT), recommended_path (regime_path_enum)
-- Partial: WHERE status = 'COMPLETE'
```

**Query patterns supported:**
- `SELECT COUNT(*) FROM computations WHERE tax_year = 2025 AND recommended_path = 'PATH_C' AND status = 'COMPLETE'` — CPA analytics: "how many of my clients should be on the 8% option?"
- `SELECT AVG(recommended_tax_due) FROM computations WHERE tax_year = $1 AND recommended_path = 'PATH_A' AND status = 'COMPLETE'` — admin dashboard: average tax due by regime for analytics
- `GET /api/v1/computations?tax_year=2025&recommended_path=PATH_C` — CPA batch filter

**Partial condition:** Only COMPLETE computations have a meaningful `recommended_path`. DRAFT and ERROR rows have `recommended_path IS NULL` and should not appear in analytics queries.

---

## 9. computation_cwt_entries Indexes

### 9.1 `cwt_entries_pkey` — PRIMARY KEY (id)

```sql
-- Implicit; created by: CONSTRAINT cwt_entries_pkey PRIMARY KEY (id)
-- Index type: B-tree
-- Columns: id (UUID)
-- Partial: No
```

---

### 9.2 `cwt_entries_computation_idx` — Index on `computation_id`

```sql
CREATE INDEX cwt_entries_computation_idx
  ON computation_cwt_entries (computation_id);
-- Index type: B-tree
-- Columns: computation_id (UUID)
-- Partial: No
```

**Query patterns supported:**
- `SELECT * FROM computation_cwt_entries WHERE computation_id = $1` — every request to display a computation's result: fetch its CWT entries for the credits table
- `SELECT SUM(tax_withheld) FROM computation_cwt_entries WHERE computation_id = $1 AND cwt_classification = 'INCOME_TAX_CWT'` — engine re-aggregation for display (if output_json is used for the total but a breakdown is needed)

**Cardinality:** 1,500,000 rows, ~500,000 distinct `computation_id` values. Average 3 entries per computation with CWT.

**Note on FK index:** PostgreSQL does not automatically create an index on FK columns. The explicit `CREATE INDEX` is required for efficient child-side FK lookups and CASCADE operations.

---

### 9.3 `cwt_entries_atc_idx` — Index on `atc_code`

```sql
CREATE INDEX cwt_entries_atc_idx
  ON computation_cwt_entries (atc_code);
-- Index type: B-tree
-- Columns: atc_code (VARCHAR(8))
-- Partial: No
```

**Query patterns supported:**
- `SELECT COUNT(*), SUM(tax_withheld) FROM computation_cwt_entries WHERE atc_code = 'WI760'` — admin analytics: total withholding under RR 16-2023 e-marketplace withholding code
- `SELECT DISTINCT computation_id FROM computation_cwt_entries WHERE atc_code = 'UNKNOWN'` — admin: find computations with unrecognized ATC codes (MRF-021 flag auditing)
- `SELECT * FROM computation_cwt_entries WHERE atc_code = $1 AND period_from >= $2` — CPA filter: all 2307 entries under a specific ATC code within a date range

**Cardinality:** ~50 distinct ATC codes in practice (WI010, WI760, WC010, PT010, etc. — see Form 2307 ATC table in [bir-forms-field-descriptions](../../input/sources/bir-forms-field-descriptions.md)). Low-cardinality column; index is useful for GROUP BY analytics, not point lookups.

---

### 9.4 `cwt_entries_payor_tin_idx` — Index on `payor_tin`

```sql
CREATE INDEX cwt_entries_payor_tin_idx
  ON computation_cwt_entries (payor_tin);
-- Index type: B-tree
-- Columns: payor_tin (VARCHAR(16))
-- Partial: No
```

**Query patterns supported:**
- `SELECT computation_id, period_from, period_to, tax_withheld FROM computation_cwt_entries WHERE payor_tin = $1` — CPA feature: "find all 2307s from a specific client (by TIN) across all computations"
- `SELECT SUM(tax_withheld) FROM computation_cwt_entries WHERE payor_tin = $1 AND period_from >= '2025-01-01' AND period_to <= '2025-12-31'` — annual CWT summary by payor

**Cardinality:** ~50,000 distinct TIN values (each unique payor). Moderate selectivity.

---

## 10. computation_quarterly_payments Indexes

### 10.1 `qpayments_pkey` — PRIMARY KEY (id)

```sql
-- Implicit; created by: CONSTRAINT qpayments_pkey PRIMARY KEY (id)
-- Index type: B-tree
-- Columns: id (UUID)
-- Partial: No
```

---

### 10.2 `qpayments_unique_quarter` — UNIQUE (computation_id, quarter)

```sql
-- Implicit; created by: CONSTRAINT qpayments_unique_quarter UNIQUE (computation_id, quarter)
-- Index type: B-tree (composite, unique)
-- Columns: computation_id (UUID), quarter (SMALLINT)
-- Partial: No
```

**Query patterns supported:**
- `SELECT * FROM computation_quarterly_payments WHERE computation_id = $1` — fetch quarterly payment breakdown for a computation (FK child-side scan covered by this unique index)
- `SELECT * FROM computation_quarterly_payments WHERE computation_id = $1 AND quarter = $2` — fetch a specific quarterly payment record

**Cardinality:** 750,000 rows, ~500,000 distinct `computation_id` values. The unique index on `(computation_id, quarter)` has 100% selectivity at the `(computation_id, quarter)` level.

---

### 10.3 `qpayments_computation_idx` — Index on `computation_id`

```sql
CREATE INDEX qpayments_computation_idx
  ON computation_quarterly_payments (computation_id);
-- Index type: B-tree
-- Columns: computation_id (UUID)
-- Partial: No
-- Note: The UNIQUE constraint (10.2) already creates a composite index on (computation_id, quarter).
-- This separate index on computation_id alone is redundant if PostgreSQL uses the composite unique
-- index as a covering index for single-column lookups. However, it is explicitly defined for
-- clarity and to guarantee the optimizer always finds a single-column index for FK lookups.
-- At 750,000 rows, the storage overhead of the redundant index is ~8 MB — acceptable.
```

**Query patterns supported:**
- FK lookup (CASCADE): `DELETE FROM computation_quarterly_payments WHERE computation_id = $1`
- `SELECT SUM(amount_paid) FROM computation_quarterly_payments WHERE computation_id = $1` — quarterly payment total for a computation

---

## 11. subscriptions Indexes

### 11.1 `subscriptions_pkey` — PRIMARY KEY (id)

```sql
-- Implicit; created by: CONSTRAINT subscriptions_pkey PRIMARY KEY (id)
-- Index type: B-tree
-- Columns: id (UUID)
-- Partial: No
```

---

### 11.2 `subscriptions_user_unique` — UNIQUE (user_id)

```sql
-- Implicit; created by: CONSTRAINT subscriptions_user_unique UNIQUE (user_id)
-- Index type: B-tree (unique)
-- Columns: user_id (UUID)
-- Partial: No
```

**Query patterns supported:**
- `SELECT plan, status, trial_ends_at, current_period_end FROM subscriptions WHERE user_id = $1` — every authenticated request that needs to check feature gating (most API endpoints check plan/status)
- This is the second-most-frequent query after session lookup

**Cardinality:** 50,000 rows, 50,000 distinct `user_id` values. One-to-one mapping.

---

### 11.3 `subscriptions_paid_status_idx` — Partial on `(status, current_period_end)` WHERE paid

```sql
CREATE INDEX subscriptions_paid_status_idx
  ON subscriptions (status, current_period_end)
  WHERE plan != 'FREE' AND status IN ('ACTIVE', 'PAST_DUE', 'TRIALING');
-- Index type: B-tree (composite, partial)
-- Columns: status (subscription_status_enum), current_period_end (TIMESTAMPTZ)
-- Partial: WHERE plan != 'FREE' AND status IN ('ACTIVE', 'PAST_DUE', 'TRIALING')
```

**Query patterns supported:**
- `SELECT user_id FROM subscriptions WHERE plan != 'FREE' AND status = 'ACTIVE' AND current_period_end < NOW() + INTERVAL '3 days'` — renewal reminder job: find subscriptions expiring in the next 3 days
- `SELECT COUNT(*) FROM subscriptions WHERE plan = 'PRO' AND status = 'ACTIVE'` — admin dashboard: active PRO subscriber count
- `SELECT user_id FROM subscriptions WHERE status = 'PAST_DUE' AND current_period_end < NOW()` — grace period expiry job: downgrade overdue subscriptions

**Partial condition:** Only ~20% of subscriptions are on paid plans. The partial index excludes the 80% FREE plan rows.

---

### 11.4 `subscriptions_trial_ends_idx` — Partial on `trial_ends_at` WHERE TRIALING

```sql
CREATE INDEX subscriptions_trial_ends_idx
  ON subscriptions (trial_ends_at)
  WHERE status = 'TRIALING';
-- Index type: B-tree (partial)
-- Columns: trial_ends_at (TIMESTAMPTZ)
-- Partial: WHERE status = 'TRIALING'
```

**Query patterns supported:**
- `SELECT user_id, trial_ends_at FROM subscriptions WHERE status = 'TRIALING' AND trial_ends_at < NOW() + INTERVAL '2 days'` — trial ending soon email job: send "your trial ends in 2 days" notification
- `SELECT user_id FROM subscriptions WHERE status = 'TRIALING' AND trial_ends_at < NOW()` — trial expiry job: convert expired trials to EXPIRED status

**Cardinality of partial condition:** At any given time, an estimated 500–2,000 users are in the TRIALING state. Very small index.

---

### 11.5 `subscriptions_provider_id_idx` — Partial on `provider_subscription_id`

```sql
CREATE INDEX subscriptions_provider_id_idx
  ON subscriptions (provider_subscription_id)
  WHERE provider_subscription_id IS NOT NULL;
-- Index type: B-tree (partial)
-- Columns: provider_subscription_id (TEXT)
-- Partial: WHERE provider_subscription_id IS NOT NULL
```

**Query patterns supported:**
- `SELECT user_id FROM subscriptions WHERE provider_subscription_id = $1` — PayMongo/Stripe webhook: on subscription renewal or cancellation event, find the subscription record

**Cardinality:** ~10,000 paid subscriptions (non-NULL provider_subscription_id). Values are unique in practice.

---

## 12. invoices Indexes

### 12.1 `invoices_pkey` — PRIMARY KEY (id)

```sql
-- Implicit; created by: CONSTRAINT invoices_pkey PRIMARY KEY (id)
-- Index type: B-tree
-- Columns: id (UUID)
-- Partial: No
```

---

### 12.2 `invoices_provider_invoice_uniq` — UNIQUE (provider_invoice_id)

```sql
-- Implicit; created by: CONSTRAINT invoices_provider_invoice_uniq UNIQUE (provider_invoice_id)
-- Index type: B-tree (unique)
-- Columns: provider_invoice_id (TEXT)
-- Partial: No
```

**Query patterns supported:**
- `SELECT id, status FROM invoices WHERE provider_invoice_id = $1` — payment webhook processing: look up the invoice record by provider ID (idempotency check before updating status)

---

### 12.3 `invoices_user_created_idx` — Index on `(user_id, invoice_date DESC)`

```sql
CREATE INDEX invoices_user_created_idx
  ON invoices (user_id, invoice_date DESC);
-- Index type: B-tree (composite)
-- Columns: user_id (UUID), invoice_date (DATE DESC)
-- Partial: No
```

**Query patterns supported:**
- `SELECT * FROM invoices WHERE user_id = $1 ORDER BY invoice_date DESC` — billing history page: list all invoices for a user, newest first
- `SELECT * FROM invoices WHERE user_id = $1 AND status = 'PAID' ORDER BY invoice_date DESC LIMIT 12` — paid invoice history for the past year

**Cardinality:** 30,000 rows, 50,000 distinct `user_id` values (most users have 0 invoices; paying users have ~1–12). Average 0.6 invoices per user.

---

### 12.4 `invoices_subscription_idx` — Index on `(subscription_id, invoice_date DESC)`

```sql
CREATE INDEX invoices_subscription_idx
  ON invoices (subscription_id, invoice_date DESC);
-- Index type: B-tree (composite)
-- Columns: subscription_id (UUID), invoice_date (DATE DESC)
-- Partial: No
```

**Query patterns supported:**
- `SELECT * FROM invoices WHERE subscription_id = $1 ORDER BY invoice_date DESC` — admin: view all invoices for a specific subscription (used in subscription management tools)
- FK lookup for CASCADE: `DELETE FROM invoices WHERE subscription_id = $1`

---

### 12.5 `invoices_open_idx` — Partial on `due_date` WHERE OPEN

```sql
CREATE INDEX invoices_open_idx
  ON invoices (due_date)
  WHERE status = 'OPEN';
-- Index type: B-tree (partial)
-- Columns: due_date (DATE)
-- Partial: WHERE status = 'OPEN'
```

**Query patterns supported:**
- `SELECT user_id, provider_hosted_url FROM invoices WHERE status = 'OPEN' AND due_date < NOW()` — overdue invoice job: find invoices that are past due and mark as UNCOLLECTIBLE after retry exhaustion
- `SELECT user_id FROM invoices WHERE status = 'OPEN' AND due_date < NOW() + INTERVAL '3 days'` — send payment reminder emails for invoices due soon

**Cardinality of partial:** At any time, an estimated 200–1,000 invoices are in OPEN status (payment processing or awaiting). Very small index.

---

## 13. cpa_clients Indexes

### 13.1 `cpa_clients_pkey` — PRIMARY KEY (id)

```sql
-- Implicit; created by: CONSTRAINT cpa_clients_pkey PRIMARY KEY (id)
-- Index type: B-tree
-- Columns: id (UUID)
-- Partial: No
```

---

### 13.2 `cpa_clients_cpa_active_idx` — Partial on `(cpa_user_id, client_name)` WHERE active

```sql
CREATE INDEX cpa_clients_cpa_active_idx
  ON cpa_clients (cpa_user_id, client_name)
  WHERE is_active = TRUE;
-- Index type: B-tree (composite, partial)
-- Columns: cpa_user_id (UUID), client_name (TEXT)
-- Partial: WHERE is_active = TRUE
```

**Query patterns supported:**
- `SELECT * FROM cpa_clients WHERE cpa_user_id = $1 AND is_active = TRUE ORDER BY client_name ASC` — CPA client list page: alphabetical list of active clients
- `SELECT COUNT(*) FROM cpa_clients WHERE cpa_user_id = $1 AND is_active = TRUE` — client count for plan limit enforcement (Enterprise plan allows unlimited clients)
- `SELECT * FROM cpa_clients WHERE cpa_user_id = $1 AND is_active = TRUE AND client_name ILIKE $2` — client search by name within a CPA's active clients

**Composite order:** `cpa_user_id` (equality) then `client_name` (sort) supports the alphabetical ordering directly in the index.

**Partial condition:** Archived clients (`is_active = FALSE`) are excluded from the CPA's daily working view. The partial index covers only active clients.

---

### 13.3 `cpa_clients_tin_idx` — Partial on `client_tin` WHERE not NULL

```sql
CREATE INDEX cpa_clients_tin_idx
  ON cpa_clients (client_tin)
  WHERE client_tin IS NOT NULL;
-- Index type: B-tree (partial)
-- Columns: client_tin (VARCHAR(16))
-- Partial: WHERE client_tin IS NOT NULL
```

**Query patterns supported:**
- `SELECT * FROM cpa_clients WHERE client_tin = $1` — find an existing client profile by TIN (duplicate prevention when adding a new client, or when linking a computation to a client)
- `SELECT cpa_user_id FROM cpa_clients WHERE client_tin = $1` — admin: which CPA manages a taxpayer with a given TIN

**Cardinality:** ~15,000 non-NULL TIN values. Moderate selectivity.

---

## 14. cpa_client_computations Indexes

### 14.1 `cpa_cc_pkey` — PRIMARY KEY (id)

```sql
-- Implicit; created by: CONSTRAINT cpa_cc_pkey PRIMARY KEY (id)
-- Index type: B-tree
-- Columns: id (UUID)
-- Partial: No
```

---

### 14.2 `cpa_cc_unique` — UNIQUE (client_id, computation_id)

```sql
-- Implicit; created by: CONSTRAINT cpa_cc_unique UNIQUE (client_id, computation_id)
-- Index type: B-tree (composite, unique)
-- Columns: client_id (UUID), computation_id (UUID)
-- Partial: No
```

**Query patterns supported:**
- `SELECT * FROM cpa_client_computations WHERE client_id = $1` — fetch all computations linked to a specific client
- `SELECT COUNT(*) FROM cpa_client_computations WHERE client_id = $1` — computation count per client

---

### 14.3 `cpa_cc_client_idx` — Index on `(client_id, computation_id)`

```sql
CREATE INDEX cpa_cc_client_idx
  ON cpa_client_computations (client_id, computation_id);
-- Index type: B-tree (composite)
-- Columns: client_id (UUID), computation_id (UUID)
-- Partial: No
-- Note: This index is a subset of the UNIQUE constraint (14.2). It is explicitly named
-- to make the FK child-side intent clear in migration scripts. In PostgreSQL, the UNIQUE
-- index (14.2) is sufficient for this lookup; the explicit index may be dropped if it
-- is confirmed redundant by EXPLAIN ANALYZE.
```

**Query patterns supported:**
- FK child-side lookup: `SELECT * FROM cpa_client_computations WHERE client_id = $1`
- `SELECT computation_id FROM cpa_client_computations WHERE client_id = $1 ORDER BY computation_id` — batch export: list all computation IDs for a client

---

### 14.4 `cpa_cc_computation_idx` — Index on `computation_id`

```sql
CREATE INDEX cpa_cc_computation_idx
  ON cpa_client_computations (computation_id);
-- Index type: B-tree
-- Columns: computation_id (UUID)
-- Partial: No
```

**Query patterns supported:**
- `SELECT client_id FROM cpa_client_computations WHERE computation_id = $1` — reverse lookup: "which client is this computation linked to?" Used in computation detail view to show "This computation belongs to client: Juan dela Cruz"
- FK CASCADE: `DELETE FROM cpa_client_computations WHERE computation_id = $1`

---

## 15. api_keys Indexes

### 15.1 `api_keys_pkey` — PRIMARY KEY (id)

```sql
-- Implicit; created by: CONSTRAINT api_keys_pkey PRIMARY KEY (id)
-- Index type: B-tree
-- Columns: id (UUID)
-- Partial: No
```

---

### 15.2 `api_keys_hash_unique` — UNIQUE (key_hash)

```sql
-- Implicit; created by: CONSTRAINT api_keys_hash_unique UNIQUE (key_hash)
-- Index type: B-tree (unique)
-- Columns: key_hash (TEXT)
-- Partial: No
```

**Query patterns supported:**
- `SELECT user_id, scopes, is_active, expires_at FROM api_keys WHERE key_hash = $1` — every API request authenticated via Bearer token: hash the bearer token and look up the key record

**Cardinality:** ~500 rows (maximum 5 keys × ~100 Enterprise users at 18 months). Index is tiny; constant-time lookup.

---

### 15.3 `api_keys_user_active_idx` — Partial on `user_id` WHERE active

```sql
CREATE INDEX api_keys_user_active_idx
  ON api_keys (user_id)
  WHERE is_active = TRUE;
-- Index type: B-tree (partial)
-- Columns: user_id (UUID)
-- Partial: WHERE is_active = TRUE
```

**Query patterns supported:**
- `SELECT * FROM api_keys WHERE user_id = $1 AND is_active = TRUE` — API key management page: list user's active API keys
- `SELECT COUNT(*) FROM api_keys WHERE user_id = $1 AND is_active = TRUE` — enforce 5-key-per-user limit before allowing a new key creation
- `SELECT scopes FROM api_keys WHERE user_id = $1 AND is_active = TRUE` — authorization check: what scopes does the authenticated user's API key have

---

## 16. audit_logs Indexes

The `audit_logs` table is append-only and will reach 5,000,000 rows at 18 months. Indexes are carefully limited to avoid excessive write overhead on an INSERT-heavy table.

### 16.1 `audit_logs_pkey` — PRIMARY KEY (id)

```sql
-- Implicit; created by: CONSTRAINT audit_logs_pkey PRIMARY KEY (id)
-- Index type: B-tree
-- Columns: id (UUID)
-- Partial: No
```

---

### 16.2 `audit_logs_user_created_idx` — Partial on `(user_id, created_at DESC)` WHERE user_id IS NOT NULL

```sql
CREATE INDEX audit_logs_user_created_idx
  ON audit_logs (user_id, created_at DESC)
  WHERE user_id IS NOT NULL;
-- Index type: B-tree (composite, partial)
-- Columns: user_id (UUID), created_at (TIMESTAMPTZ DESC)
-- Partial: WHERE user_id IS NOT NULL
```

**Query patterns supported:**
- `SELECT action, entity_type, entity_id, ip_address, created_at FROM audit_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50` — account security page: show recent account activity (logins, password changes, etc.)
- `SELECT * FROM audit_logs WHERE user_id = $1 AND action = 'auth.login' ORDER BY created_at DESC LIMIT 10` — last 10 login events for a user

**Partial condition:** ~5% of audit log rows have `user_id IS NULL` (anonymous computation events, system actions). Excluding these 250,000 rows from the index reduces its size by 5%.

**Write cost:** Every authenticated action INSERT adds to this index. At 100 authenticated actions per user lifetime × 50,000 users = 5,000,000 inserts. Each insert is an append to the B-tree (since `created_at DESC` ordering causes new entries to land near the root for recent-data queries). Acceptable.

---

### 16.3 `audit_logs_entity_idx` — Partial on `(entity_type, entity_id, created_at DESC)` WHERE entity_id IS NOT NULL

```sql
CREATE INDEX audit_logs_entity_idx
  ON audit_logs (entity_type, entity_id, created_at DESC)
  WHERE entity_id IS NOT NULL;
-- Index type: B-tree (composite, partial)
-- Columns: entity_type (VARCHAR(30)), entity_id (UUID), created_at (TIMESTAMPTZ DESC)
-- Partial: WHERE entity_id IS NOT NULL
```

**Query patterns supported:**
- `SELECT * FROM audit_logs WHERE entity_type = 'computation' AND entity_id = $1 ORDER BY created_at DESC` — admin: view all events related to a specific computation (debugging, dispute resolution)
- `SELECT * FROM audit_logs WHERE entity_type = 'subscription' AND entity_id = $1 ORDER BY created_at DESC` — admin: view subscription event history
- `SELECT * FROM audit_logs WHERE entity_type = 'invoice' AND entity_id = $1` — admin: billing event trail for a specific invoice

**Cardinality:** ~80% of rows have non-NULL `entity_id`. Leading key `entity_type` has ~10 distinct values; `entity_id` has high cardinality (UUID).

---

### 16.4 `audit_logs_action_created_idx` — Index on `(action, created_at DESC)`

```sql
CREATE INDEX audit_logs_action_created_idx
  ON audit_logs (action, created_at DESC);
-- Index type: B-tree (composite)
-- Columns: action (TEXT), created_at (TIMESTAMPTZ DESC)
-- Partial: No
```

**Query patterns supported:**
- `SELECT DATE_TRUNC('day', created_at), COUNT(*) FROM audit_logs WHERE action = 'computation.run' AND created_at >= NOW() - INTERVAL '30 days' GROUP BY 1 ORDER BY 1` — admin analytics dashboard: daily computation run count for the past 30 days
- `SELECT COUNT(*) FROM audit_logs WHERE action = 'auth.login_failed' AND created_at > NOW() - INTERVAL '1 hour' AND ip_address = $1` — rate limit check: count failed logins from an IP in the past hour

**Cardinality:** `action` has ~25 distinct values (see the action allowed-values list in schema.md §8.1). The `created_at` column has high cardinality (microsecond timestamps). The composite index enables both the action filter and the time-range filter.

---

### 16.5 `audit_logs_ip_created_idx` — Partial on `(ip_address, created_at DESC)` WHERE ip_address IS NOT NULL

```sql
CREATE INDEX audit_logs_ip_created_idx
  ON audit_logs (ip_address, created_at DESC)
  WHERE ip_address IS NOT NULL;
-- Index type: B-tree (composite, partial)
-- Columns: ip_address (INET), created_at (TIMESTAMPTZ DESC)
-- Partial: WHERE ip_address IS NOT NULL
```

**Query patterns supported:**
- `SELECT action, user_id, created_at FROM audit_logs WHERE ip_address = $1 AND action = 'auth.login_failed' AND created_at > NOW() - INTERVAL '15 minutes'` — brute-force detection: check failed login count from an IP address in the recent window
- `SELECT DISTINCT user_id FROM audit_logs WHERE ip_address = $1 AND created_at > NOW() - INTERVAL '24 hours'` — admin security: which accounts logged in from a suspicious IP address

**Write cost note:** `INET` type comparisons in B-tree are supported natively in PostgreSQL. The partial condition excludes system-initiated actions (~5% of rows have NULL `ip_address`).

---

## 17. pdf_exports Indexes

### 17.1 `pdf_exports_pkey` — PRIMARY KEY (id)

```sql
-- Implicit; created by: CONSTRAINT pdf_exports_pkey PRIMARY KEY (id)
-- Index type: B-tree
-- Columns: id (UUID)
-- Partial: No
```

---

### 17.2 `pdf_exports_computation_idx` — Index on `(computation_id, generated_at DESC)`

```sql
CREATE INDEX pdf_exports_computation_idx
  ON pdf_exports (computation_id, generated_at DESC);
-- Index type: B-tree (composite)
-- Columns: computation_id (UUID), generated_at (TIMESTAMPTZ DESC)
-- Partial: No
```

**Query patterns supported:**
- `SELECT * FROM pdf_exports WHERE computation_id = $1 ORDER BY generated_at DESC` — computation detail view: list all PDF exports for this computation (user can re-download previous exports)
- FK CASCADE: `DELETE FROM pdf_exports WHERE computation_id = $1`

---

### 17.3 `pdf_exports_user_created_idx` — Index on `(user_id, generated_at DESC)`

```sql
CREATE INDEX pdf_exports_user_created_idx
  ON pdf_exports (user_id, generated_at DESC);
-- Index type: B-tree (composite)
-- Columns: user_id (UUID), generated_at (TIMESTAMPTZ DESC)
-- Partial: No
```

**Query patterns supported:**
- `SELECT * FROM pdf_exports WHERE user_id = $1 ORDER BY generated_at DESC` — billing/account page: user's PDF download history
- `SELECT SUM(file_size_bytes) FROM pdf_exports WHERE user_id = $1` — storage usage per user (for potential future storage limit enforcement)

---

### 17.4 `pdf_exports_expiry_idx` — Index on `expires_at`

```sql
CREATE INDEX pdf_exports_expiry_idx
  ON pdf_exports (expires_at);
-- Index type: B-tree
-- Columns: expires_at (TIMESTAMPTZ)
-- Partial: No
```

**Query patterns supported:**
- `SELECT id, storage_path FROM pdf_exports WHERE expires_at < NOW() - INTERVAL '90 days'` — R2 object cleanup job: find PDF export metadata rows where the signed URL expired over 90 days ago (the R2 object retention window for PRO users is 30 days; for FREE users 7 days; records are cleaned from DB after 90 days per retention policy)
- `SELECT * FROM pdf_exports WHERE expires_at < NOW() AND expires_at > NOW() - INTERVAL '1 day'` — identify expired-but-recently-expired exports for which a user may request a fresh URL

---

## 18. webhook_endpoints Indexes

These indexes are defined in [api/webhooks.md §10.1](../api/webhooks.md).

### 18.1 `webhook_endpoints_pkey` — PRIMARY KEY (id)

```sql
-- Implicit; created by: CONSTRAINT webhook_endpoints_pkey PRIMARY KEY (id)
-- Index type: B-tree
-- Columns: id (UUID)
-- Partial: No
```

---

### 18.2 `webhook_endpoints_user_url_unique` — UNIQUE (user_id, url)

```sql
-- Implicit; created by: CONSTRAINT webhook_endpoints_user_url_unique UNIQUE (user_id, url)
-- Index type: B-tree (composite, unique)
-- Columns: user_id (UUID), url (TEXT)
-- Partial: No
```

**Query patterns supported:**
- Uniqueness enforcement: prevents a user from registering the same URL twice
- `SELECT id FROM webhook_endpoints WHERE user_id = $1 AND url = $2` — duplicate check before creating a new endpoint

---

### 18.3 `webhook_endpoints_user_idx` — Index on `user_id`

```sql
CREATE INDEX webhook_endpoints_user_idx
  ON webhook_endpoints (user_id);
-- Index type: B-tree
-- Columns: user_id (UUID)
-- Partial: No
```

**Query patterns supported:**
- `SELECT * FROM webhook_endpoints WHERE user_id = $1` — list all endpoints for a user (management API)
- `SELECT COUNT(*) FROM webhook_endpoints WHERE user_id = $1` — enforce 5-endpoint-per-user limit before allowing registration of a new endpoint

**Cardinality:** ~500 rows, ~100 distinct `user_id` values (Enterprise users only). Tiny table.

---

### 18.4 `webhook_endpoints_events_gin_idx` — GIN partial index on `events` array WHERE enabled

```sql
CREATE INDEX webhook_endpoints_events_gin_idx
  ON webhook_endpoints USING GIN (events)
  WHERE enabled = TRUE;
-- Index type: GIN (partial)
-- Column: events (TEXT[])
-- Partial: WHERE enabled = TRUE
-- GIN variant: default (array element containment)
```

**Query patterns supported:**
- Event dispatcher: `SELECT id, url, secret_encrypted FROM webhook_endpoints WHERE user_id = $1 AND enabled = TRUE AND (events = ARRAY[]::TEXT[] OR $2 = ANY(events))` — find all enabled endpoints for a user that subscribe to a given event type

**Why GIN:** The `events` column is a `TEXT[]` array. The query uses `$2 = ANY(events)` which is an array containment operation. GIN indexes for arrays support `@>` and `= ANY()` operators efficiently. A B-tree index cannot be used for array element containment searches.

**Partial condition:** Only enabled endpoints need to be found by the dispatcher. Disabled endpoints are excluded from the GIN index, keeping it small.

**Note on empty-array case:** The event dispatcher query handles two cases:
1. `events = ARRAY[]::TEXT[]` — endpoint subscribed to ALL events (empty array means all)
2. `$2 = ANY(events)` — endpoint subscribed to this specific event type

The GIN index handles case 2. Case 1 (`events = ARRAY[]::TEXT[]`) is an equality check on an empty array, handled by the B-tree portion of the composite search. The dispatcher performs the query in two parts or uses an OR condition that PostgreSQL can evaluate using the GIN index for the non-empty case and a sequential scan for the empty-array case (which returns few rows).

---

## 19. webhook_deliveries Indexes

These indexes are defined in [api/webhooks.md §10.2](../api/webhooks.md).

### 19.1 `webhook_deliveries_pkey` — PRIMARY KEY (id)

```sql
-- Implicit; created by: CONSTRAINT webhook_deliveries_pkey PRIMARY KEY (id)
-- Index type: B-tree
-- Columns: id (UUID)
-- Partial: No
```

---

### 19.2 `webhook_deliveries_endpoint_fk` index

```sql
-- No explicit index for the endpoint_id FK alone.
-- The composite index webhook_deliveries_endpoint_created_idx (19.3) covers FK lookups.
```

---

### 19.3 `webhook_deliveries_endpoint_created_idx` — Index on `(endpoint_id, created_at DESC)`

```sql
CREATE INDEX webhook_deliveries_endpoint_created_idx
  ON webhook_deliveries (endpoint_id, created_at DESC);
-- Index type: B-tree (composite)
-- Columns: endpoint_id (UUID), created_at (TIMESTAMPTZ DESC)
-- Partial: No
```

**Query patterns supported:**
- `SELECT * FROM webhook_deliveries WHERE endpoint_id = $1 ORDER BY created_at DESC LIMIT 50` — `GET /webhook-endpoints/:id/deliveries` — delivery history for an endpoint
- FK CASCADE: `DELETE FROM webhook_deliveries WHERE endpoint_id = $1` — when an endpoint is deleted, cascade delete its delivery records

**Cardinality:** ~500,000 rows, ~500 distinct `endpoint_id` values. Average ~1,000 deliveries per endpoint.

---

### 19.4 `webhook_deliveries_next_retry_idx` — Partial on `next_retry_at` WHERE ATTEMPTING and next_retry_at set

```sql
CREATE INDEX webhook_deliveries_next_retry_idx
  ON webhook_deliveries (next_retry_at)
  WHERE status = 'ATTEMPTING' AND next_retry_at IS NOT NULL;
-- Index type: B-tree (partial)
-- Columns: next_retry_at (TIMESTAMPTZ)
-- Partial: WHERE status = 'ATTEMPTING' AND next_retry_at IS NOT NULL
```

**Query patterns supported:**
- `SELECT id, endpoint_id, event_payload FROM webhook_deliveries WHERE status = 'ATTEMPTING' AND next_retry_at IS NOT NULL AND next_retry_at <= NOW() ORDER BY next_retry_at ASC LIMIT 100` — retry worker job running every 5 seconds: fetch the next batch of deliveries to attempt

**Cardinality of partial:** At any given time, an estimated 10–200 rows are in ATTEMPTING state with a scheduled next_retry_at. The partial index is tiny and fits entirely in memory.

**Write cost:** Updated on each retry: `next_retry_at` is set to the next retry time after a failed attempt. High update frequency per row for failing deliveries (up to 6 attempts), but the total row count in the partial is small.

---

### 19.5 `webhook_deliveries_event_id_idx` — Index on `event_id`

```sql
CREATE INDEX webhook_deliveries_event_id_idx
  ON webhook_deliveries (event_id);
-- Index type: B-tree
-- Columns: event_id (TEXT)
-- Partial: No
```

**Query patterns supported:**
- `SELECT COUNT(*) FROM webhook_deliveries WHERE event_id = $1 AND endpoint_id = $2` — dispatcher idempotency check before creating a new delivery record: "has this event already been queued for this endpoint?"
- `SELECT * FROM webhook_deliveries WHERE event_id = $1` — admin: inspect all delivery attempts for a specific event (troubleshooting missed deliveries)

**Cardinality:** ~500,000 rows, ~500,000 distinct `event_id` values (each event has a unique `evt_...` ID). High cardinality; B-tree point lookup is fast.

---

### 19.6 `webhook_deliveries_exhausted_endpoint_idx` — Partial on `(endpoint_id, created_at DESC)` WHERE EXHAUSTED

```sql
CREATE INDEX webhook_deliveries_exhausted_endpoint_idx
  ON webhook_deliveries (endpoint_id, created_at DESC)
  WHERE status = 'EXHAUSTED';
-- Index type: B-tree (composite, partial)
-- Columns: endpoint_id (UUID), created_at (TIMESTAMPTZ DESC)
-- Partial: WHERE status = 'EXHAUSTED'
```

**Query patterns supported:**
- `SELECT COUNT(*) FROM webhook_deliveries WHERE endpoint_id = $1 AND status = 'EXHAUSTED' AND created_at > NOW() - INTERVAL '24 hours'` — auto-disable logic: if an endpoint has 3 or more EXHAUSTED deliveries in the past 24 hours, automatically set `webhook_endpoints.enabled = FALSE`
- Admin notification query: find endpoints with recent EXHAUSTED deliveries for proactive support outreach

**Partial condition:** EXHAUSTED is a terminal state. Rows are inserted into this partial index only when all 6 retry attempts fail. Low-volume partial index (most deliveries succeed or fail permanently on the first attempt).

---

## 20. Implicit Indexes from Constraints

The following indexes are created implicitly by PostgreSQL when the constraint is defined. They are listed here for completeness to avoid duplicate explicit `CREATE INDEX` statements.

| Table | Implicit Index Name | Columns | Constraint Type |
|---|---|---|---|
| users | users_pkey | id | PRIMARY KEY |
| users | users_email_unique | email | UNIQUE |
| user_sessions | user_sessions_pkey | id | PRIMARY KEY |
| user_sessions | user_sessions_token_unique | session_token_hash | UNIQUE |
| oauth_accounts | oauth_accounts_pkey | id | PRIMARY KEY |
| oauth_accounts | oauth_accounts_provider_user | (provider, provider_user_id) | UNIQUE |
| password_reset_tokens | prt_pkey | id | PRIMARY KEY |
| password_reset_tokens | prt_token_unique | token_hash | UNIQUE |
| email_verification_tokens | evt_pkey | id | PRIMARY KEY |
| email_verification_tokens | evt_token_unique | token_hash | UNIQUE |
| computations | computations_pkey | id | PRIMARY KEY |
| computation_cwt_entries | cwt_entries_pkey | id | PRIMARY KEY |
| computation_quarterly_payments | qpayments_pkey | id | PRIMARY KEY |
| computation_quarterly_payments | qpayments_unique_quarter | (computation_id, quarter) | UNIQUE |
| subscriptions | subscriptions_pkey | id | PRIMARY KEY |
| subscriptions | subscriptions_user_unique | user_id | UNIQUE |
| invoices | invoices_pkey | id | PRIMARY KEY |
| invoices | invoices_provider_invoice_uniq | provider_invoice_id | UNIQUE |
| cpa_clients | cpa_clients_pkey | id | PRIMARY KEY |
| cpa_client_computations | cpa_cc_pkey | id | PRIMARY KEY |
| cpa_client_computations | cpa_cc_unique | (client_id, computation_id) | UNIQUE |
| api_keys | api_keys_pkey | id | PRIMARY KEY |
| api_keys | api_keys_hash_unique | key_hash | UNIQUE |
| audit_logs | audit_logs_pkey | id | PRIMARY KEY |
| pdf_exports | pdf_exports_pkey | id | PRIMARY KEY |
| webhook_endpoints | webhook_endpoints_pkey | id | PRIMARY KEY |
| webhook_endpoints | webhook_endpoints_user_url_unique | (user_id, url) | UNIQUE |
| webhook_deliveries | webhook_deliveries_pkey | id | PRIMARY KEY |

**Total implicit indexes:** 27

**Total explicit `CREATE INDEX` statements:** 30 (from sections 3–19 above)

**Total indexes in production:** 57

---

## 21. Index Maintenance Notes

### 21.1 Index Bloat

B-tree indexes accumulate dead tuples after UPDATE and DELETE operations (PostgreSQL does not reuse dead tuple slots immediately). Periodic `VACUUM` removes dead tuples. PostgreSQL's autovacuum handles this automatically for all tables except `audit_logs` (which has no UPDATEs or DELETEs) and `webhook_deliveries` (high UPDATE rate).

**Tables requiring autovacuum tuning:**

| Table | Reason | Recommended `autovacuum_vacuum_scale_factor` |
|---|---|---|
| computations | High INSERT volume; occasional UPDATE on status | 0.01 (default 0.20 is too slow) |
| audit_logs | INSERT-only; no dead tuples from updates. Standard autovacuum analyze for statistics. | 0.05 for ANALYZE only |
| webhook_deliveries | High UPDATE rate (status, attempt_count, next_retry_at updated on each retry) | 0.01 |

Set via `ALTER TABLE`:
```sql
ALTER TABLE computations SET (autovacuum_vacuum_scale_factor = 0.01);
ALTER TABLE webhook_deliveries SET (autovacuum_vacuum_scale_factor = 0.01);
```

### 21.2 Index-Only Scans

For the following frequently-called queries, PostgreSQL can perform index-only scans (no heap access needed) when the visibility map is up to date:

| Query | Index used | Columns returned from index |
|---|---|---|
| `SELECT user_id FROM subscriptions WHERE user_id = $1` | subscriptions_user_unique | user_id |
| `SELECT expires_at FROM user_sessions WHERE session_token_hash = $1` | user_sessions_token_unique | session_token_hash (then heap for expires_at) |
| `SELECT COUNT(*) FROM computations WHERE tax_year = $1 AND filing_period = $2` | computations_tax_year_idx | tax_year, filing_period |

Regular `VACUUM` (not FREEZE) keeps the visibility map current for index-only scans on high-write tables.

### 21.3 Concurrent Index Creation

All indexes must be created with `CONCURRENTLY` in production to avoid table locks during creation:

```sql
CREATE INDEX CONCURRENTLY users_email_lower_idx ON users (lower(email));
```

The initial schema migration (0001) is run on a fresh empty database where `CONCURRENTLY` is unnecessary. Any index added after go-live in a future migration must use `CREATE INDEX CONCURRENTLY`.

### 21.4 Index Size Estimates at 18 Months

| Index | Table rows | Est. index size |
|---|---|---|
| computations_pkey | 500,000 | 35 MB |
| audit_logs_pkey | 5,000,000 | 350 MB |
| audit_logs_user_created_idx | 4,750,000 | 300 MB |
| audit_logs_action_created_idx | 5,000,000 | 380 MB |
| computations_user_saved_idx (partial) | 100,000 | 7 MB |
| computations_anon_cleanup_idx (partial) | 400,000 | 28 MB |
| cwt_entries_computation_idx | 1,500,000 | 105 MB |
| **Total all indexes** | | **~1.5 GB** |

Total database size including tables and indexes: ~16.5 GB at 18 months. Within Neon PostgreSQL Serverless 50 GB storage tier.

---

## 22. Missing-Index Detection Queries

Run these queries periodically on the production database to identify query patterns that are causing sequential scans on large tables (potential missing indexes):

```sql
-- Query 1: Find seq scans on large tables (run during normal traffic)
-- A seq_scan count growing faster than idx_scan count signals a missing index.
SELECT
  relname AS table_name,
  seq_scan,
  idx_scan,
  seq_tup_read,
  idx_tup_fetch,
  ROUND(100.0 * seq_scan / NULLIF(seq_scan + idx_scan, 0), 1) AS seq_scan_pct
FROM pg_stat_user_tables
WHERE relname IN (
  'users', 'user_sessions', 'computations', 'computation_cwt_entries',
  'computation_quarterly_payments', 'subscriptions', 'invoices',
  'cpa_clients', 'audit_logs', 'api_keys', 'webhook_deliveries'
)
ORDER BY seq_tup_read DESC;
-- Warning threshold: seq_scan_pct > 10% on tables with > 10,000 rows
-- indicates a query is bypassing available indexes.

-- Query 2: Unused indexes (safe to drop if index has been live for > 30 days)
SELECT
  indexrelname AS index_name,
  relname AS table_name,
  idx_scan AS times_used,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexrelname NOT LIKE '%_pkey'
  AND indexrelname NOT LIKE '%_unique'
ORDER BY pg_relation_size(indexrelid) DESC;
-- Indexes with idx_scan = 0 and not required for UNIQUE or PK constraints
-- can be dropped to reduce write overhead.

-- Query 3: Index usage ratio per table
SELECT
  t.relname AS table_name,
  i.indexrelname AS index_name,
  i.idx_scan AS scans,
  pg_size_pretty(pg_relation_size(i.indexrelid)) AS size
FROM pg_stat_user_indexes i
JOIN pg_stat_user_tables t ON t.relid = i.relid
WHERE t.relname IN (
  'computations', 'audit_logs', 'webhook_deliveries'
)
ORDER BY t.relname, i.idx_scan DESC;
```

Run `Query 1` and `Query 2` weekly during the first 3 months post-launch to validate that all indexes are being used and no new query patterns have emerged that need additional indexes. After 3 months of stable traffic, reduce to monthly.
