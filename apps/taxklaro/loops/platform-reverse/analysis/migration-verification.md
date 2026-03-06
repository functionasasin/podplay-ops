# Migration Verification — TaxKlaro

**Wave:** 6 (Testing + Deployment)
**Status:** COMPLETE
**Date:** 2026-03-06
**Depends on:** supabase-migrations

---

## Summary

Complete migration test plan for TaxKlaro. Specifies the exact `supabase db reset` procedure, test calls for every RPC function with expected results, RLS policy verification queries from authorized and unauthorized contexts, and an explicit parameter-type-to-column-type match table. The forward loop MUST run all of these in Phase 5 (Platform) before marking migrations complete.

---

## Step 1: Reset and Verify Idempotency

```bash
# Run from: frontend/ (where supabase/ directory lives)
supabase db reset
```

**Expected:** Exits with code 0. Zero SQL errors. The reset runs all 4 migrations in order:
1. `001_initial_schema.sql` — creates tables, enums, triggers
2. `002_rls_policies.sql` — creates helper + RLS policies
3. `003_rpc_functions.sql` — creates 6 RPC functions with GRANTs
4. `004_storage.sql` — creates firm-logos bucket + storage policies

**Verify idempotency** — run reset a second time:
```bash
supabase db reset
```
Expected: Also exits with code 0. `IF NOT EXISTS`, `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object`, `CREATE OR REPLACE`, `DROP POLICY IF EXISTS`, and `ON CONFLICT DO NOTHING` ensure all operations are safe to re-run.

---

## Step 2: RPC Function Test Calls

Run these via `supabase db shell` or `psql $SUPABASE_DB_URL`. Each test uses the Supabase test role pattern.

### 2.1 `get_shared_computation(p_token UUID)`

**Purpose:** Public read-only access to a computation by share token.

**Test A — No match (returns empty, not error):**
```sql
SELECT * FROM get_shared_computation('00000000-0000-0000-0000-000000000000'::UUID);
```
Expected: 0 rows (not an error, not NULL — the function returns a TABLE which is empty).

**Test B — Shared computation (returns data):**
```sql
-- Setup: insert a test computation with share enabled
INSERT INTO computations (org_id, user_id, title, share_enabled, share_token)
VALUES (
  '<test-org-id>'::UUID,
  '<test-user-id>'::UUID,
  'Test Computation',
  true,
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'::UUID
);

-- Call with known token
SELECT id, title, share_enabled FROM get_shared_computation(
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'::UUID
);
```
Expected: 1 row with `title = 'Test Computation'`.

**Test C — Share disabled (returns empty):**
```sql
-- Update share_enabled to false
UPDATE computations SET share_enabled = false WHERE share_token = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'::UUID;

SELECT * FROM get_shared_computation('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'::UUID);
```
Expected: 0 rows.

**Test D — Soft-deleted computation (returns empty):**
```sql
UPDATE computations SET deleted_at = now(), share_enabled = true WHERE share_token = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'::UUID;
SELECT * FROM get_shared_computation('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'::UUID);
```
Expected: 0 rows.

**CRITICAL TYPE CHECK:** The parameter is `UUID`, not `TEXT`. This prevents the inheritance failure:
```sql
-- This MUST fail with a type error (correct behavior):
SELECT * FROM get_shared_computation('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee');
-- ERROR: function get_shared_computation(unknown) does not exist
-- OR: it implicitly casts to UUID (acceptable). Verify the cast succeeds.
```

**Anonymous grant verification:**
```sql
-- As anon role (simulates unauthenticated browser):
SET LOCAL ROLE anon;
SELECT * FROM get_shared_computation('00000000-0000-0000-0000-000000000000'::UUID);
-- Expected: 0 rows (NOT "permission denied for function")
RESET ROLE;
```

---

### 2.2 `create_organization(p_name TEXT, p_slug TEXT)`

**Purpose:** Creates org + adds calling user as admin in one atomic operation.

**Test A — Successful creation (as authenticated user):**
```sql
-- Simulate authenticated user
SET LOCAL request.jwt.claim.sub = '<test-user-uuid>';

SELECT create_organization('Test Firm', 'test-firm');
```
Expected:
```json
{"success": true, "org_id": "<some-uuid>"}
```

**Test B — Duplicate slug:**
```sql
SELECT create_organization('Another Firm', 'test-firm');
```
Expected:
```json
{"success": false, "error": "Slug already taken: test-firm"}
```

**Test C — Invalid slug format:**
```sql
SELECT create_organization('Bad Firm', 'BAD-SLUG-WITH-CAPS');
```
Expected:
```json
{"success": false, "error": "Invalid slug: must be 3-50 lowercase alphanumeric chars and hyphens"}
```

