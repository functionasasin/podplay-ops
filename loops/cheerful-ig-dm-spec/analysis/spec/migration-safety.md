# Spec: Migration Safety — Instagram DM Support

**Aspect**: `spec-migration-safety`
**Wave**: 4 — Integration, Phasing & Synthesis
**Date**: 2026-03-01
**Input files**:
- `analysis/spec/db-migrations.md` — full migration SQL
- `analysis/spec/phase-plan.md` — phased file manifest + env vars
- `analysis/audit/db-schemas.md` — exact current schema baseline (constraint names)

---

## Overview

This document covers:
1. Risk classification for each migration operation
2. CHECK constraint expansion: transaction safety and correctness proof
3. Backward compatibility guarantees for existing Gmail/SMTP code paths
4. Feature flag gating (`ENABLE_IG_DM`)
5. Complete rollback SQL (exact DDL to return to pre-migration state)
6. Zero-downtime deployment sequence

---

## Files

| Action | Path |
|--------|------|
| Reference | `projects/cheerful/supabase/migrations/20260228000000_ig_dm_support.sql` |
| Modify | `apps/backend/src/core/config/definition.py` (add `ENABLE_IG_DM`) |

No new files are introduced by this safety spec — it documents the migration file already specified in `spec-db-migrations.md`.

---

## 1. Risk Classification

Every operation in `20260228000000_ig_dm_support.sql` is classified by risk level.

### 1a. New Tables (Zero Risk)

All 7 new tables are purely additive. No existing query, code path, or data is affected.

| Table | Risk | Notes |
|-------|------|-------|
| `user_ig_dm_account` | None | New table, no existing references |
| `ig_dm_message` | None | New table |
| `ig_igsid_cache` | None | New table, no FK to existing tables |
| `ig_dm_thread_state` | None | New table |
| `latest_ig_dm_message_per_thread` | None | New table + trigger on new table |
| `ig_dm_llm_draft` | None | New table |
| `ig_dm_oauth_state` | None | New table |

### 1b. ADD COLUMN Operations (Zero Risk)

All `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` operations add nullable columns with no default constraints. PostgreSQL performs these with an instant catalog update (no table rewrite, no row scan).

| Table | Column(s) Added | Risk | Notes |
|-------|----------------|------|-------|
| `campaign_sender` | `ig_dm_account_id UUID` | None | Nullable, no default |
| `campaign_thread` | `ig_dm_thread_id TEXT`, `ig_dm_account_id UUID` | None | Nullable, no default |
| `thread_flag` | `ig_dm_thread_id TEXT`, `ig_dm_account_id UUID` | None | Nullable, no default |
| `campaign_creator` | `ig_igsid TEXT` | None | Nullable, no default |

### 1c. CHECK Constraint Expansion (Low Risk — Analyzed Below)

Three tables have their existing 2-way mutual-exclusivity `CHECK` constraint replaced with a 3-way version. This requires:
1. `DROP CONSTRAINT IF EXISTS` — releases the old constraint
2. `ADD CONSTRAINT ... CHECK (...)` — validates all existing rows against the new expression

Risk is **low** because all existing rows satisfy the new 3-way constraint. Full analysis in Section 2.

| Table | Old Constraint Name | New Constraint Name | Lock Type |
|-------|--------------------|--------------------|-----------|
| `campaign_sender` | `chk_campaign_sender_account_type` | `chk_campaign_sender_account_type` | `ACCESS EXCLUSIVE` |
| `campaign_thread` | `chk_campaign_thread_one_thread_id` | `chk_campaign_thread_one_thread_id` | `ACCESS EXCLUSIVE` |
| `thread_flag` | `chk_thread_flag_one_thread_id` | `chk_thread_flag_one_thread_id` | `ACCESS EXCLUSIVE` |

### 1d. New Indexes (Zero Risk)

Index creation adds performance overhead only. New B-tree and GIN indexes do not affect existing queries.

