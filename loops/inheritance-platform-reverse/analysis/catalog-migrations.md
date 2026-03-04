# catalog-migrations — Migration Inventory

**Wave**: 1
**Date**: 2026-03-04
**Source**: `loops/inheritance-frontend-forward/app/supabase/migrations/`

---

## Files Present

| File | Description | Status |
|------|-------------|--------|
| `001_initial_schema.sql` | Mega-migration: all tables, enums, triggers, partial RLS | EXISTS |
| `002_*.sql` | Missing — gap in sequence | MISSING |
| `003_*.sql` | Missing — gap in sequence | MISSING |
| `004_shared_case_rpc.sql` | `get_shared_case` SECURITY DEFINER RPC | EXISTS |
| `005_case_deadlines.sql` | `get_case_deadline_summaries` RPC (user_id scoped — stale) | EXISTS |
| `006_case_documents.sql` | No-op — `case_documents` already in 001 | EXISTS (no-op) |
| `007_conflict_check.sql` | `run_conflict_check` RPC (user_id scoped — stale) | EXISTS |
| `008_*.sql` | Missing — gap in sequence | MISSING |
| `009_cases_intake_data.sql` | Adds `intake_data JSONB` column to `cases` | EXISTS |
| `010_rls_org_scope.sql` | RLS org-scoping, `accept_invitation` RPC, re-creates stale RPCs | EXISTS |

---

## Tables Created (all in 001)

| Table | Primary Key | RLS in 001 | RLS fixed in 010 |
|-------|-------------|------------|-------------------|
| `organizations` | UUID | **NO** — unprotected until 010 | YES — select/update policies |
| `organization_members` | UUID | **NO** — unprotected until 010 | YES — full CRUD policies |
| `organization_invitations` | UUID | **NO** — unprotected until 010 | YES — full CRUD policies |
| `user_profiles` | UUID (FK auth.users) | YES — own-row policy | no change needed |
| `clients` | UUID | YES — org_member policy | no change needed |
| `cases` | UUID | YES — org_member policy (already org-scoped) | no change needed |
| `case_notes` | UUID | YES — org-scoped via cases subquery | no change needed |
| `case_deadlines` | UUID | YES — user_id scoped (WRONG) | YES — replaced with org-scoped |
| `case_documents` | UUID | YES — user_id scoped (WRONG) | YES — replaced with org-scoped |
| `conflict_check_log` | UUID | YES — user_id scoped (WRONG) | YES — replaced with org-scoped + org_id column added |

## Enum Types (all in 001)

```sql
case_status: 'draft' | 'computed' | 'finalized' | 'archived'
client_status: 'active' | 'former'
org_role: 'admin' | 'attorney' | 'paralegal' | 'readonly'
invitation_status: 'pending' | 'accepted' | 'expired' | 'revoked'
conflict_outcome: 'clear' | 'flagged' | 'cleared_after_review' | 'skipped'
gov_id_type: 11 values (philsys_id, passport, drivers_license, etc.)
```

**Issue**: All use `CREATE TYPE` without `IF NOT EXISTS`. Re-running migrations will fail with "type already exists".

---

## Functions / RPCs

| Function | File | Scoping | Status |
|----------|------|---------|--------|
| `update_updated_at()` | 001 | Trigger utility | CORRECT |
| `fn_sync_notes_count()` | 001 | Trigger utility | CORRECT |
| `get_shared_case(token TEXT)` | 004 | SECURITY DEFINER, no auth required | CORRECT |
| `get_case_deadline_summaries(UUID[])` | 005 | user_id scoped — STALE | SUPERSEDED by 010 |
| `run_conflict_check(TEXT, TEXT)` | 007 | user_id scoped — STALE | SUPERSEDED by 010 |
| `user_org_ids()` | 010 | Helper, SECURITY DEFINER | CORRECT |
| `get_case_deadline_summaries(UUID[])` | 010 | org-scoped — CURRENT | CORRECT |
| `run_conflict_check(TEXT, TEXT)` | 010 | org-scoped — CURRENT | CORRECT |
| `accept_invitation(UUID)` | 010 | SECURITY DEFINER, auth required | CORRECT |

---

## Critical Issues

### CRITICAL-1: No `create_organization` Function
**Severity**: CRITICAL — blocks all new users
**Detail**: There is no RPC or database trigger to create an organization when a user first signs up. All RLS policies (cases, clients, deadlines, documents, conflict log) require `org_id IN (SELECT user_org_ids())`. A new user has no `organization_members` row → `user_org_ids()` returns empty → every read/write fails silently or returns empty.
**Frontend gap**: `catalog-lib-hooks` confirmed "no createOrganization anywhere" in the codebase.
**Fix required**: Migration `011_create_org_rpc.sql`:
```sql
CREATE OR REPLACE FUNCTION create_organization(p_name TEXT, p_slug TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_org_id UUID;
BEGIN
  INSERT INTO organizations (name, slug, plan, seat_limit)
  VALUES (p_name, p_slug, 'solo', 1)
  RETURNING id INTO v_org_id;

  INSERT INTO organization_members (org_id, user_id, role)
  VALUES (v_org_id, v_uid, 'admin');

  RETURN jsonb_build_object('success', true, 'org_id', v_org_id);
END; $$;

GRANT EXECUTE ON FUNCTION create_organization(TEXT, TEXT) TO authenticated;
```

