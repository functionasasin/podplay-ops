# Analysis: Migration Verification — Supabase DB Reset + RPC Test Plan

**Wave:** 6 — Testing + Deployment
**Aspect:** migration-verification
**Date:** 2026-03-06
**Sources:** database-migrations.md, sharing.md, org-model.md, computation-management.md

---

## Overview

Migration verification ensures that all SQL migrations apply cleanly from scratch via
`supabase db reset`, that RPC functions return expected results with real test data, that
parameter types match what the frontend sends, and that RLS policies enforce the correct
access boundaries.

This aspect directly addresses **Inheritance App Failure 2** (RPC TEXT vs UUID type mismatch)
and **Inheritance App Failure 3** (missing anon GRANT on sharing RPC).

---

## 1. Migration Reset Test Plan

### 1a. Reset Command

```bash
# From the project root (where supabase/config.toml lives)
supabase db reset
```

This command:
1. Drops the local Supabase database
2. Re-applies all migration files in `supabase/migrations/` in chronological filename order
3. Runs `supabase/seed.sql` if it exists
4. Reports any migration errors

**Expected output (clean reset):**
```
Resetting local database...
Applying migration 20240101000000_create_organizations.sql...
Applying migration 20240101000001_create_organization_members.sql...
Applying migration 20240101000002_create_organization_invitations.sql...
Applying migration 20240101000003_create_computations.sql...
Applying migration 20240101000004_create_batch_computations.sql...
Applying migration 20240101000005_create_shared_links.sql...
Applying migration 20240101000006_create_updated_at_trigger.sql...
Applying migration 20240101000007_create_rpc_create_organization.sql...
Applying migration 20240101000008_create_rpc_get_shared_computation.sql...
Finished supabase db reset.
```

**Failure modes to watch:**
- `ERROR: function handle_updated_at() does not exist` — trigger function referenced before it is
  created. Fix: move `20240101000006` to before the first table that uses the trigger, or inline
  the trigger function creation in each table migration.
- `ERROR: relation "organizations" does not exist` — `organization_members` references `organizations`
  but was applied before it. Migration filenames are applied in alphabetical/timestamp order — ensure
  timestamps reflect dependency order.
- `ERROR: policy "..." already exists` — non-idempotent policy creation. Fix: use
  `CREATE POLICY IF NOT EXISTS` (requires PostgreSQL 15+, which Supabase uses).

### 1b. Migration Dependency Order Verification

The migrations must be applied in this exact dependency order:

| File | Depends On |
|------|-----------|
| `20240101000000_create_organizations.sql` | None |
| `20240101000001_create_organization_members.sql` | organizations |
| `20240101000002_create_organization_invitations.sql` | organizations, auth.users |
| `20240101000003_create_computations.sql` | organizations, auth.users |
| `20240101000004_create_batch_computations.sql` | organizations, auth.users |
| `20240101000005_create_shared_links.sql` | computations, auth.users |
| `20240101000006_create_updated_at_trigger.sql` | None (must exist before tables use it) |
| `20240101000007_create_rpc_create_organization.sql` | organizations, organization_members |
| `20240101000008_create_rpc_get_shared_computation.sql` | shared_links, computations |

**Critical issue:** `handle_updated_at()` function is defined in file `000006`, but the tables in
files `000000`, `000003`, `000004` reference it via triggers. The trigger creation SQL uses
`EXECUTE FUNCTION public.handle_updated_at()` which will fail if the function doesn't exist yet.

**Fix:** Move the trigger function creation to file `20240101000000_create_updated_at_trigger.sql`
(timestamp before all tables), then rename all other files to start from `20240101000001`. Or
inline the `CREATE OR REPLACE FUNCTION handle_updated_at()` at the top of the first table migration
that uses it, and use `CREATE OR REPLACE` so subsequent migrations are idempotent.

**Correct migration file order:**