**Test D — Not authenticated:**
```sql
SET LOCAL ROLE anon;
SELECT create_organization('Anon Firm', 'anon-firm');
-- Expected: {"success": false, "error": "Not authenticated"}
-- OR: EXCEPTION raised (both are acceptable — check which Supabase surfaces to client)
RESET ROLE;
```

**Post-condition checks:**
```sql
-- Verify org was inserted:
SELECT id, name, slug, plan FROM organizations WHERE slug = 'test-firm';
-- Expected: 1 row, plan = 'free'

-- Verify calling user added as admin:
SELECT role FROM organization_members WHERE org_id = '<org-id>' AND user_id = '<test-user-uuid>';
-- Expected: role = 'admin'

-- Verify user_profile created (or already existed):
SELECT id FROM user_profiles WHERE id = '<test-user-uuid>';
-- Expected: 1 row
```

---

### 2.3 `accept_invitation(p_token UUID)`

**Purpose:** Validates + accepts an invitation. Handles expired, revoked, already-accepted states. Returns org details for redirect.

**Test A — Valid invitation (authenticated user, matching email):**
```sql
-- Setup: insert pending invitation
INSERT INTO organization_invitations (org_id, email, role, token, status, invited_by)
VALUES (
  '<test-org-id>'::UUID,
  'invitee@example.com',
  'accountant',
  'cccccccc-dddd-eeee-ffff-000000000001'::UUID,
  'pending',
  '<inviter-user-id>'::UUID
);

-- Simulate authenticated user with matching email
-- (set JWT sub + email)
SELECT accept_invitation('cccccccc-dddd-eeee-ffff-000000000001'::UUID);
```
Expected:
```json
{"success": true, "org_id": "<org-id>", "role": "accountant"}
```

**Test B — Already accepted:**
```sql
SELECT accept_invitation('cccccccc-dddd-eeee-ffff-000000000001'::UUID);
```
Expected:
```json
{"success": false, "error": "This invitation has already been accepted"}
```

**Test C — Expired invitation:**
```sql
INSERT INTO organization_invitations (org_id, email, role, token, status, invited_by, expires_at)
VALUES (
  '<test-org-id>'::UUID,
  'expired@example.com',
  'staff',
  'cccccccc-dddd-eeee-ffff-000000000002'::UUID,
  'pending',
  '<inviter-user-id>'::UUID,
  now() - INTERVAL '1 day'  -- already expired
);

SELECT accept_invitation('cccccccc-dddd-eeee-ffff-000000000002'::UUID);
```
Expected:
```json
{"success": false, "error": "This invitation has expired"}
```
Post-condition: status updated to 'expired' in `organization_invitations`.

**Test D — Revoked invitation:**
```sql
INSERT INTO organization_invitations (org_id, email, role, token, status, invited_by)
VALUES (
  '<test-org-id>'::UUID,
  'revoked@example.com',
  'staff',
  'cccccccc-dddd-eeee-ffff-000000000003'::UUID,
  'revoked',
  '<inviter-user-id>'::UUID
);

SELECT accept_invitation('cccccccc-dddd-eeee-ffff-000000000003'::UUID);
```
Expected:
```json
{"success": false, "error": "This invitation has been revoked"}
```

**Test E — Not found:**
```sql
SELECT accept_invitation('00000000-0000-0000-0000-000000000099'::UUID);
```
Expected:
```json
{"success": false, "error": "Invitation not found"}
```

**Test F — Unauthenticated (requires_auth flow):**
```sql
SET LOCAL ROLE anon;
SELECT accept_invitation('cccccccc-dddd-eeee-ffff-000000000004'::UUID);
-- Expected: {"success": false, "requires_auth": true, "email": "...", "org_name": "..."}
RESET ROLE;
```

**Anonymous grant verification:**
```sql
SET LOCAL ROLE anon;
-- Should NOT be "permission denied for function":
SELECT accept_invitation('00000000-0000-0000-0000-000000000099'::UUID);
-- Expected: {"success": false, "error": "Invitation not found"}
RESET ROLE;
```

---

### 2.4 `soft_delete_computation(p_computation_id UUID)`

**Purpose:** Sets `deleted_at` instead of hard delete. Owner or admin can delete.

**Test A — Owner deletes own computation:**
```sql
-- Assume computation was created by test-user
SELECT soft_delete_computation('<computation-id>'::UUID);
```
Expected:
```json
{"success": true}
```
Post-condition:
```sql
SELECT deleted_at FROM computations WHERE id = '<computation-id>';
-- Expected: non-NULL timestamp
```

