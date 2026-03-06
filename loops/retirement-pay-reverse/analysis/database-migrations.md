# Analysis: Database Migrations — Supabase PostgreSQL

**Wave:** 5 — Frontend Data Model + UI Design
**Aspect:** database-migrations
**Date:** 2026-03-06
**Sources:** data-model.md, auth-flow.md, route-table.md, batch-computation-rules.md, company-plan-comparison-rules.md

---

## Overview

All migrations are idempotent (`IF NOT EXISTS`, `CREATE OR REPLACE`). They are applied via
`supabase/migrations/` files in chronological order. A single `supabase db reset` must replay
all migrations cleanly from scratch.

**Tables:**
1. `organizations` — HR departments / companies using the app
2. `organization_members` — user-to-org membership with roles
3. `organization_invitations` — pending email invitations to join an org
4. `computations` — single-employee retirement pay computations
5. `batch_computations` — batch CSV uploads with per-employee results
6. `shared_links` — token-based read-only sharing of computations

**RPCs (Postgres functions):**
- `create_organization(p_name TEXT, p_slug TEXT, p_industry TEXT) → UUID`
- `get_shared_computation(p_token UUID) → JSONB`

**Triggers:**
- `set_updated_at` — auto-update `updated_at` timestamp on every table that has it

**Migration files (in order):**
- `20240101000000_create_organizations.sql`
- `20240101000001_create_organization_members.sql`
- `20240101000002_create_organization_invitations.sql`
- `20240101000003_create_computations.sql`
- `20240101000004_create_batch_computations.sql`
- `20240101000005_create_shared_links.sql`
- `20240101000006_create_updated_at_trigger.sql`
- `20240101000007_create_rpc_create_organization.sql`
- `20240101000008_create_rpc_get_shared_computation.sql`

---

## 1. Updated-At Trigger (Applied First)

```sql
-- 20240101000006_create_updated_at_trigger.sql

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;
```

This function is referenced by all tables with `updated_at`. The trigger is created per-table
in each table's migration file.

---

## 2. Table: `organizations`

```sql
-- 20240101000000_create_organizations.sql

CREATE TABLE IF NOT EXISTS public.organizations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 80),
  slug        TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]{2,40}$'),
  industry    TEXT NOT NULL CHECK (industry IN (
                'manufacturing', 'retail', 'hospitality',
                'healthcare', 'finance', 'bpo', 'other'
              )),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS organizations_slug_idx ON public.organizations (slug);

DROP TRIGGER IF EXISTS organizations_updated_at ON public.organizations;
CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Members can read their org
CREATE POLICY IF NOT EXISTS "org_members_can_read_org"
  ON public.organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Only owners can update org name/industry/slug
CREATE POLICY IF NOT EXISTS "org_owners_can_update_org"
  ON public.organizations FOR UPDATE
  USING (
    id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Only owners can delete org
CREATE POLICY IF NOT EXISTS "org_owners_can_delete_org"
  ON public.organizations FOR DELETE
  USING (
    id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- INSERT handled by create_organization RPC only (SECURITY DEFINER bypasses RLS)
```

**Column notes:**
- `slug`: lowercase, hyphens only, 2–40 chars, unique. Auto-generated from `name` on the frontend; user can edit before submit.
- `industry`: enumerated via CHECK constraint (not a Postgres ENUM type — easier to migrate).

---

## 3. Table: `organization_members`

```sql
-- 20240101000001_create_organization_members.sql

CREATE TABLE IF NOT EXISTS public.organization_members (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role             TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  joined_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS org_members_org_idx  ON public.organization_members (organization_id);
CREATE INDEX IF NOT EXISTS org_members_user_idx ON public.organization_members (user_id);

-- RLS
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Members can read all members in their orgs
CREATE POLICY IF NOT EXISTS "org_members_can_read_members"
  ON public.organization_members FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Owners and admins can insert new members (invitations flow via RPC)
CREATE POLICY IF NOT EXISTS "org_admins_can_insert_members"
  ON public.organization_members FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Owners can update roles; admins can update members (not owners)
CREATE POLICY IF NOT EXISTS "org_owners_can_update_members"
  ON public.organization_members FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members AS om
      WHERE om.user_id = auth.uid() AND om.role = 'owner'
    )
  );

-- Owners and admins can remove members (not themselves if owner)
-- Self-removal allowed for non-owners
CREATE POLICY IF NOT EXISTS "org_members_can_leave"
  ON public.organization_members FOR DELETE
  USING (
    user_id = auth.uid()
    OR organization_id IN (
      SELECT organization_id FROM public.organization_members AS om
      WHERE om.user_id = auth.uid() AND om.role IN ('owner', 'admin')
    )
  );
```