```
20240101000000_create_updated_at_trigger.sql    -- function first
20240101000001_create_organizations.sql
20240101000002_create_organization_members.sql
20240101000003_create_organization_invitations.sql
20240101000004_create_computations.sql
20240101000005_create_batch_computations.sql
20240101000006_create_shared_links.sql
20240101000007_create_rpc_create_organization.sql
20240101000008_create_rpc_get_shared_computation.sql
```

### 1c. Idempotency Check

After a clean reset succeeds, run `supabase db reset` a second time to verify idempotency.
All `IF NOT EXISTS` and `CREATE OR REPLACE` patterns must prevent errors on re-run.

**Required idempotent patterns (verified by second reset):**

| SQL Object | Idempotent Pattern |
|------------|-------------------|
| Tables | `CREATE TABLE IF NOT EXISTS` |
| Indexes | `CREATE INDEX IF NOT EXISTS` |
| Triggers | `DROP TRIGGER IF EXISTS ...; CREATE TRIGGER` |
| Functions | `CREATE OR REPLACE FUNCTION` |
| Policies | `CREATE POLICY IF NOT EXISTS` (PostgreSQL 15+) |
| GRANTs | Always idempotent |
| `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` | Always idempotent |

---

## 2. Schema Verification Queries

Run these queries in the Supabase SQL editor (or via `psql`) after migration:

### 2a. Verify All Tables Exist

```sql
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'organizations',
    'organization_members',
    'organization_invitations',
    'computations',
    'batch_computations',
    'shared_links'
  )
ORDER BY tablename;
-- Expected: 6 rows, all 6 table names present
```

### 2b. Verify RLS Enabled on All Tables

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'organizations', 'organization_members', 'organization_invitations',
    'computations', 'batch_computations', 'shared_links'
  )
ORDER BY tablename;
-- Expected: rowsecurity = true for all 6 rows
```

### 2c. Verify Column Types on Critical Columns

```sql
-- shared_links.token must be UUID (not TEXT)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'shared_links'
  AND column_name IN ('id', 'token', 'computation_id', 'user_id');
-- Expected:
--   id             | uuid | NO
--   token          | uuid | NO   <-- MUST be uuid, not character varying
--   computation_id | uuid | NO
--   user_id        | uuid | NO

-- organization_invitations.token must be UUID
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'organization_invitations'
  AND column_name = 'token';
-- Expected: data_type = 'uuid'
```

### 2d. Verify RPC Parameter Types

```sql
-- get_shared_computation must accept UUID, not TEXT
SELECT
  p.proname AS function_name,
  pg_catalog.pg_get_function_arguments(p.oid) AS arguments,
  pg_catalog.pg_get_function_result(p.oid) AS return_type
FROM pg_catalog.pg_proc p
LEFT JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('get_shared_computation', 'create_organization');
-- Expected:
--   get_shared_computation | p_token uuid | jsonb
--   create_organization    | p_name text, p_slug text, p_industry text | uuid
```

### 2e. Verify RPC Grants

```sql
-- anon must be able to call get_shared_computation (sharing feature)
SELECT has_function_privilege('anon', 'public.get_shared_computation(uuid)', 'execute');
-- Expected: true

-- authenticated must be able to call create_organization
SELECT has_function_privilege('authenticated', 'public.create_organization(text,text,text)', 'execute');
-- Expected: true

-- anon must NOT be able to call create_organization (authenticated only)
SELECT has_function_privilege('anon', 'public.create_organization(text,text,text)', 'execute');
-- Expected: false
```

### 2f. Verify Triggers Exist

```sql
SELECT trigger_name, event_object_table, action_timing, event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE '%_updated_at'
ORDER BY event_object_table;
-- Expected rows:
--   organizations_updated_at  | organizations  | BEFORE | UPDATE
--   computations_updated_at   | computations   | BEFORE | UPDATE
--   batch_computations_updated_at | batch_computations | BEFORE | UPDATE
```

### 2g. Verify Unique Constraints

```sql
-- shared_links: one share link per computation
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'shared_links'
  AND indexdef LIKE '%computation_id%unique%'
   OR indexdef LIKE '%UNIQUE%computation_id%';