**Test B — Not found (or already deleted):**
```sql
SELECT soft_delete_computation('<computation-id>'::UUID);
```
Expected:
```json
{"success": false, "error": "Computation not found"}
```

**Test C — Permission denied (non-owner, non-admin):**
```sql
-- Switch to a different user who is staff (not admin, not owner)
SELECT soft_delete_computation('<other-users-computation-id>'::UUID);
```
Expected:
```json
{"success": false, "error": "Permission denied"}
```

---

### 2.5 `get_upcoming_deadlines(p_days_ahead INTEGER DEFAULT 30)`

**Purpose:** Returns deadlines for the next N days for the user's org.

**Test A — Default 30 days:**
```sql
SELECT * FROM get_upcoming_deadlines();
```
Expected: Table result with columns `deadline_id, computation_id, title, client_name, milestone_key, label, due_date, completed_date, status`. Zero rows if no deadlines in range.

**Test B — Custom range:**
```sql
SELECT * FROM get_upcoming_deadlines(90);
```
Expected: Same columns, broader date range.

**Test C — Completed deadlines excluded:**
```sql
-- Ensure completed deadlines don't appear
UPDATE computation_deadlines SET completed_date = now() WHERE id = '<deadline-id>';
SELECT COUNT(*) FROM get_upcoming_deadlines(365) WHERE deadline_id = '<deadline-id>';
-- Expected: 0 (completed deadlines filtered out)
```

---

### 2.6 `generate_deadlines_for_computation(p_computation_id UUID, p_tax_year INTEGER)`

**Purpose:** Inserts standard BIR deadline rows for a computation.

**Test A — Generates 4 deadlines for tax year 2024:**
```sql
SELECT generate_deadlines_for_computation('<computation-id>'::UUID, 2024);
```
Expected: Returns `4` (count of inserted deadlines).

Verify deadlines:
```sql
SELECT milestone_key, label, due_date
FROM computation_deadlines
WHERE computation_id = '<computation-id>'
ORDER BY due_date;
```
Expected rows:
| milestone_key | due_date |
|---------------|----------|
| Q1_PAYMENT | 2024-04-15 |
| Q2_PAYMENT | 2024-08-15 |
| Q3_PAYMENT | 2024-11-15 |
| ANNUAL_ITR | 2025-04-15 |