**Column notes:**
- `role`: `'owner'` | `'admin'` | `'member'`. An org always has exactly one owner (enforced in `create_organization` RPC; transfer ownership is an application-level operation).
- `ON DELETE CASCADE`: removing an org removes all memberships; removing a user removes all their memberships.

---

## 4. Table: `organization_invitations`

```sql
-- 20240101000002_create_organization_invitations.sql

CREATE TABLE IF NOT EXISTS public.organization_invitations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  invited_by       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email            TEXT NOT NULL CHECK (email ~* '^[^@]+@[^@]+\.[^@]+$'),
  role             TEXT NOT NULL CHECK (role IN ('admin', 'member')) DEFAULT 'member',
  token            UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  expires_at       TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, email)
);

CREATE INDEX IF NOT EXISTS invitations_org_idx   ON public.organization_invitations (organization_id);
CREATE INDEX IF NOT EXISTS invitations_token_idx ON public.organization_invitations (token);
CREATE INDEX IF NOT EXISTS invitations_email_idx ON public.organization_invitations (email);

-- RLS
ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;

-- Org admins/owners can read invitations for their orgs
CREATE POLICY IF NOT EXISTS "org_admins_can_read_invitations"
  ON public.organization_invitations FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Org admins/owners can create invitations
CREATE POLICY IF NOT EXISTS "org_admins_can_insert_invitations"
  ON public.organization_invitations FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Org admins/owners can delete (cancel) invitations
CREATE POLICY IF NOT EXISTS "org_admins_can_delete_invitations"
  ON public.organization_invitations FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );
```

**Column notes:**
- `token`: UUID, unique, used in invitation acceptance link. Separate from `id` so token can be regenerated without changing the record.
- `expires_at`: defaults to 7 days from creation. Invitation acceptance checks `expires_at > NOW()`.
- `role` for invitations cannot be `'owner'` — ownership transfer is a separate flow.

---

## 5. Table: `computations`

```sql
-- 20240101000003_create_computations.sql

CREATE TABLE IF NOT EXISTS public.computations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id  UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  title            TEXT NOT NULL DEFAULT '' CHECK (char_length(title) <= 120),
  input            JSONB NOT NULL,
  output           JSONB,
  status           TEXT NOT NULL CHECK (status IN ('draft', 'computed', 'shared')) DEFAULT 'draft',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS computations_user_idx    ON public.computations (user_id);
CREATE INDEX IF NOT EXISTS computations_org_idx     ON public.computations (organization_id);
CREATE INDEX IF NOT EXISTS computations_status_idx  ON public.computations (status);
CREATE INDEX IF NOT EXISTS computations_created_idx ON public.computations (created_at DESC);

DROP TRIGGER IF EXISTS computations_updated_at ON public.computations;
CREATE TRIGGER computations_updated_at
  BEFORE UPDATE ON public.computations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.computations ENABLE ROW LEVEL SECURITY;

-- Users can CRUD their own computations
CREATE POLICY IF NOT EXISTS "users_own_computations_select"
  ON public.computations FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "users_own_computations_insert"
  ON public.computations FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "users_own_computations_update"
  ON public.computations FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "users_own_computations_delete"
  ON public.computations FOR DELETE
  USING (user_id = auth.uid());

-- Org members can read computations belonging to their orgs
CREATE POLICY IF NOT EXISTS "org_members_can_read_org_computations"
  ON public.computations FOR SELECT
  USING (
    organization_id IS NOT NULL
    AND organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );
```

**Column notes:**
- `input`: JSONB storing the full `RetirementInput` struct (camelCase, as serialized by the frontend before calling the WASM engine). The computation is always re-runnable from `input` alone.
- `output`: JSONB storing the full `RetirementOutput` struct. NULL for `status = 'draft'` (auto-saved before computation runs). Not NULL for `status IN ('computed', 'shared')`.
- `title`: User-editable label. If empty string, display `"${employeeName} — ${retirementDate}"` in the UI.
- `status` workflow: `draft` (created, input not yet submitted) → `computed` (WASM ran, output saved) → `shared` (shared_link created).
- `organization_id`: nullable. Personal computations have NULL. Computations created while in an org context are linked.

**Frontend TypeScript interface:**
```typescript
interface ComputationRecord {
  id: string                    // UUID
  userId: string                // UUID
  organizationId: string | null // UUID or null
  title: string
  input: RetirementInput        // parsed from JSONB
  output: RetirementOutput | null // parsed from JSONB, null for drafts
  status: 'draft' | 'computed' | 'shared'
  createdAt: string             // ISO 8601
  updatedAt: string             // ISO 8601
}
```