| Table | Index | Type |
|-------|-------|------|
| `campaign_creator` | `idx_campaign_creator_ig_igsid` | B-tree (partial, `WHERE ig_igsid IS NOT NULL`) |
| `campaign_creator` | `idx_campaign_creator_social_handles_gin` | GIN (on `social_media_handles` JSONB) |
| `campaign_thread` | `idx_campaign_thread_ig_dm` | Unique B-tree (partial) |
| `campaign_sender` | `idx_campaign_sender_ig_dm` | B-tree |
| `thread_flag` | `idx_thread_flag_ig_dm` | B-tree (partial) |

**GIN index note**: Building a GIN index on an existing `campaign_creator.social_media_handles` column requires scanning all rows. This is the slowest operation in the migration — but it is safe (read-only scan, no writes blocked for long). If `campaign_creator` has > 100K rows, consider building the GIN index with `CREATE INDEX CONCURRENTLY` outside the migration transaction (Supabase supports this via a separate migration file). Typical Cheerful campaign_creator row counts are in the low thousands — GIN build will complete in under 1 second.

---

## 2. CHECK Constraint Expansion: Safety Proof

### Why the Expansion is Safe

All three tables (`campaign_sender`, `campaign_thread`, `thread_flag`) have a 2-way CHECK constraint of the form:

```sql
-- Current 2-way form
(gmail_thread_id IS NOT NULL AND email_thread_id IS NULL) OR
(gmail_thread_id IS NULL     AND email_thread_id IS NOT NULL)
```

After the migration adds `ig_dm_*` columns (all `NULL` by default), the new 3-way form is:

```sql
-- New 3-way form
(gmail_thread_id IS NOT NULL AND email_thread_id IS NULL     AND ig_dm_thread_id IS NULL) OR
(gmail_thread_id IS NULL     AND email_thread_id IS NOT NULL AND ig_dm_thread_id IS NULL) OR
(gmail_thread_id IS NULL     AND email_thread_id IS NULL     AND ig_dm_thread_id IS NOT NULL)
```

**Proof that all existing rows satisfy the 3-way constraint:**

Every existing row satisfies either the Gmail branch or the SMTP branch of the 2-way constraint. Since `ig_dm_thread_id` does not yet exist when the `ADD COLUMN` fires (it is added moments earlier in the same transaction), every existing row has `ig_dm_thread_id = NULL` after the column is added.

- Gmail rows: `gmail_thread_id IS NOT NULL` AND `email_thread_id IS NULL` AND `ig_dm_thread_id = NULL (just added)` → satisfies Branch 1 ✓
- SMTP rows: `gmail_thread_id IS NULL` AND `email_thread_id IS NOT NULL` AND `ig_dm_thread_id = NULL (just added)` → satisfies Branch 2 ✓

PostgreSQL's `ADD CONSTRAINT ... CHECK` validates all rows at constraint-add time. Since every row satisfies Branch 1 or Branch 2, validation passes immediately and the constraint is created successfully.

### Transaction Atomicity

The `DROP CONSTRAINT` + `ADD CONSTRAINT` sequence happens within a single PostgreSQL transaction (the migration file). There is no window where a row could violate the old constraint but not yet be protected by the new one — the intermediate state (no constraint) is never visible to concurrent connections due to transaction isolation.

```
BEGIN; -- implicit for psql migration file
  ADD COLUMN ig_dm_thread_id TEXT;          -- catalog update, instant
  DROP CONSTRAINT chk_..._one_thread_id;    -- acquire ACCESS EXCLUSIVE, drop from catalog
  ADD CONSTRAINT chk_..._one_thread_id CHECK (...);  -- validate all rows, add to catalog
COMMIT;
```

PostgreSQL holds the `ACCESS EXCLUSIVE` lock on each table from `DROP CONSTRAINT` through `ADD CONSTRAINT COMMIT`. During this lock window, all concurrent reads and writes on the affected table queue. The lock window is brief — milliseconds for small tables.

### Lock Window Estimate

| Table | Typical row count | Estimated lock duration |
|-------|------------------|------------------------|
| `campaign_sender` | < 10K | < 10 ms |
| `campaign_thread` | < 100K | < 50 ms |
| `thread_flag` | < 100K | < 50 ms |