**Test B — Idempotent (re-run doesn't duplicate):**
```sql
SELECT generate_deadlines_for_computation('<computation-id>'::UUID, 2024);
-- Expected: Returns 4 but ON CONFLICT DO NOTHING means no duplicates
SELECT COUNT(*) FROM computation_deadlines WHERE computation_id = '<computation-id>';
-- Expected: 4 (not 8)
```

**NOTE:** The `ON CONFLICT DO NOTHING` in `generate_deadlines_for_computation` requires a UNIQUE constraint on `(computation_id, milestone_key)`. Add this to `001_initial_schema.sql`:
```sql
-- Add to computation_deadlines table definition:
UNIQUE (computation_id, milestone_key)
```
**FORWARD LOOP MUST INCLUDE THIS CONSTRAINT** in `001_initial_schema.sql` or `generate_deadlines_for_computation` will insert duplicates on re-run.

---

## Step 3: RLS Policy Verification

For each table, verify policies from authorized and unauthorized contexts.

### 3.1 Helper: `user_org_ids()`

```sql
-- As authenticated user who belongs to org A:
SELECT user_org_ids();
-- Expected: SET of UUIDs including org A's id

-- As anon:
SET LOCAL ROLE anon;
SELECT user_org_ids();
-- Expected: empty set (no rows), NOT permission denied
-- (SECURITY DEFINER means it executes as the function owner, returns empty for unauthenticated)
RESET ROLE;
```

### 3.2 `organizations` Table

```sql
-- Authorized (member of org):
SELECT id, name FROM organizations;
-- Expected: only orgs the user belongs to

-- Unauthorized (different user):
-- Expected: zero rows for orgs the user is not a member of
-- (RLS filters, not error)

-- Direct insert (should fail — use create_organization RPC instead):
INSERT INTO organizations (name, slug) VALUES ('Direct Insert', 'direct-insert');
-- With org_insert policy set to WITH CHECK (true), this succeeds at the DB level
-- but the RPC is the intended path. Document: direct insert is allowed by RLS
-- but create_organization() RPC is the correct path as it also adds the user as admin.
```

### 3.3 `computations` Table

```sql
-- Authorized user (member of org that owns computation):
SELECT id, title FROM computations;
-- Expected: only computations where org_id IN user_org_ids() AND deleted_at IS NULL

-- Soft-deleted computations (excluded by RLS):
SELECT id FROM computations WHERE deleted_at IS NOT NULL;
-- Expected: 0 rows (RLS filters deleted ones out, even for org members)

-- Insert (must provide own user_id):
INSERT INTO computations (org_id, user_id, title)
VALUES ('<user-org-id>'::UUID, auth.uid(), 'Test');
-- Expected: success (org_id in user's orgs, user_id = auth.uid())

-- Insert with different user_id (should fail):
INSERT INTO computations (org_id, user_id, title)
VALUES ('<user-org-id>'::UUID, '<other-user-id>'::UUID, 'Cheat Insert');
-- Expected: RLS violation (user_id = auth.uid() check fails)
```

### 3.4 `user_profiles` Table

```sql
-- Own profile:
SELECT * FROM user_profiles WHERE id = auth.uid();
-- Expected: 1 row

-- Other user's profile:
SELECT * FROM user_profiles WHERE id != auth.uid();
-- Expected: 0 rows (RLS: id = auth.uid() only)
```

### 3.5 `computation_notes` Table

```sql
-- Insert own note:
INSERT INTO computation_notes (computation_id, user_id, content)
VALUES ('<computation-id>'::UUID, auth.uid(), 'Test note');
-- Expected: success

-- Update any note (should fail):
UPDATE computation_notes SET content = 'Modified' WHERE id = '<note-id>';
-- Expected: 0 rows updated (notes_update policy: FOR UPDATE USING (false))

-- Delete own note:
DELETE FROM computation_notes WHERE id = '<note-id>' AND user_id = auth.uid();
-- Expected: 1 row deleted

-- Delete another user's note (should fail):
DELETE FROM computation_notes WHERE id = '<other-note-id>';
-- Expected: 0 rows deleted (RLS: user_id = auth.uid())
```

### 3.6 `organization_invitations` Table

```sql
-- Invite member (as admin):
INSERT INTO organization_invitations (org_id, email, role, invited_by)
VALUES ('<org-id>'::UUID, 'new@example.com', 'staff', auth.uid());
-- Expected: success (inserter is admin of org)

-- Invite member (as non-admin staff):
-- (switch to staff user)
INSERT INTO organization_invitations (org_id, email, role, invited_by)
VALUES ('<org-id>'::UUID, 'other@example.com', 'staff', auth.uid());
-- Expected: 0 rows / RLS violation (not admin)

-- Hard delete invitation (should fail):
DELETE FROM organization_invitations WHERE id = '<invite-id>';
-- Expected: 0 rows deleted (invitations_delete policy: FOR DELETE USING (false))
-- Use UPDATE status = 'revoked' instead
```

---

## Step 4: Parameter Type Match Table

CRITICAL: Every RPC parameter must match the column type it compares against. The inheritance app failed because `p_token TEXT` was compared to a `UUID` column.

| RPC Function | Parameter | Param Type | Column | Column Type | Status |
|---|---|---|---|---|---|
| `get_shared_computation` | `p_token` | `UUID` | `computations.share_token` | `UUID` | MATCH |
| `accept_invitation` | `p_token` | `UUID` | `organization_invitations.token` | `UUID` | MATCH |
| `soft_delete_computation` | `p_computation_id` | `UUID` | `computations.id` | `UUID` | MATCH |
| `generate_deadlines_for_computation` | `p_computation_id` | `UUID` | `computation_deadlines.computation_id` | `UUID` | MATCH |
| `generate_deadlines_for_computation` | `p_tax_year` | `INTEGER` | `computations.tax_year` | `INTEGER` | MATCH |
| `get_upcoming_deadlines` | `p_days_ahead` | `INTEGER` | arithmetic only | N/A | MATCH |
| `create_organization` | `p_name` | `TEXT` | `organizations.name` | `TEXT` | MATCH |
| `create_organization` | `p_slug` | `TEXT` | `organizations.slug` | `TEXT` | MATCH |

**Rule:** If a parameter compares against a `UUID` column with `=`, the parameter MUST be declared as `UUID`, not `TEXT`. PostgreSQL does not implicitly cast `TEXT` to `UUID` in `=` comparisons (it throws `operator does not exist: uuid = text`).

---

## Step 5: Storage Bucket Verification

```sql
-- Verify bucket created:
SELECT id, name, public FROM storage.buckets WHERE id = 'firm-logos';
-- Expected: 1 row, public = false

-- Verify storage policies exist:
SELECT name, definition FROM storage.policies WHERE bucket_id = 'firm-logos';
-- Expected: 4 rows (firm-logos-select, firm-logos-insert, firm-logos-update, firm-logos-delete)
```

---

## Step 6: Migration File Run Order Verification

Supabase runs migrations in filename sort order. Verify:

```
001_initial_schema.sql  (must run first — creates tables referenced by later files)
002_rls_policies.sql    (depends on tables from 001)
003_rpc_functions.sql   (depends on tables from 001, user_org_ids() from 002)
004_storage.sql         (independent — creates storage bucket)
```

**Critical dependency:** `003_rpc_functions.sql` calls `user_org_ids()` inside `get_upcoming_deadlines`. If `002_rls_policies.sql` has not run yet, the function `user_org_ids()` doesn't exist and `003` will fail. File naming as `001`, `002`, `003`, `004` ensures correct order.

---

## Step 7: UNIQUE Constraint Gap (Forward Loop Must Fix)

The `ON CONFLICT DO NOTHING` in `generate_deadlines_for_computation` requires a UNIQUE constraint on `computation_deadlines(computation_id, milestone_key)`. The current `001_initial_schema.sql` does NOT include this constraint.

**Forward loop must add to `001_initial_schema.sql`:**
```sql
CREATE TABLE IF NOT EXISTS computation_deadlines (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  computation_id UUID NOT NULL REFERENCES computations(id) ON DELETE CASCADE,
  milestone_key  TEXT NOT NULL,
  label          TEXT NOT NULL,
  due_date       DATE NOT NULL,
  completed_date DATE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (computation_id, milestone_key)  -- Required for ON CONFLICT DO NOTHING in generate_deadlines_for_computation
);
```

Without this, calling `generate_deadlines_for_computation` twice for the same computation inserts duplicate deadline rows.

---

## Step 8: Complete Forward Loop Verification Procedure

The forward loop's Phase 5 (Platform) verification block must run these steps in order:

```bash
# 1. Reset database (runs all migrations, verifies idempotency)
supabase db reset

# 2. Verify tables exist
psql $SUPABASE_DB_URL -c "\dt public.*"
# Expected: 8 tables: organizations, organization_members, organization_invitations,
#           user_profiles, clients, computations, computation_notes, computation_deadlines

# 3. Verify enums exist
psql $SUPABASE_DB_URL -c "SELECT typname FROM pg_type WHERE typtype = 'e';"
# Expected: org_plan, org_role, invitation_status, computation_status, client_status

# 4. Verify RPC functions exist
psql $SUPABASE_DB_URL -c "\df public.*"
# Expected: get_shared_computation, create_organization, accept_invitation,
#           soft_delete_computation, get_upcoming_deadlines,
#           generate_deadlines_for_computation, user_org_ids, update_updated_at,
#           increment_notes_count

# 5. Verify GRANTS for anonymous functions
psql $SUPABASE_DB_URL -c "SELECT routine_name, grantee, privilege_type
  FROM information_schema.routine_privileges
  WHERE routine_schema = 'public'
    AND grantee = 'anon';"
# Expected: get_shared_computation, accept_invitation (both granted to anon)

# 6. Verify storage bucket
psql $SUPABASE_DB_URL -c "SELECT id, public FROM storage.buckets WHERE id = 'firm-logos';"
# Expected: 1 row, public = false

# 7. Test public RPC as anon (most critical check)
psql $SUPABASE_DB_URL -c "
  SET LOCAL ROLE anon;
  SELECT COUNT(*) FROM get_shared_computation('00000000-0000-0000-0000-000000000000'::UUID);
  RESET ROLE;
"
# Expected: count = 0 (NOT permission denied)

# 8. Verify unique constraint on computation_deadlines
psql $SUPABASE_DB_URL -c "
  SELECT conname FROM pg_constraint
  WHERE conrelid = 'computation_deadlines'::regclass
    AND contype = 'u';
"
# Expected: 1 row (the unique constraint on computation_id, milestone_key)
```

---

## Known Gotchas (Inheritance Failures Prevented)

| Failure Mode | Prevention |
|---|---|
| `p_token TEXT` vs `UUID` column | All token params declared as `UUID` — verified in Step 4 table |
| Missing `GRANT TO anon` for public RPCs | `get_shared_computation` and `accept_invitation` both have `GRANT ... TO anon, authenticated` — verified in Step 8 |
| `ON CONFLICT DO NOTHING` without UNIQUE constraint | Step 7 requires adding `UNIQUE(computation_id, milestone_key)` to schema |
| Migration run-order dependency | Files named `001`, `002`, `003`, `004` — `user_org_ids()` exists before `get_upcoming_deadlines` uses it |
| `supabase db reset` never run by forward loop | Step 8 makes it mandatory in Phase 5 verification |