-- Expected: at least one unique index on computation_id

-- organization_members: one member per org
SELECT indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'organization_members'
  AND indexdef LIKE '%organization_id%user_id%';
-- Expected: unique constraint index exists
```

---

## 3. RPC Functional Tests with Real Data

These tests use the Supabase SQL editor as a superuser (service_role) to insert seed data,
then verify RPC behavior as different roles.

### 3a. Test Setup — Insert Seed Data

```sql
-- Insert a test user (simulate auth.users — in local dev, create via Supabase dashboard
-- or supabase/seed.sql using the auth schema directly)
-- For testing, we use the service_role client which bypasses RLS

-- Test user IDs (fixed UUIDs for reproducible tests)
-- User A (owner): 'aaaaaaaa-0000-0000-0000-000000000001'
-- User B (member): 'bbbbbbbb-0000-0000-0000-000000000002'

-- These must exist in auth.users before RPC tests. In local Supabase:
-- Sign up via the auth API or use supabase/seed.sql with raw inserts into auth.users.
```

### 3b. Test: `create_organization` RPC

```sql
-- Simulate calling as authenticated user A
-- Use SET LOCAL ROLE authenticated; SET LOCAL "request.jwt.claims" = '{"sub":"aaaaaaaa-..."}';
-- in local testing, or test via the TypeScript Supabase client with a real session.

-- Via TypeScript (preferred — tests the actual stack):
// In a Vitest test (integration test, not unit test):
const { data: orgId, error } = await supabase.rpc('create_organization', {
  p_name: 'Test HR Corp',
  p_slug: 'test-hr-corp',
  p_industry: 'manufacturing',
})
// Assert: error is null
// Assert: orgId is a valid UUID string
// Assert: organization exists in organizations table
// Assert: user is added as 'owner' in organization_members
```

**Expected behavior:**
- Returns a UUID string (the new org id)
- Inserts row in `organizations`
- Inserts row in `organization_members` with `role = 'owner'` and `user_id = auth.uid()`
- Raises exception for invalid industry values
- Raises exception for slug violating regex

**Failure test:**
```typescript
const { data, error } = await supabase.rpc('create_organization', {
  p_name: 'X', // too short (< 2 chars)
  p_slug: 'x',
  p_industry: 'manufacturing',
})
// Assert: error is not null, error.message contains 'must be 2–80 characters'
```

### 3c. Test: `get_shared_computation` RPC — Happy Path

**Setup:** Insert test data via service_role client:
1. Create a user, computation (with `status = 'shared'`, `output` not null), and shared_link
2. Record the `token` UUID from shared_links

**Test (as anon role):**
```typescript
// Create an anon Supabase client (no auth headers)
const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const testToken = '550e8400-e29b-41d4-a716-446655440000' // from seed
const { data, error } = await anonClient.rpc('get_shared_computation', {
  p_token: testToken,
})
// Assert: error is null
// Assert: data is not null
// Assert: data.id is a valid UUID string
// Assert: data.status === 'shared'
// Assert: data.output is not null and contains retirementPay field
// Assert: data.input is not null and contains employeeName field
// Assert: data.title is a string
// Assert: data.createdAt is an ISO 8601 string
```

### 3d. Test: `get_shared_computation` — Wrong Token Type Would Cause Silent Failure

This test documents the failure mode that would occur if the parameter were `TEXT` instead of `UUID`.

**Why UUID matters:**
- Supabase PostgREST converts the JavaScript string `"550e8400-e29b-41d4-a716-446655440000"` to the
  PostgreSQL `uuid` type when the function parameter is declared as `UUID`
- If the parameter were declared as `TEXT`, PostgREST would still pass the string but the
  `WHERE sl.token = p_token` comparison would silently fail type coercion in some PostgreSQL
  versions, returning NULL instead of the matching row
- The declaration `p_token UUID` forces PostgREST to validate the UUID format at the boundary
  and perform correct type matching in the WHERE clause

**Verification:** The schema verification query in section 2d confirms `p_token` is `uuid` type.

### 3e. Test: `get_shared_computation` — Revoked/Non-Existent Token

```typescript
const { data, error } = await anonClient.rpc('get_shared_computation', {
  p_token: 'ffffffff-ffff-ffff-ffff-ffffffffffff', // non-existent token
})
// Assert: error is null (RPC does not throw for not-found)
// Assert: data is null (RPC returns NULL JSONB for not-found)
// Frontend check: if (!data) -> show InvalidShareLinkView
```

### 3f. Test: `get_shared_computation` — Computation Not 'shared' Status

```sql
-- Setup: create a computation with status = 'computed' (not 'shared')
-- Create a shared_link row pointing to it (abnormal state — shouldn't happen in practice,
-- but test the guard in the RPC WHERE clause)
```

```typescript
const { data, error } = await anonClient.rpc('get_shared_computation', {
  p_token: tokenForNonSharedComputation,
})
// Assert: data is null (status != 'shared' guard in WHERE clause)
```

---

## 4. RLS Policy Verification Tests

These tests verify that RLS correctly restricts access between different users.

### 4a. User Isolation for Computations

```typescript
// User A creates a computation
const { data: comp } = await userAClient
  .from('computations')
  .insert({ user_id: userAId, title: 'Test', input: {...}, status: 'draft' })
  .select()
  .single()