These tables are not in the hot path of frequent concurrent writes. The lock window is acceptable for a planned migration window.

### Migration Ordering Within the File

The migration file must execute column additions **before** constraint additions. The section order in `20260228000000_ig_dm_support.sql` is already correct:

```
Section 1:  CREATE TABLE user_ig_dm_account    ← must exist before FK columns below
Section 2:  ALTER TABLE campaign_sender (ADD COLUMN + DROP/ADD CHECK)
Section 3:  CREATE TABLE ig_dm_message
...
Section 8:  ALTER TABLE campaign_thread (ADD COLUMN + DROP/ADD CHECK)
Section 9:  ALTER TABLE thread_flag (ADD COLUMN + DROP/ADD CHECK)
Section 10: ALTER TABLE campaign_creator (ADD COLUMN + GIN index)
```

**Critical ordering dependency**: `user_ig_dm_account` (Section 1) must be created before the `ig_dm_account_id UUID REFERENCES user_ig_dm_account(id)` columns are added in Sections 2, 8, and 9. The file already satisfies this — no reordering needed.

---

## 3. Backward Compatibility Guarantees

### 3a. Database Layer

All existing `gmail_*` and `smtp_*` queries are unchanged. New columns are nullable with no defaults — they are invisible to any `SELECT *` query that doesn't reference them explicitly, and any `INSERT` that doesn't name them gets `NULL`.

The expanded CHECK constraints are a strict superset of the old constraints for Gmail/SMTP rows: existing rows that satisfied the 2-way constraint continue to satisfy the 3-way constraint (Branch 1 and Branch 2 are literally preserved).

### 3b. Backend Python Layer

| Change | Backward-compatible? | Reason |
|--------|---------------------|--------|
| `AccountType.INSTAGRAM_DM` added to StrEnum | Yes | Additive; existing code that matches on `GMAIL` or `SMTP` is unaffected |
| `Candidate` model: 4 new Optional fields added | Yes | Python `NamedTuple`/dataclass additions are additive; callers that don't pass them get `None` |
| `ThreadProcessingCoordinatorWorkflow`: new `elif is_ig_dm` branch | Yes | New branch only fires when `candidate.ig_dm_account_id is not None`; existing Gmail/SMTP paths are structurally unchanged |
| `update_state_status_activity` dispatch added | Yes | New dispatch only runs when `ig_dm_account_id is not None`; existing call sites do not set this field |
| `campaign_creator` repository: 3 new methods | Yes | Purely additive |
| `MetaGraphService`, `IgDmService`: new files | Yes | No existing imports; gated by feature flag in routes |

### 3c. Temporal Workflow Layer

All new workflows and activities are registered alongside existing ones in `worker.py`. Temporal workers are additive — registering new workflow/activity types does not affect currently-running Gmail/SMTP workflow instances. Workflow type names are namespaced (`IgDmIngestWorkflow`, etc.) and do not clash with any existing workflow.

The `ThreadProcessingCoordinatorWorkflow` signal handler additions are backward-compatible: the new `IgDmIngestWorkflow` signals a new signal name. Existing workflows that do not receive this signal are unaffected.

### 3d. API Layer

All new routes are mounted under new prefixes (`/webhooks/instagram/`, `/api/v1/ig-dm-accounts`, `/api/ig-dm/threads`). No existing routes are modified. All new routes check `settings.ENABLE_IG_DM` at startup or per-request (see Section 4).

---

## 4. Feature Flag Gating

### Environment Variable

**Variable**: `ENABLE_IG_DM`
**Type**: `bool` (Pydantic `Settings` field with `default=False`)
**File**: `apps/backend/src/core/config/definition.py`

```python
# In Settings class:
ENABLE_IG_DM: bool = False
```

### Gating Points