Supabase client column names are snake_case in the database but the TypeScript interface above
uses camelCase via the `Database` type generated by `supabase gen types typescript`. The generated
type reflects the actual DB column names; map via `.from('computations').select()` and transform
with a mapper function `toComputationRecord(row: Database['public']['Tables']['computations']['Row'])`.

---

## 6. Table: `batch_computations`

```sql
-- 20240101000004_create_batch_computations.sql

CREATE TABLE IF NOT EXISTS public.batch_computations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id  UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  title            TEXT NOT NULL DEFAULT '' CHECK (char_length(title) <= 120),
  input            JSONB NOT NULL,   -- BatchInput struct
  output           JSONB,            -- BatchOutput struct, null until processed
  row_count        INTEGER NOT NULL DEFAULT 0 CHECK (row_count >= 0),
  error_count      INTEGER NOT NULL DEFAULT 0 CHECK (error_count >= 0),
  status           TEXT NOT NULL CHECK (status IN ('processing', 'completed', 'failed')) DEFAULT 'processing',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS batch_computations_user_idx    ON public.batch_computations (user_id);
CREATE INDEX IF NOT EXISTS batch_computations_org_idx     ON public.batch_computations (organization_id);
CREATE INDEX IF NOT EXISTS batch_computations_created_idx ON public.batch_computations (created_at DESC);

DROP TRIGGER IF EXISTS batch_computations_updated_at ON public.batch_computations;
CREATE TRIGGER batch_computations_updated_at
  BEFORE UPDATE ON public.batch_computations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.batch_computations ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "users_own_batch_computations_select"
  ON public.batch_computations FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "users_own_batch_computations_insert"
  ON public.batch_computations FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "users_own_batch_computations_update"
  ON public.batch_computations FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "users_own_batch_computations_delete"
  ON public.batch_computations FOR DELETE
  USING (user_id = auth.uid());

-- Org members can read batch computations belonging to their orgs
CREATE POLICY IF NOT EXISTS "org_members_can_read_org_batch_computations"
  ON public.batch_computations FOR SELECT
  USING (
    organization_id IS NOT NULL
    AND organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );
```

**Column notes:**
- `input`: Full `BatchInput` JSONB. Contains the array of `RetirementInput` objects parsed from CSV.
- `output`: Full `BatchOutput` JSONB. Contains per-employee `BatchEmployeeResult` array + `BatchSummary`. NULL while `status = 'processing'`.
- `row_count`: Populated from CSV parse. Denormalized for quick display on the dashboard without parsing JSONB.
- `error_count`: Number of rows that failed computation (invalid eligibility, missing fields). Zero means all rows computed successfully.
- `status`: `processing` → set immediately on insert. `completed` → set after WASM batch run succeeds. `failed` → set if batch run throws an unrecoverable error.

---

## 7. Table: `shared_links`

```sql
-- 20240101000005_create_shared_links.sql

CREATE TABLE IF NOT EXISTS public.shared_links (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  computation_id   UUID NOT NULL REFERENCES public.computations(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token            UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (computation_id)  -- One share link per computation
);

CREATE INDEX IF NOT EXISTS shared_links_token_idx         ON public.shared_links (token);
CREATE INDEX IF NOT EXISTS shared_links_computation_idx   ON public.shared_links (computation_id);
CREATE INDEX IF NOT EXISTS shared_links_user_idx          ON public.shared_links (user_id);

-- RLS
ALTER TABLE public.shared_links ENABLE ROW LEVEL SECURITY;

-- Only the owner can see their share links
CREATE POLICY IF NOT EXISTS "users_own_shared_links_select"
  ON public.shared_links FOR SELECT
  USING (user_id = auth.uid());

-- Owner creates share link (status of computation set to 'shared' by frontend after insert)
CREATE POLICY IF NOT EXISTS "users_own_shared_links_insert"
  ON public.shared_links FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Owner can delete (revoke) share link
CREATE POLICY IF NOT EXISTS "users_own_shared_links_delete"
  ON public.shared_links FOR DELETE
  USING (user_id = auth.uid());

-- NOTE: anon users access shared computations via get_shared_computation() RPC only.
-- They NEVER directly query shared_links or computations tables.
-- The UNIQUE (computation_id) constraint means creating a new share revokes the old token.
```

**Token type is UUID, not TEXT.** This is critical — the frontend passes it as a UUID string and
the RPC `get_shared_computation` receives it as `UUID`. Using `TEXT` causes silent empty results
(see Lesson 2 from the inheritance app failures).