// User B (different authenticated user) tries to read User A's computation
const { data: rows } = await userBClient
  .from('computations')
  .select('*')
  .eq('id', comp.id)
// Assert: rows is empty array (RLS blocks cross-user access)
// Assert: no error (RLS returns empty set, not an error)
```

### 4b. Org Members Can Read Org Computations

```typescript
// User A creates org, invites User B as member
// User A creates computation linked to the org (organization_id = orgId)
// User B (org member) reads org computations
const { data: rows } = await userBClient
  .from('computations')
  .select('*')
  .eq('organization_id', orgId)
// Assert: rows includes User A's computation (org member policy applies)
```

### 4c. Anon Cannot Access computations Table Directly

```typescript
const { data, error } = await anonClient
  .from('computations')
  .select('*')
// Assert: data is empty array (RLS blocks anon from computations table)
// Anon accesses shared computations ONLY via get_shared_computation() RPC
```

### 4d. Org Owner Role Enforcement

```typescript
// User B (member, not owner/admin) cannot insert into organizations directly
const { error } = await userBClient
  .from('organizations')
  .insert({ name: 'Hijacked Org', slug: 'hijacked', industry: 'other' })
// Assert: error is not null (INSERT on organizations is blocked by RLS — must use RPC)
```

---

## 5. TypeScript Integration Test File

All RPC and RLS tests above should be implemented as integration tests in:

```
apps/retirement-pay/frontend/src/lib/__tests__/supabase-integration.test.ts
```

**Test setup pattern:**
```typescript
// src/lib/__tests__/supabase-integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../database.types'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? 'http://localhost:54321'
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? '<local-anon-key>'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '<local-service-key>'

// Service client bypasses RLS — used to seed data
const serviceClient = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Anon client — simulates unauthenticated browser
const anonClient = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY)