### CRITICAL-2: No `user_profiles` Auto-Creation
**Severity**: CRITICAL — profile queries return null for new users
**Detail**: `001` creates `user_profiles` with RLS but no trigger on `auth.users` INSERT to auto-create the row. The `useAuth` hook calls `supabase.from('user_profiles').select(...)` — if no row exists, it returns null, causing null-dereference errors in settings page.
**Fix required**: Migration `011_create_org_rpc.sql` (same file):
```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO user_profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### CRITICAL-3: organizations / organization_members / organization_invitations Unprotected in 001
**Severity**: CRITICAL — security gap if 010 not applied
**Detail**: In `001_initial_schema.sql`, these three tables have no RLS enabled. Any authenticated user could read all organizations and all members. Only `010_rls_org_scope.sql` adds the required policies.
**Status**: Fixed IF both 001 and 010 are applied. A partial migration (001 only) leaves the system insecure.
**Fix**: Document that 001 + 010 must always be applied together. Add `ALTER TABLE organizations ENABLE ROW LEVEL SECURITY` to 001 for defense-in-depth.

---

## High Issues

### HIGH-1: Missing Migration Numbers 002, 003, 008
**Severity**: HIGH — confusing, may break sequential migration runners
**Detail**: Files 002, 003, and 008 do not exist. Any migration tool that expects sequential numbering will either error or silently skip ahead. This suggests migrations were written, then deleted, then renumbered — or were never written.
**Fix**: Document the gaps explicitly. Add a `_MIGRATION_NOTES.md` in the migrations directory explaining 002/003 were never written (initial schema was consolidated into 001) and 008 was skipped. OR rename files to fill the gaps.

### HIGH-2: Stale RPC Functions Created Then Superseded in Same Run
**Severity**: HIGH — every fresh migration applies wrong functions then overwrites them
**Detail**:
- `005` creates `get_case_deadline_summaries` with user_id scoping
- `010` overwrites it with org scoping
- `007` creates `run_conflict_check` with user_id scoping
- `010` overwrites it with org scoping

On a fresh project, the stale versions are created then immediately replaced — functionally correct but wasteful and confusing.
**Fix**: Remove the function bodies from 005 and 007, replacing with comments saying "function created in 010_rls_org_scope.sql". The RPC signatures are the same so existing frontend calls still work.

### HIGH-3: 006 is a No-Op Placeholder
**Severity**: MEDIUM — confusing migration history
**Detail**: `006_case_documents.sql` contains only a comment saying the table already exists in 001. This is the "duplicate migration" documented in the reverse frontier.
**Fix**: Either delete 006 (and renumber) or add a comment explaining the deduplication history.

### HIGH-4: Enum Types Not Idempotent
**Severity**: HIGH — re-running 001 fails
**Detail**: All 6 `CREATE TYPE` statements in 001 lack `IF NOT EXISTS`. Running `supabase db reset` or replaying migrations fails with `ERROR: type "case_status" already exists`.
**Fix**: Change all to:
```sql
DO $$ BEGIN
  CREATE TYPE case_status AS ENUM ('draft', 'computed', 'finalized', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
```
(PostgreSQL doesn't support `CREATE TYPE IF NOT EXISTS` before v16.)

---

## Medium Issues

### MEDIUM-1: `case_deadlines` RLS Policy in 001 Is User-Scoped (Wrong)
**Detail**: `001` creates `"deadlines_all_own"` policy using `auth.uid() = user_id`. This means a team member can't see another member's deadlines. `010` drops this policy and creates org-scoped policies. The 001 policy is wrong by design and requires 010 to fix.

### MEDIUM-2: No PDF Storage Table
**Detail**: Premium spec §4.13 specifies PDF generation and storage. No migration creates a `case_pdfs` or `generated_documents` table. If PDF generation is implemented, there's nowhere to store metadata.
**Fix**: Migration `012_pdf_storage.sql`:
```sql
CREATE TABLE case_pdfs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id     UUID        NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES auth.users(id),
  org_id      UUID        NOT NULL REFERENCES organizations(id),
  pdf_type    TEXT        NOT NULL CHECK (pdf_type IN ('distribution_summary', 'tax_computation', 'demand_letter')),
  storage_key TEXT        NOT NULL,
  file_size   INT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE case_pdfs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "case_pdfs_org" ON case_pdfs
  FOR ALL USING (org_id IN (SELECT user_org_ids()));
```

### MEDIUM-3: `get_shared_case` Missing `tax_output_json` and `comparison_output_json`
**Detail**: The `get_shared_case` RPC in 004 only returns `title, status, input_json, output_json, decedent_name, date_of_death`. The share route component (`ShareResultsPage`) may also need tax output for a full summary. This may cause incomplete rendering on the public share page.

---

## Fresh Project Setup Analysis

**Required order**:
```
001_initial_schema.sql       — All tables, triggers, partial RLS
004_shared_case_rpc.sql      — get_shared_case RPC
005_case_deadlines.sql       — get_case_deadline_summaries (overwritten by 010)
006_case_documents.sql       — no-op
007_conflict_check.sql       — run_conflict_check (overwritten by 010)
009_cases_intake_data.sql    — intake_data column
010_rls_org_scope.sql        — Full RLS + accept_invitation + RPCs
```

**Missing for usable app**:
- `create_organization` RPC (new users cannot proceed without it)
- `handle_new_user` trigger (user_profiles must exist for settings)

**Idempotent?** NO — enum types will error on re-run. Use `supabase db reset` (which drops then recreates) for local dev, but this is not safe in production.

---

## Summary

| Category | Count |
|----------|-------|
| Files present | 7 |
| Missing file numbers | 3 (002, 003, 008) |
| No-op migrations | 1 (006) |
| Superseded RPCs | 2 (005, 007) |
| Critical gaps | 2 (create_organization, user_profiles trigger) |
| High gaps | 4 |
| Medium gaps | 3 |
| Required new migrations | 2 (011 for org/profile, 012 for PDF storage) |