| Location | How gated | Behavior when `ENABLE_IG_DM=False` |
|----------|-----------|-------------------------------------|
| `ig_dm_webhook.py`: POST handler | Check at request time | Return `200 OK` with `{"status": "ig_dm_disabled"}`, no DB writes, no Temporal starts |
| `ig_dm_webhook.py`: GET handler | Not gated | Always respond to Meta hub.challenge (Meta requires verification endpoint live before enabling in dashboard) |
| `ig_dm_account.py`: all routes | FastAPI dependency at router level | Return `503 Service Unavailable` with `{"error": "ig_dm_disabled"}` |
| `ig_dm_thread.py`: all routes | FastAPI dependency at router level | Return `503 Service Unavailable` |
| CE tools (`ig_dm_tools.py`) | Check `settings.ENABLE_IG_DM` in tool function | Return tool error: `"IG DM feature is not enabled"` |
| Temporal worker | All IG DM workflows/activities registered regardless | Flag gates Temporal starts from API; Temporal itself doesn't know about the flag |

### Feature Flag FastAPI Dependency

```python
# apps/backend/src/api/dependencies/ig_dm.py

from fastapi import HTTPException
from src.core.config import settings

def require_ig_dm_enabled() -> None:
    """FastAPI dependency: raises 503 if ENABLE_IG_DM is False."""
    if not settings.ENABLE_IG_DM:
        raise HTTPException(
            status_code=503,
            detail={"error": "ig_dm_disabled", "message": "IG DM feature is not enabled"}
        )
```

This dependency is applied at the router level in `ig_dm_account.py` and `ig_dm_thread.py`:
```python
router = APIRouter(
    prefix="/ig-dm-accounts",
    tags=["ig-dm-accounts"],
    dependencies=[Depends(require_ig_dm_enabled)],
)
```

### Webhook Exception

The webhook verification endpoint (`GET /webhooks/instagram/`) is **not** gated by `ENABLE_IG_DM`. Meta requires the verification endpoint to respond correctly before the app can be configured in the developer portal. The POST handler is gated with a no-op 200 return (Meta requires 200 responses even when not processing).

---

## 5. Rollback Plan

If the migration needs to be reverted, execute the following SQL in a transaction. This is the complete inverse of `20260228000000_ig_dm_support.sql`.

**When to use**: If a post-migration issue is discovered and rolling forward is not immediately feasible.

**Pre-condition**: No `user_ig_dm_account` rows exist (rollback is only valid before any IG DM accounts are connected).

### Rollback SQL