describe('Migration Verification', () => {
  it('get_shared_computation returns null for non-existent token', async () => {
    const { data, error } = await anonClient.rpc('get_shared_computation', {
      p_token: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
    })
    expect(error).toBeNull()
    expect(data).toBeNull()
  })

  it('anon cannot read computations table directly', async () => {
    const { data, error } = await anonClient.from('computations').select('*')
    expect(error).toBeNull()    // No error — RLS returns empty set silently
    expect(data).toEqual([])    // Empty — not null, not an error
  })

  it('get_shared_computation RPC accepts UUID token type', async () => {
    // Seed: insert org + user + computation + shared_link
    // This test verifies the UUID type matching works end-to-end
    // ... seed setup ...
    const { data, error } = await anonClient.rpc('get_shared_computation', {
      p_token: seededToken, // UUID string
    })
    expect(error).toBeNull()
    expect(data).not.toBeNull()
    expect(data.status).toBe('shared')
    expect(data.output).not.toBeNull()
  })
})
```

**Environment variables for integration tests:**
```bash
# .env.test.local (not committed)
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<from supabase start output>
SUPABASE_SERVICE_ROLE_KEY=<from supabase start output>
```

**Run integration tests:**
```bash
supabase start          # ensure local DB is running
supabase db reset       # fresh state
vitest run --reporter=verbose src/lib/__tests__/supabase-integration.test.ts
```

---

## 6. TypeScript Type Generation Verification

After migrations apply cleanly, regenerate TypeScript types and verify they compile:

```bash
supabase gen types typescript --local > apps/retirement-pay/frontend/src/lib/database.types.ts
cd apps/retirement-pay/frontend
npx tsc --noEmit
```

**Expected:** Zero TypeScript errors. If the generated types don't match the mapper functions
in `src/lib/mappers.ts`, TypeScript will catch the mismatch at compile time.

**Critical columns that must appear in generated types:**

| Table | Column | Generated TS Type |
|-------|--------|-------------------|
| `shared_links` | `token` | `string` (PostgreSQL UUID → TS string) |
| `computations` | `input` | `Json` (PostgreSQL JSONB → TS Json) |
| `computations` | `output` | `Json \| null` |
| `computations` | `status` | `string` |
| `batch_computations` | `row_count` | `number` |
| `batch_computations` | `error_count` | `number` |
| `organizations` | `industry` | `string` |

---

## 7. Migration Checklist (Run Before Every Deployment)

```
[ ] supabase db reset completes with zero errors
[ ] supabase db reset run a second time — still zero errors (idempotency)
[ ] Schema query confirms all 6 tables exist
[ ] RLS enabled on all 6 tables (rowsecurity = true for each)
[ ] shared_links.token data_type = 'uuid' (not 'character varying')
[ ] get_shared_computation parameter is p_token uuid (not text)
[ ] has_function_privilege('anon', 'get_shared_computation(uuid)', 'execute') = true
[ ] has_function_privilege('authenticated', 'create_organization(text,text,text)', 'execute') = true
[ ] has_function_privilege('anon', 'create_organization(text,text,text)', 'execute') = false
[ ] Triggers exist for organizations, computations, batch_computations (updated_at)
[ ] supabase gen types typescript --local > database.types.ts — zero TS errors
[ ] Integration tests pass: RPC happy path, null for bad token, anon isolation
```

---

## 8. Common Migration Errors and Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `function handle_updated_at() does not exist` | Trigger function referenced before definition | Move trigger function to first migration file (timestamp `000000`) |
| `relation "organizations" does not exist` | organization_members created before organizations | Ensure timestamps enforce dependency order |
| `policy "..." already exists` | Non-idempotent policy creation | Use `CREATE POLICY IF NOT EXISTS` |
| `permission denied for function get_shared_computation` | Missing anon GRANT | Add `GRANT EXECUTE ON FUNCTION public.get_shared_computation(UUID) TO anon` |
| RPC returns null for valid token | Parameter type mismatch (TEXT vs UUID) | Verify function signature shows `p_token uuid` not `p_token text` |
| `anon` can read computations table | Missing or broken RLS | Verify `rowsecurity = true` and policies are created with correct USING clauses |

---

## Summary

Migration verification is a pre-deployment gate that catches type mismatches, missing grants,
and non-idempotent SQL before they reach production. The two critical checks are:

1. **UUID type integrity**: `shared_links.token` is `UUID`, `get_shared_computation(p_token UUID)`
   — verified via schema query and function signature inspection
2. **Anon GRANT**: `get_shared_computation` must be executable by the `anon` role — verified via
   `has_function_privilege('anon', ...)` query

Both checks prevent the exact failures that occurred in the inheritance app forward loop.