---

## 8. RPC: `create_organization`

```sql
-- 20240101000007_create_rpc_create_organization.sql

CREATE OR REPLACE FUNCTION public.create_organization(
  p_name     TEXT,
  p_slug     TEXT,
  p_industry TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
BEGIN
  -- Validate inputs
  IF char_length(p_name) < 2 OR char_length(p_name) > 80 THEN
    RAISE EXCEPTION 'Organization name must be 2–80 characters';
  END IF;

  IF p_slug !~ '^[a-z0-9-]{2,40}$' THEN
    RAISE EXCEPTION 'Slug must be 2–40 lowercase alphanumeric characters or hyphens';
  END IF;

  IF p_industry NOT IN ('manufacturing', 'retail', 'hospitality', 'healthcare', 'finance', 'bpo', 'other') THEN
    RAISE EXCEPTION 'Invalid industry value: %', p_industry;
  END IF;

  -- Create org
  INSERT INTO public.organizations (name, slug, industry)
  VALUES (p_name, p_slug, p_industry)
  RETURNING id INTO v_org_id;

  -- Add caller as owner
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (v_org_id, auth.uid(), 'owner');

  RETURN v_org_id;
END;
$$;

-- Authenticated users can call this
REVOKE ALL ON FUNCTION public.create_organization(TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_organization(TEXT, TEXT, TEXT) TO authenticated;
```

**Frontend call:**
```typescript
const { data: orgId, error } = await supabase.rpc('create_organization', {
  p_name: name,
  p_slug: slug,
  p_industry: industry,
})
// orgId is a UUID string on success
```

---

## 9. RPC: `get_shared_computation`

```sql
-- 20240101000008_create_rpc_get_shared_computation.sql

CREATE OR REPLACE FUNCTION public.get_shared_computation(
  p_token UUID   -- MUST be UUID type, not TEXT — see inheritance app Lesson 2
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id',             c.id,
    'title',          c.title,
    'input',          c.input,
    'output',         c.output,
    'status',         c.status,
    'createdAt',      c.created_at,
    'updatedAt',      c.updated_at
  )
  INTO v_result
  FROM public.shared_links sl
  JOIN public.computations c ON c.id = sl.computation_id
  WHERE sl.token = p_token
    AND c.status = 'shared'
    AND c.output IS NOT NULL;

  -- Return null JSONB if not found (caller checks for null)
  RETURN v_result;
END;
$$;

-- CRITICAL: anon role must be granted EXECUTE for public share links to work
-- Without this, the function silently returns empty — see inheritance app Lesson 3
REVOKE ALL ON FUNCTION public.get_shared_computation(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_shared_computation(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_shared_computation(UUID) TO authenticated;
```

**Frontend call (SharedResultsPage — no auth required):**
```typescript
// token comes from URL param: /share/$token
// token is a UUID string (e.g., "550e8400-e29b-41d4-a716-446655440000")
const { data, error } = await supabase.rpc('get_shared_computation', {
  p_token: token,  // UUID string — must match UUID parameter type in RPC
})
// data is JSONB on success, null if token not found
if (!data) {
  // Show "This link is invalid or has been revoked" error state
}
```

**Return value shape (JSONB):**
```json
{
  "id": "uuid",
  "title": "string",
  "input": { ...RetirementInput },
  "output": { ...RetirementOutput },
  "status": "shared",
  "createdAt": "2026-03-06T10:00:00Z",
  "updatedAt": "2026-03-06T10:00:00Z"
}
```

If `p_token` does not match any row, or the computation is not `'shared'`, or `output` is NULL,
the function returns `NULL` (not an empty object, not an error). The frontend checks `if (!data)`.

---

## 10. Database Type Generation

After all migrations run, generate TypeScript types:

```bash
supabase gen types typescript --local > apps/retirement-pay/frontend/src/lib/database.types.ts
```

This generates the `Database` type used by the Supabase client:
```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

export const supabase = createClient<Database>(url, key, { ... })
```

Re-run this command after any migration change. Commit the generated file.

---

## 11. Row Mapper Functions

The Supabase client returns snake_case column names. The app uses camelCase TypeScript interfaces.
Map via these functions in `src/lib/mappers.ts`:

```typescript
import type { Database } from './database.types'

type ComputationRow = Database['public']['Tables']['computations']['Row']
type BatchRow = Database['public']['Tables']['batch_computations']['Row']
type OrgRow = Database['public']['Tables']['organizations']['Row']
type MemberRow = Database['public']['Tables']['organization_members']['Row']

export function toComputationRecord(row: ComputationRow): ComputationRecord {
  return {
    id: row.id,
    userId: row.user_id,
    organizationId: row.organization_id,
    title: row.title,
    input: row.input as RetirementInput,
    output: row.output as RetirementOutput | null,
    status: row.status as 'draft' | 'computed' | 'shared',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function toBatchComputationRecord(row: BatchRow): BatchComputationRecord {
  return {
    id: row.id,
    userId: row.user_id,
    organizationId: row.organization_id,
    title: row.title,
    input: row.input as BatchInput,
    output: row.output as BatchOutput | null,
    rowCount: row.row_count,
    errorCount: row.error_count,
    status: row.status as 'processing' | 'completed' | 'failed',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function toOrganization(row: OrgRow): Organization {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    industry: row.industry as OrgIndustry,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function toOrgMember(row: MemberRow): OrgMember {
  return {
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id,
    role: row.role as OrgRole,
    joinedAt: row.joined_at,
  }
}
```

---

## 12. Migration Idempotency Rules

All SQL must be safe to re-run:

| Pattern | Idempotent form |
|---------|----------------|
| `CREATE TABLE` | `CREATE TABLE IF NOT EXISTS` |
| `CREATE INDEX` | `CREATE INDEX IF NOT EXISTS` |
| `CREATE TRIGGER` | `DROP TRIGGER IF EXISTS ... ; CREATE TRIGGER` |
| `CREATE FUNCTION` | `CREATE OR REPLACE FUNCTION` |
| `CREATE POLICY` | `CREATE POLICY IF NOT EXISTS` |
| `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` | Always idempotent (no-op if already enabled) |
| `GRANT EXECUTE` | Always idempotent (no-op if already granted) |

**Note on `CREATE POLICY IF NOT EXISTS`:** Requires PostgreSQL 15+. Supabase currently uses
PostgreSQL 15, so this is safe. On older versions, use `DO $$ BEGIN IF NOT EXISTS ... END $$`
blocks — but this is not needed for Supabase.

---

## 13. Local Development Setup

```bash
# Start local Supabase
supabase start

# Apply all migrations
supabase db reset

# Generate TypeScript types
supabase gen types typescript --local > apps/retirement-pay/frontend/src/lib/database.types.ts

# Seed data for development (optional)
# supabase db seed  -- (if supabase/seed.sql exists)
```

`supabase/config.toml` settings for development:
```toml
[auth]
site_url = "http://localhost:5173"
additional_redirect_urls = ["http://localhost:5173/auth/callback"]
enable_confirmations = false  # Skip email confirmation in dev
```

---

## 14. RLS Policy Verification Queries

After migration, run these queries in the Supabase SQL editor to verify RLS:

```sql
-- Verify RLS is enabled on all tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('organizations', 'organization_members', 'organization_invitations',
                  'computations', 'batch_computations', 'shared_links');
-- Expected: rowsecurity = true for all rows

-- Verify anon can execute get_shared_computation
SELECT has_function_privilege('anon', 'public.get_shared_computation(uuid)', 'execute');
-- Expected: true

-- Verify authenticated can execute create_organization
SELECT has_function_privilege('authenticated', 'public.create_organization(text,text,text)', 'execute');
-- Expected: true

-- Verify token column type in shared_links
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'shared_links' AND column_name = 'token';
-- Expected: data_type = 'uuid'
```

---

## Summary

| Table | Rows | RLS | Primary Access Pattern |
|-------|------|-----|----------------------|
| `organizations` | Org records | Yes | Members read via membership join |
| `organization_members` | Membership rows | Yes | `user_id = auth.uid()` |
| `organization_invitations` | Pending invites | Yes | Admins/owners only |
| `computations` | Single-employee results | Yes | `user_id = auth.uid()` or org membership |
| `batch_computations` | Batch results | Yes | `user_id = auth.uid()` or org membership |
| `shared_links` | Share tokens | Yes | Owner CRUD; anon access via RPC only |

| RPC | Auth Required | Anon Grant | SECURITY DEFINER |
|-----|--------------|-----------|-----------------|
| `create_organization` | Yes (authenticated) | No | Yes |
| `get_shared_computation` | No (anon) | **YES** | Yes |

Critical constraints:
- `shared_links.token` is `UUID` type — the RPC parameter `p_token` is `UUID` — frontend passes UUID string — no type mismatch
- `get_shared_computation` has `GRANT EXECUTE TO anon` — without this, share links silently return null
- Both RPCs use `SET search_path = public` to prevent search_path injection