```sql
BEGIN;

--------------------------------------------------------------------------------
-- ROLLBACK: Remove IG DM Support
-- Pre-condition: No rows in user_ig_dm_account (no IG accounts connected)
-- Inverse of: 20260228000000_ig_dm_support.sql
--------------------------------------------------------------------------------

-- Step 1: Drop tables in reverse FK dependency order

DROP TABLE IF EXISTS ig_dm_llm_draft;
-- ^ references ig_dm_thread_state and user_ig_dm_account

DROP TABLE IF EXISTS latest_ig_dm_message_per_thread;
-- ^ references ig_dm_message and user_ig_dm_account

DROP TABLE IF EXISTS ig_dm_thread_state;
-- ^ references user_ig_dm_account

DROP TABLE IF EXISTS ig_igsid_cache;
-- ^ no FK dependencies; safe to drop any time

DROP TABLE IF EXISTS ig_dm_message;
-- ^ references user_ig_dm_account

DROP TABLE IF EXISTS ig_dm_oauth_state;
-- ^ references auth.users

DROP TABLE IF EXISTS user_ig_dm_account;
-- ^ must be last; all ig_dm_* tables dropped first

-- Step 2: Revert campaign_sender
--   Remove ig_dm_account_id column + restore original 2-way CHECK constraint

ALTER TABLE campaign_sender
    DROP CONSTRAINT IF EXISTS chk_campaign_sender_account_type;

ALTER TABLE campaign_sender
    DROP CONSTRAINT IF EXISTS uq_campaign_sender_ig_dm;

DROP INDEX IF EXISTS idx_campaign_sender_ig_dm;

ALTER TABLE campaign_sender
    DROP COLUMN IF EXISTS ig_dm_account_id;

-- Restore original 2-way constraint (Gmail OR SMTP)
ALTER TABLE campaign_sender
    ADD CONSTRAINT chk_campaign_sender_account_type CHECK (
        (gmail_account_id IS NOT NULL AND smtp_account_id IS NULL) OR
        (gmail_account_id IS NULL     AND smtp_account_id IS NOT NULL)
    );

-- Step 3: Revert campaign_thread
--   Remove ig_dm_thread_id + ig_dm_account_id columns + restore original 2-way CHECK constraint

DROP INDEX IF EXISTS idx_campaign_thread_ig_dm;

ALTER TABLE campaign_thread
    DROP CONSTRAINT IF EXISTS chk_campaign_thread_one_thread_id;

ALTER TABLE campaign_thread
    DROP CONSTRAINT IF EXISTS chk_campaign_thread_ig_dm_account;

ALTER TABLE campaign_thread
    DROP COLUMN IF EXISTS ig_dm_thread_id;

ALTER TABLE campaign_thread
    DROP COLUMN IF EXISTS ig_dm_account_id;

-- Restore original 2-way constraint (Gmail OR SMTP)
ALTER TABLE campaign_thread
    ADD CONSTRAINT chk_campaign_thread_one_thread_id CHECK (
        (gmail_thread_id IS NOT NULL AND email_thread_id IS NULL) OR
        (gmail_thread_id IS NULL     AND email_thread_id IS NOT NULL)
    );

-- Step 4: Revert thread_flag
--   Remove ig_dm_thread_id + ig_dm_account_id columns + restore original 2-way CHECK constraint

DROP INDEX IF EXISTS idx_thread_flag_ig_dm;

ALTER TABLE thread_flag
    DROP CONSTRAINT IF EXISTS chk_thread_flag_one_thread_id;

ALTER TABLE thread_flag
    DROP CONSTRAINT IF EXISTS chk_thread_flag_ig_dm_account;

ALTER TABLE thread_flag
    DROP CONSTRAINT IF EXISTS uq_thread_flag_ig_dm;

ALTER TABLE thread_flag
    DROP COLUMN IF EXISTS ig_dm_thread_id;

ALTER TABLE thread_flag
    DROP COLUMN IF EXISTS ig_dm_account_id;

-- Restore original 2-way constraint (Gmail OR SMTP)
ALTER TABLE thread_flag
    ADD CONSTRAINT chk_thread_flag_one_thread_id CHECK (
        (gmail_thread_id IS NOT NULL AND email_thread_id IS NULL) OR
        (gmail_thread_id IS NULL     AND email_thread_id IS NOT NULL)
    );

-- Step 5: Revert campaign_creator
--   Remove ig_igsid column + indexes

DROP INDEX IF EXISTS idx_campaign_creator_ig_igsid;
DROP INDEX IF EXISTS idx_campaign_creator_social_handles_gin;

ALTER TABLE campaign_creator
    DROP COLUMN IF EXISTS ig_igsid;

COMMIT;
```

### Python Rollback Steps (Code Changes)

After running the rollback SQL, revert the following Python code changes:

| File | Revert |
|------|--------|
| `apps/backend/src/models/database/account_type.py` | Remove `INSTAGRAM_DM = "instagram_dm"` |
| `apps/backend/src/models/temporal/gmail_thread_state.py` | Remove 4 IG DM fields from `Candidate`; remove `ig_dm_account_id` from `UpdateStateStatusParams` |
| `apps/backend/src/temporal/worker.py` | Unregister all IG DM workflows + activities |
| `apps/backend/src/temporal/workflow/__init__.py` | Remove IG DM workflow exports |
| `apps/backend/src/temporal/activity/__init__.py` | Remove IG DM activity exports |
| `apps/backend/src/api/router.py` | Unmount IG DM routers |
| `apps/backend/main.py` | Unmount IG DM webhook router |
| `apps/backend/src/temporal/workflow/thread_processing_coordinator_workflow.py` | Remove `elif is_ig_dm` branch |
| `apps/backend/src/temporal/activity/gmail_thread_state.py` | Remove IG DM dispatch from `update_state_status_activity` |
| `apps/backend/src/repositories/campaign_creator.py` | Remove 3 new IG DM methods |
| `apps/backend/src/core/config/definition.py` | Remove 6 IG DM env vars |

All new Python files (workflows, activities, services, repositories, models) can simply be deleted.

### Rollback Risk Assessment

| Risk | Mitigation |
|------|-----------|
| IG DM rows exist when rollback runs | Check `SELECT COUNT(*) FROM user_ig_dm_account` before rollback; must be 0 |
| Active Temporal workflows referencing IG DM activities | Drain IG DM task queue before rollback; running workflows will fail with activity not found |
| Feature flag left as `true` after code rollback | Set `ENABLE_IG_DM=false` and redeploy before running rollback SQL |

---

## 6. Zero-Downtime Deployment Sequence

This deployment sequence ensures existing Gmail/SMTP functionality is never interrupted.

### Pre-Migration Checklist

- [ ] Verify `campaign_thread` row count: `SELECT COUNT(*) FROM campaign_thread` — confirm < 500K rows (CHECK constraint validation will be fast)
- [ ] Verify `campaign_sender` row count: `SELECT COUNT(*) FROM campaign_sender` — confirm < 50K rows
- [ ] Verify `thread_flag` row count: `SELECT COUNT(*) FROM thread_flag` — confirm < 500K rows
- [ ] Verify no active Gmail/SMTP ingestion workflows during migration window (coordinate with scheduled polling)
- [ ] Ensure `ENABLE_IG_DM` is not set in any environment (defaults to `false`)
- [ ] Meta App configuration in Developer Portal: at minimum, verify token and webhook URL set (required for Phase 1 verification)

### Deployment Steps

**Step 1 — Deploy migration (with `ENABLE_IG_DM=false`)**

```bash
# Apply migration via Supabase CLI
supabase db push --db-url $SUPABASE_DB_URL

# Verify migration succeeded
psql $DATABASE_URL -c "\d user_ig_dm_account"  -- should show new table
psql $DATABASE_URL -c "\d campaign_thread"      -- should show new columns
```

The migration is safe to run while the existing backend is live. New tables are invisible to old code. CHECK constraint expansion locks each table for < 100ms (acceptable during low-traffic window).

**Step 2 — Deploy backend code (with `ENABLE_IG_DM=false`)**

```bash
# Deploy backend with all IG DM code but feature flag off
ENABLE_IG_DM=false fly deploy --app cheerful-backend
```

With `ENABLE_IG_DM=false`:
- All new IG DM routes return 503
- Webhook POST returns 200 no-op
- No new Temporal workflows are started
- All existing Gmail/SMTP code paths run unmodified

**Step 3 — Smoke test existing functionality**

```bash
# Verify Gmail ingest is unaffected
curl -X POST $BACKEND_URL/api/v1/gmail/sync  # should trigger Gmail poll
# Verify SMTP sync is unaffected
curl -X POST $BACKEND_URL/api/v1/smtp/sync   # should trigger SMTP sync
# Verify webhook verification endpoint is live (required for Meta portal)
curl "$BACKEND_URL/webhooks/instagram/?hub.mode=subscribe&hub.verify_token=$META_WEBHOOK_VERIFY_TOKEN&hub.challenge=12345"
# ^ should return "12345"
```

**Step 4 — Deploy context engine (with `ENABLE_IG_DM=false`)**

```bash
# Deploy CE with new IG DM tools (they check ENABLE_IG_DM flag internally)
fly deploy --app cheerful-context-engine
```

**Step 5 — Enable feature flag**

Once Phase 1 is fully verified in staging:
```bash
# Enable IG DM feature
fly secrets set ENABLE_IG_DM=true --app cheerful-backend
fly secrets set ENABLE_IG_DM=true --app cheerful-context-engine  # if CE reads this setting
```

**Step 6 — Verify IG DM endpoints are live**

```bash
# Verify account listing route is active
curl -H "Authorization: Bearer $JWT" $BACKEND_URL/api/v1/ig-dm-accounts
# ^ should return 200 with empty list (not 503)

# Verify webhook handler accepts posts
curl -X POST -H "Content-Type: application/json" \
     -H "X-Hub-Signature-256: sha256=$(echo -n '{}' | openssl dgst -sha256 -hmac $META_APP_SECRET | cut -d' ' -f2)" \
     $BACKEND_URL/webhooks/instagram/ -d '{}'
# ^ should return 200 (HMAC validation will fail for empty body, but 200 confirms handler is active)
```

**Step 7 — Connect first IG account (Phase 1 validation)**

- Use `cheerful_connect_ig_account` CE tool or POST to `/api/v1/ig-dm-accounts` with OAuth callback
- Verify `user_ig_dm_account` row created with `webhook_subscribed=true`
- Send a test DM from a test Instagram account
- Verify `ig_dm_message` row created within 5 seconds
- Verify `ig_dm_thread_state` row created with `status=READY_FOR_CAMPAIGN_ASSOCIATION`

### Rollback Decision Point

If Step 3 smoke tests fail (existing Gmail/SMTP functionality broken), roll back immediately:
1. Revert backend to previous deployment: `fly deploy --app cheerful-backend --image <previous-image>`
2. Run rollback SQL (Section 5)

If Steps 5–7 fail (IG DM feature broken but existing features working), set `ENABLE_IG_DM=false` and investigate without rollback.

---

## 7. Additional Safety Notes

### `ig_igsid_cache` Has No RLS

`ig_igsid_cache` has no RLS (`ENABLE ROW LEVEL SECURITY` is not called for it). This table contains no user data — it is a system-level cache of IGSID → username mappings that is:
- Written by the backend service only (Temporal activities)
- Never exposed directly to the frontend (no API endpoint returns raw cache rows)
- Shared across all users (no `user_id` column)

Access control is enforced at the application level, not the database level. This matches the intended design and is documented in `spec-db-migrations.md`.

### Trigger Function Naming

The new trigger function `update_latest_ig_dm_message_per_thread()` does not conflict with existing trigger functions:
- `update_latest_gmail_message_per_thread()` — Gmail
- `update_latest_smtp_message_per_thread()` — SMTP

All three are distinct function names with no shared state.

### `campaign_thread_gmail_thread_id_key` and `campaign_thread_email_thread_id_key`

The existing UNIQUE constraints on `campaign_thread.gmail_thread_id` and `campaign_thread.email_thread_id` remain unchanged. The new `ig_dm_thread_id` column gets its own partial unique index (`idx_campaign_thread_ig_dm`) rather than a table-level UNIQUE constraint, because `ig_dm_thread_id` is only unique in combination with `ig_dm_account_id` (see `spec-db-migrations.md` Section 8 for the composite uniqueness design).

### Python-Only Changes to Enums and Type Aliases

`AccountType.INSTAGRAM_DM` and `IgDmThreadStatus = GmailThreadStatus` are Python-only additions. The database stores account type and thread status as `TEXT` columns — no PostgreSQL ENUM type is modified. This means:
- No DB migration needed for these enum additions
- Values can be changed without a schema migration
- No risk of `psycopg2.errors.InvalidTextRepresentation` from unknown enum values

### `spec-phase-plan.md` Schema Discrepancies

Three items noted in `spec-phase-plan.md` (Section "Schema Discrepancies to Resolve Before Phase 1") are incorporated into the migration file:
1. `ig_dm_oauth_state` table — included in Section 1 of the rollback SQL above
2. `user_access_token` + `user_token_expires_at` columns on `user_ig_dm_account` — included in `spec-db-migrations.md` Section 1 (the spec already includes them in the CREATE TABLE)
3. `window_expiry_notified_at TIMESTAMPTZ` on `ig_dm_thread_state` — included in `spec-db-migrations.md` Section 5 (the spec already includes it in the CREATE TABLE)

All three are part of the single migration file. No Phase 3 amendment migration is required.
