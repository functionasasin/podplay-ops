# spec-multi-seat — Multi-Seat Firm Accounts

**Aspect:** spec-multi-seat
**Wave:** 2 — Per-Feature Specifications
**Date:** 2026-03-01
**Reads:** `multi-tenancy-patterns`, `spec-auth-persistence`
**Depends:** `spec-auth-persistence` complete ✅

---

## 1. Overview

Multi-seat firm accounts let Philippine estate law firms collaborate on cases and client records within a shared workspace. Every firm is an **organization** — a tenant that scopes all cases, clients, and settings to the firm rather than to individual user accounts.

### Why PH estate lawyers need this

A typical PH estate settlement practice is a small firm of 2–8 attorneys with 1–3 paralegals. A managing partner (admin) handles billing and firm-wide settings while associates (attorneys) work cases. Paralegals enter data and prepare documents. The bar ethics rules in the Philippines require **firm-level** conflict-of-interest screening — a conflict arises if *any* attorney at the firm represents an adverse party, not just the individual handling the case. Multi-seat with a shared client pool directly satisfies this legal obligation.

### What this feature adds

- **Organizations table** — firm entity that owns all resources
- **Membership table** — maps users to org with a role
- **Invitation flow** — admin invites attorneys/paralegals by email
- **Role-based access control** — admin / attorney / paralegal / readonly
- **Firm-scoped client pool** — all members see all clients for conflict checks
- **Admin management dashboard** — member list, usage stats, plan info
- **Non-breaking migration** — solo and anonymous users are unaffected

---

## 2. Data Model

### 2.1 New Tables

#### `organizations` — the law firm

```sql
CREATE TABLE organizations (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT        NOT NULL,                        -- "Santos & Reyes Law Office"
  slug          TEXT        UNIQUE,                          -- "santos-reyes" (future URL routing)
  plan          TEXT        NOT NULL DEFAULT 'solo'
                            CHECK (plan IN ('solo', 'team', 'firm', 'enterprise')),
  seat_limit    INTEGER     NOT NULL DEFAULT 1,
  billing_email TEXT,                                        -- where invoices are sent
  logo_url      TEXT,                                        -- populated by spec-firm-branding
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_organizations_slug ON organizations(slug);
```

#### `organization_members` — user ↔ org join table

```sql
CREATE TABLE organization_members (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT        NOT NULL DEFAULT 'attorney'
                          CHECK (role IN ('admin', 'attorney', 'paralegal', 'readonly')),
  display_name TEXT,                                         -- overrides auth.users.email in UI
  invited_by  UUID        REFERENCES auth.users(id),
  joined_at   TIMESTAMPTZ,                                   -- NULL until invitation accepted
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);

CREATE INDEX idx_org_members_org_id  ON organization_members(org_id);
CREATE INDEX idx_org_members_user_id ON organization_members(user_id);
```

#### `organization_invitations` — pending invites before email acceptance

```sql
CREATE TABLE organization_invitations (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email       TEXT        NOT NULL,
  role        TEXT        NOT NULL DEFAULT 'attorney'
                          CHECK (role IN ('attorney', 'paralegal', 'readonly')),
  token       TEXT        UNIQUE NOT NULL DEFAULT gen_random_uuid()::TEXT,
  invited_by  UUID        NOT NULL REFERENCES auth.users(id),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '48 hours'),
  accepted_at TIMESTAMPTZ,                                   -- NULL = still pending
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, email)
);

CREATE INDEX idx_org_invitations_token ON organization_invitations(token);
CREATE INDEX idx_org_invitations_email ON organization_invitations(email);
CREATE INDEX idx_org_invitations_org_id ON organization_invitations(org_id);
```

### 2.2 Modifications to Existing Tables

`cases` and `clients` tables gain an `org_id` foreign key:

```sql
-- Add org_id to cases (from spec-auth-persistence; applying multi-tenancy scope)
ALTER TABLE cases
  ADD COLUMN org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX idx_cases_org_id         ON cases(org_id);
CREATE INDEX idx_cases_org_created_at ON cases(org_id, created_at DESC);

-- Add org_id to clients (from spec-client-profiles; applying multi-tenancy scope)
ALTER TABLE clients
  ADD COLUMN org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX idx_clients_org_id ON clients(org_id);
```

`org_id` is nullable to preserve solo users and anonymous users who have no org. RLS policies handle the null case — see §2.5.

### 2.3 Helper SQL Functions

These functions run as `SECURITY DEFINER` so they can query `organization_members` without triggering its own RLS recursion.

```sql
-- Returns the org_id for the current authenticated user
-- (first membership found; users can only be in one org in the current product)
CREATE OR REPLACE FUNCTION auth.current_org_id()
RETURNS UUID AS $$
  SELECT org_id
  FROM organization_members
  WHERE user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Returns the current user's role in their org
CREATE OR REPLACE FUNCTION auth.current_org_role()
RETURNS TEXT AS $$
  SELECT role
  FROM organization_members
  WHERE user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Returns true if the current user is an admin of their org
CREATE OR REPLACE FUNCTION auth.is_org_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;
```

### 2.4 RLS Policies

#### `organizations` table

```sql
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Members can read their org's details
CREATE POLICY organizations_select ON organizations
  FOR SELECT USING (
    id = auth.current_org_id()
  );

-- Only admins can update org details (name, billing_email, logo_url)
CREATE POLICY organizations_update ON organizations
  FOR UPDATE USING (
    id = auth.current_org_id()
    AND auth.is_org_admin()
  );

-- Admins can update the plan (via Edge Function with service role in practice)
-- No INSERT or DELETE via client — orgs are created only by server functions
```

#### `organization_members` table

```sql
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- All org members can see the full member list
CREATE POLICY org_members_select ON organization_members
  FOR SELECT USING (
    org_id = auth.current_org_id()
  );

-- Only admins can insert/update/delete members
CREATE POLICY org_members_admin_insert ON organization_members
  FOR INSERT WITH CHECK (
    org_id = auth.current_org_id()
    AND auth.is_org_admin()
  );

CREATE POLICY org_members_admin_update ON organization_members
  FOR UPDATE USING (
    org_id = auth.current_org_id()
    AND auth.is_org_admin()
  );

CREATE POLICY org_members_admin_delete ON organization_members
  FOR DELETE USING (
    org_id = auth.current_org_id()
    AND auth.is_org_admin()
  );
```

#### `organization_invitations` table

```sql
ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;

-- Admins can see all pending invitations for their org
CREATE POLICY org_invitations_select ON organization_invitations
  FOR SELECT USING (
    org_id = auth.current_org_id()
    AND auth.is_org_admin()
  );

-- No direct client INSERT/DELETE — managed via Edge Functions with service role
```

#### `cases` table — updated with org scope

```sql
-- SELECT: org members see all org cases; solo users (no org) see only their own
CREATE POLICY cases_select ON cases
  FOR SELECT USING (
    (org_id IS NOT NULL AND org_id = auth.current_org_id())
    OR (org_id IS NULL AND created_by = auth.uid())
  );

-- INSERT: attorney/paralegal/admin can create within their org; solo users create with NULL org_id
CREATE POLICY cases_insert ON cases
  FOR INSERT WITH CHECK (
    (org_id = auth.current_org_id()
      AND auth.current_org_role() IN ('admin', 'attorney', 'paralegal'))
    OR (org_id IS NULL AND created_by = auth.uid())
  );

-- UPDATE: attorney/paralegal/admin can update org cases; solo users update their own
CREATE POLICY cases_update ON cases
  FOR UPDATE USING (
    (org_id IS NOT NULL AND org_id = auth.current_org_id()
      AND auth.current_org_role() IN ('admin', 'attorney', 'paralegal'))
    OR (org_id IS NULL AND created_by = auth.uid())
  );

-- DELETE: admin/attorney only for org cases; solo users delete their own
CREATE POLICY cases_delete ON cases
  FOR DELETE USING (
    (org_id IS NOT NULL AND org_id = auth.current_org_id()
      AND auth.current_org_role() IN ('admin', 'attorney'))
    OR (org_id IS NULL AND created_by = auth.uid())
  );
```

#### `clients` table — updated with org scope

```sql
-- All org members can see all clients (firm-wide conflict screening)
CREATE POLICY clients_select ON clients
  FOR SELECT USING (
    (org_id IS NOT NULL AND org_id = auth.current_org_id())
    OR (org_id IS NULL AND created_by = auth.uid())
  );

-- attorney/paralegal/admin can create clients within their org
CREATE POLICY clients_insert ON clients
  FOR INSERT WITH CHECK (
    (org_id = auth.current_org_id()
      AND auth.current_org_role() IN ('admin', 'attorney', 'paralegal'))
    OR (org_id IS NULL AND created_by = auth.uid())
  );

-- attorney/paralegal/admin can edit clients
CREATE POLICY clients_update ON clients
  FOR UPDATE USING (
    (org_id IS NOT NULL AND org_id = auth.current_org_id()
      AND auth.current_org_role() IN ('admin', 'attorney', 'paralegal'))
    OR (org_id IS NULL AND created_by = auth.uid())
  );

-- admin/attorney can delete clients
CREATE POLICY clients_delete ON clients
  FOR DELETE USING (
    (org_id IS NOT NULL AND org_id = auth.current_org_id()
      AND auth.current_org_role() IN ('admin', 'attorney'))
    OR (org_id IS NULL AND created_by = auth.uid())
  );
```

### 2.5 Permission Matrix (Application Layer)

Database RLS enforces hard boundaries; application layer enforces UI gating:

| Action | admin | attorney | paralegal | readonly |
|--------|:-----:|:--------:|:---------:|:--------:|
| View all org cases | ✅ | ✅ | ✅ | ✅ |
| Create new case | ✅ | ✅ | ✅ | ❌ |
| Edit case inputs | ✅ | ✅ | ✅ | ❌ |
| Finalize case | ✅ | ✅ | ❌ | ❌ |
| Archive case | ✅ | ✅ | ❌ | ❌ |
| Delete case | ✅ | ✅ | ❌ | ❌ |
| View all org clients | ✅ | ✅ | ✅ | ✅ |
| Create client | ✅ | ✅ | ✅ | ❌ |
| Edit client | ✅ | ✅ | ✅ | ❌ |
| Delete client | ✅ | ✅ | ❌ | ❌ |
| Export PDF | ✅ | ✅ | ✅ | ✅ |
| Add case notes | ✅ | ✅ | ✅ | ❌ |
| Create shareable link | ✅ | ✅ | ❌ | ❌ |
| View member list | ✅ | ❌ | ❌ | ❌ |
| Invite members | ✅ | ❌ | ❌ | ❌ |
| Edit member role | ✅ | ❌ | ❌ | ❌ |
| Remove member | ✅ | ❌ | ❌ | ❌ |
| Update firm settings | ✅ | ❌ | ❌ | ❌ |
| View admin dashboard | ✅ | ❌ | ❌ | ❌ |
| Manage billing | ✅ | ❌ | ❌ | ❌ |

---

## 3. UI Design

### 3.1 Navigation Changes for Firm Members

When a user belongs to a firm (non-solo org), the top navigation shows the firm name and the Settings link expands to include a "Firm" section visible only to admins.

```
┌────────────────────────────────────────────────────────────────────┐
│  ⚖ Tagapagmana Pro   Santos & Reyes Law Office ▼   [+ New Case]   │
│                                                    Atty. Santos ▼  │
│                                        [My Profile] [Firm] [Logout] │
└────────────────────────────────────────────────────────────────────┘
```

For solo users, the firm name is hidden and navigation shows only `[My Profile] [Logout]`.

### 3.2 Firm Admin Dashboard (`/settings/firm`)

Accessible only to org admins. Linked from the top nav "Firm" item.

```
┌──────────────────────────────────────────────────────────────────────┐
│  Firm Settings                                                        │
│  ┌─────────────────┐ ┌────────────────────────────────────────────┐  │
│  │ Firm Profile    │ │  Members                                    │  │
│  │ Members     ←  │ │  Active: 3 of 5 seats used (Team Plan)     │  │
│  │ Plan & Billing │ │                            [+ Invite Member] │  │
│  └─────────────────┘ │  ┌──────────────────────────────────────┐   │  │
│                       │  │ Name            Role       Status    │   │  │
│                       │  ├──────────────────────────────────────┤   │  │
│                       │  │ Atty. M. Santos  Admin    Active [•] │   │  │
│                       │  │ Atty. C. Reyes   Attorney Active [▼] │   │  │
│                       │  │ P. Cruz          Paralegal Active [▼] │   │  │
│                       │  │ J.B. dela Cruz   —        Pending[↺] │   │  │
│                       │  └──────────────────────────────────────┘   │  │
│                       │                                              │  │
│                       │  [•] = no actions (own row)                 │  │
│                       │  [▼] = dropdown: Change Role / Remove       │  │
│                       │  [↺] = Resend Invitation                    │  │
│                       └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

**Members tab columns:**
- **Name** — `display_name` from `organization_members`, or email if null
- **Role** — pill badge: Admin (purple), Attorney (blue), Paralegal (green), Read-Only (gray)
- **Status** — Active (user joined) or Pending (invitation sent, not yet accepted)
- **Actions** — [▼] dropdown with role-change and remove options

### 3.3 Invite Member Modal

Triggered by clicking [+ Invite Member]. Admin cannot exceed `seat_limit` when inviting.

```
┌─────────────────────────────────────────────────────────┐
│  Invite a Team Member                            [✕]     │
│                                                          │
│  Email address                                           │
│  ┌────────────────────────────────────────────────────┐  │
│  │ attorney@lawfirm.ph                                │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  Role                                                    │
│  ○ Attorney    Full case and client access               │
│  ○ Paralegal   Data entry and viewing                    │
│  ○ Read-Only   View cases and export PDFs only           │
│                                                          │
│  ⚠ You have 2 of 5 seats remaining.                     │
│                                                          │
│  [Cancel]                          [Send Invitation →]   │
└─────────────────────────────────────────────────────────┘
```

On submit: calls the `invite-member` Edge Function. Modal closes with a success toast: "Invitation sent to attorney@lawfirm.ph. It will expire in 48 hours."

If seat limit reached, the [+ Invite Member] button is disabled and shows tooltip: "Upgrade your plan to add more team members."

### 3.4 Change Role Dropdown (Inline in Member Table)

When admin clicks [▼] next to a member row:

```
┌───────────────────────┐
│  Change Role          │
│  ○ Admin              │
│  ● Attorney        ←current  │
│  ○ Paralegal          │
│  ○ Read-Only          │
│  ───────────────────  │
│  Remove from firm...  │
└───────────────────────┘
```

Selecting a new role calls `PATCH /api/members/:memberId { role: 'paralegal' }` and updates `organization_members.role` in place.

### 3.5 Remove Member Confirmation

Clicking "Remove from firm..." shows a confirmation dialog:

```
┌────────────────────────────────────────────────────────┐
│  Remove Atty. C. Reyes from Santos & Reyes Law Office? │
│                                                        │
│  They will lose access to all firm cases and clients.  │
│  Their assigned cases will remain accessible to other  │
│  firm members.                                         │
│                                                        │
│  [Cancel]                          [Remove Member]     │
└────────────────────────────────────────────────────────┘
```

On confirm: deletes the `organization_members` row. Supabase RLS immediately revokes the removed user's access via `ON DELETE CASCADE` reference. The removed user's next API call returns 401.

### 3.6 Plan & Billing Tab (`/settings/firm/billing`)

```
┌──────────────────────────────────────────────────────────────────────┐
│  Plan & Billing                                                       │
│                                                                       │
│  Current Plan: Team (₱1,999/month)                                   │
│  Renewal date: April 1, 2026                                         │
│  Billing email: billing@santos-reyes.ph                              │
│                                                                       │
│  Seat usage: 3 of 5 seats occupied                                   │
│  ████████████░░░░░░░░░  (3/5)                                        │
│                                                                       │
│  Plans:                                                               │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │ Solo      ₱999/mo  │ 1 seat    │ Core features, 50 cases/mo    │ │
│  │ Team ✓   ₱1,999/mo │ 5 seats   │ All + CRM, branding, unlimited│ │
│  │ Firm      ₱3,999/mo│ 15 seats  │ All + shareable links, support│ │
│  │ Enterprise  Custom │ Unlimited │ Custom SLA, dedicated setup   │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  [Manage Billing →]    (opens Stripe Customer Portal in new tab)     │
└──────────────────────────────────────────────────────────────────────┘
```

### 3.7 Accept Invitation Page (`/accept-invite?token=<uuid>`)

This page is rendered when an invitee clicks the magic link in their invitation email. Supabase auth handles the session establishment; the page finalizes org membership.

```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│   ⚖ Tagapagmana Pro                                     │
│                                                          │
│   You've been invited to join                           │
│   Santos & Reyes Law Office                             │
│   as Attorney                                           │
│                                                          │
│   ┌────────────────────────────────────────────────┐    │
│   │  Sign in to accept this invitation             │    │
│   │                                                │    │
│   │  Email: attorney@lawfirm.ph                    │    │
│   │  ┌──────────────────────────────────────────┐  │    │
│   │  │ Password                                 │  │    │
│   │  └──────────────────────────────────────────┘  │    │
│   │                                                │    │
│   │  [Accept Invitation & Sign In]                 │    │
│   │                                                │    │
│   │  Don't have an account yet?                    │    │
│   │  [Create Account & Accept →]                   │    │
│   └────────────────────────────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

If the token is expired or invalid, show:

```
┌─────────────────────────────────────────────────────────┐
│   This invitation link has expired.                     │
│   Invitation links are valid for 48 hours.             │
│                                                          │
│   Ask Santos & Reyes Law Office to send a new invite.   │
│   [Go to Sign In]                                        │
└─────────────────────────────────────────────────────────┘
```

### 3.8 Usage Stats Section (Admin Dashboard sidebar)

Shown in the firm dashboard alongside the members list:

```
┌──────────────────────────────────────┐
│  Usage — March 2026                  │
│  ─────────────────────────────────── │
│  Cases created: 23                   │
│  Active clients: 41                  │
│  PDFs exported: 17                   │
│  Seats: 3 / 5 used                   │
│  Plan: Team (₱1,999/mo)             │
│  ─────────────────────────────────── │
│  [Upgrade Plan]   [View All Cases]   │
└──────────────────────────────────────┘
```

Usage figures come from two count queries on `cases` and `clients` filtered by `org_id` and current calendar month.

---

## 4. API / Data Layer

### 4.1 `useOrganization()` Hook

Loaded once after authentication, provides org context to all child components.

```typescript
// src/hooks/useOrganization.ts
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface OrgMembership {
  orgId: string;
  orgName: string;
  orgPlan: "solo" | "team" | "firm" | "enterprise";
  seatLimit: number;
  role: "admin" | "attorney" | "paralegal" | "readonly";
  memberCount: number;
}

export function useOrganization() {
  const [membership, setMembership] = useState<OrgMembership | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrg() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from("organization_members")
        .select(`
          role,
          organizations!inner(
            id,
            name,
            plan,
            seat_limit,
            organization_members(count)
          )
        `)
        .eq("user_id", user.id)
        .single();

      if (data) {
        const org = data.organizations as any;
        setMembership({
          orgId: org.id,
          orgName: org.name,
          orgPlan: org.plan,
          seatLimit: org.seat_limit,
          role: data.role,
          memberCount: org.organization_members[0].count,
        });
      }
      setLoading(false);
    }
    loadOrg();
  }, []);

  return { membership, loading };
}
```

### 4.2 `ensurePersonalOrg()` — Called on First Sign-In

```typescript
// src/lib/ensurePersonalOrg.ts
import { SupabaseClient } from "@supabase/supabase-js";

export async function ensurePersonalOrg(
  userId: string,
  displayName: string,
  supabase: SupabaseClient
): Promise<void> {
  // Check if user already has an org
  const { data: existing } = await supabase
    .from("organization_members")
    .select("org_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) return; // Already in an org

  // Create a personal org (solo plan, 1 seat)
  const { data: org, error } = await supabase
    .from("organizations")
    .insert({
      name: `${displayName}'s Firm`,
      plan: "solo",
      seat_limit: 1,
    })
    .select()
    .single();

  if (error || !org) throw new Error("Failed to create personal org");

  // Add user as admin of their personal org
  await supabase
    .from("organization_members")
    .insert({
      org_id: org.id,
      user_id: userId,
      role: "admin",
      joined_at: new Date().toISOString(),
    });

  // Backfill any cases created before org existed
  await supabase
    .from("cases")
    .update({ org_id: org.id })
    .eq("created_by", userId)
    .is("org_id", null);
}
```

### 4.3 Edge Function: `invite-member`

```typescript
// supabase/functions/invite-member/index.ts
import { createClient } from "@supabase/supabase-js";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const { email, role, org_id } = await req.json() as {
    email: string;
    role: "attorney" | "paralegal" | "readonly";
    org_id: string;
  };

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Authenticate the requester
  const { data: { user }, error: authError } = await adminClient.auth.getUser(
    authHeader.replace("Bearer ", "")
  );
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  // Verify requester is admin of the specified org
  const { data: membership } = await adminClient
    .from("organization_members")
    .select("role, organizations!inner(seat_limit)")
    .eq("org_id", org_id)
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.role !== "admin") {
    return new Response(JSON.stringify({ error: "Forbidden: admin role required" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  // Check seat limit
  const { count: activeMembers } = await adminClient
    .from("organization_members")
    .select("*", { count: "exact", head: true })
    .eq("org_id", org_id)
    .not("joined_at", "is", null);

  const org = membership.organizations as any;
  if ((activeMembers ?? 0) >= org.seat_limit) {
    return new Response(JSON.stringify({ error: "Seat limit reached" }), {
      status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  // Check for existing pending invitation (upsert: update expiry if re-inviting)
  const { data: existingInvite } = await adminClient
    .from("organization_invitations")
    .select("id, accepted_at")
    .eq("org_id", org_id)
    .eq("email", email)
    .maybeSingle();

  if (existingInvite?.accepted_at) {
    return new Response(JSON.stringify({ error: "User is already a member" }), {
      status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  // Create or refresh invitation record
  const newToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  const { data: invite, error: inviteError } = await adminClient
    .from("organization_invitations")
    .upsert(
      { org_id, email, role, invited_by: user.id, token: newToken, expires_at: expiresAt },
      { onConflict: "org_id,email", ignoreDuplicates: false }
    )
    .select()
    .single();

  if (inviteError || !invite) {
    return new Response(JSON.stringify({ error: "Failed to create invitation" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  // Send Supabase invitation email with magic link
  const appUrl = Deno.env.get("APP_URL") ?? "https://tagapagmana.ph";
  await adminClient.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${appUrl}/accept-invite?token=${invite.token}`
  });

  return new Response(JSON.stringify({ status: "invited", email, role }), {
    status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
});
```

### 4.4 Edge Function: `accept-invitation`

```typescript
// supabase/functions/accept-invitation/index.ts
import { createClient } from "@supabase/supabase-js";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const { token } = await req.json() as { token: string };
  const authHeader = req.headers.get("Authorization");

  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Authenticate the accepting user
  const { data: { user }, error: authError } = await adminClient.auth.getUser(
    authHeader?.replace("Bearer ", "") ?? ""
  );
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  // Look up the invitation by token
  const { data: invite } = await adminClient
    .from("organization_invitations")
    .select("id, org_id, email, role, expires_at, accepted_at")
    .eq("token", token)
    .maybeSingle();

  if (!invite) {
    return new Response(JSON.stringify({ error: "Invalid invitation token" }), {
      status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
  if (invite.accepted_at) {
    return new Response(JSON.stringify({ error: "Invitation already used" }), {
      status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
  if (new Date(invite.expires_at) < new Date()) {
    return new Response(JSON.stringify({ error: "Invitation expired" }), {
      status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
  if (invite.email.toLowerCase() !== user.email!.toLowerCase()) {
    return new Response(JSON.stringify({ error: "Email mismatch" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  // Add user to org
  await adminClient
    .from("organization_members")
    .insert({
      org_id: invite.org_id,
      user_id: user.id,
      role: invite.role,
      joined_at: new Date().toISOString(),
    });

  // Mark invitation as accepted
  await adminClient
    .from("organization_invitations")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invite.id);

  // Backfill any pre-existing solo cases for this user into the org
  await adminClient
    .from("cases")
    .update({ org_id: invite.org_id })
    .eq("created_by", user.id)
    .is("org_id", null);

  return new Response(
    JSON.stringify({ status: "accepted", org_id: invite.org_id, role: invite.role }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
```

### 4.5 Member Management Functions (Client Side)

```typescript
// src/lib/members.ts
import { supabase } from "@/lib/supabase";

export type MemberRole = "admin" | "attorney" | "paralegal" | "readonly";

export interface OrgMember {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  role: MemberRole;
  joinedAt: string | null;  // null = pending invitation
  invitedBy: string | null;
}

export async function listOrgMembers(orgId: string): Promise<OrgMember[]> {
  const { data, error } = await supabase
    .from("organization_members")
    .select(`
      id,
      user_id,
      display_name,
      role,
      joined_at,
      invited_by,
      auth_users:user_id(email)
    `)
    .eq("org_id", orgId)
    .order("joined_at", { ascending: true, nullsFirst: false });

  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    displayName: row.display_name ?? row.auth_users?.email ?? "Unknown",
    email: row.auth_users?.email ?? "",
    role: row.role,
    joinedAt: row.joined_at,
    invitedBy: row.invited_by,
  }));
}

export async function listPendingInvitations(orgId: string) {
  const { data, error } = await supabase
    .from("organization_invitations")
    .select("id, email, role, expires_at, created_at")
    .eq("org_id", orgId)
    .is("accepted_at", null)
    .gte("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function updateMemberRole(
  memberId: string,
  newRole: MemberRole
): Promise<void> {
  // Prevent demoting the last admin (check count first)
  const { error } = await supabase
    .from("organization_members")
    .update({ role: newRole })
    .eq("id", memberId);

  if (error) throw error;
}

export async function removeMember(memberId: string): Promise<void> {
  const { error } = await supabase
    .from("organization_members")
    .delete()
    .eq("id", memberId);

  if (error) throw error;
}

export async function resendInvitation(
  invitationId: string,
  email: string,
  orgId: string,
  role: MemberRole
): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  await fetch("/api/invite-member", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${session!.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, role, org_id: orgId }),
  });
}
```

### 4.6 Usage Stats Query

```typescript
// src/lib/orgUsage.ts
export async function getOrgUsageThisMonth(orgId: string) {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [casesRes, clientsRes, pdfsRes, seatsRes] = await Promise.all([
    supabase
      .from("cases")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId)
      .gte("created_at", monthStart.toISOString()),

    supabase
      .from("clients")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId),

    // pdf_exports table tracked separately (see spec-pdf-export)
    supabase
      .from("pdf_exports")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId)
      .gte("created_at", monthStart.toISOString()),

    supabase
      .from("organization_members")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId)
      .not("joined_at", "is", null),
  ]);

  return {
    casesThisMonth: casesRes.count ?? 0,
    activeClients: clientsRes.count ?? 0,
    pdfsThisMonth: pdfsRes.count ?? 0,
    activeSeats: seatsRes.count ?? 0,
  };
}
```

### 4.7 Permission Guard Component

```typescript
// src/components/PermissionGate.tsx
import { useOrganization } from "@/hooks/useOrganization";

type PermissionAction =
  | "cases:delete"
  | "cases:finalize"
  | "clients:delete"
  | "members:manage"
  | "firm:settings"
  | "links:share";

const ROLE_PERMISSIONS: Record<string, PermissionAction[]> = {
  admin: [
    "cases:delete", "cases:finalize", "clients:delete",
    "members:manage", "firm:settings", "links:share",
  ],
  attorney: ["cases:delete", "cases:finalize", "links:share"],
  paralegal: [],
  readonly: [],
};

export function PermissionGate({
  action,
  children,
  fallback = null,
}: {
  action: PermissionAction;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { membership } = useOrganization();
  if (!membership) return <>{fallback}</>;
  const allowed = ROLE_PERMISSIONS[membership.role]?.includes(action) ?? false;
  return allowed ? <>{children}</> : <>{fallback}</>;
}

// Usage:
// <PermissionGate action="members:manage">
//   <AdminDashboardLink />
// </PermissionGate>
```

---

## 5. Integration Points

### 5.1 spec-auth-persistence
`spec-auth-persistence` establishes the `cases` table and auth session. Multi-seat adds `org_id` to `cases` and replaces the `user_id`-scoped RLS with org-scoped RLS. The `ensurePersonalOrg()` function is called immediately after `supabase.auth.signIn()` to provision a solo org for new users.

### 5.2 spec-client-profiles
`clients` table gains `org_id` from this spec. The client list page (`/clients`) already queries by `user_id`; it must query by `org_id` when the user is in a firm. The `useOrganization()` hook provides the `orgId` to the client list query.

### 5.3 spec-firm-branding
Firm branding settings (name, address, logo) are stored on the `organizations` table (`logo_url` column already present in §2.1 DDL). The branding settings page is a tab within `/settings/firm`, adjacent to the Members tab specified here. Admin-only gate applies to both tabs.

### 5.4 spec-case-notes
`case_notes` table should also carry `org_id` for RLS. Notes are scoped to the case, which is already scoped to the org — a join through `cases.org_id` is sufficient; a separate `org_id` column on `case_notes` is not required.

### 5.5 spec-shareable-links
Shareable link tokens are owned by a case, which is org-scoped. The `readonly` role can *view* cases via the app but cannot generate shareable links. Unauthenticated link recipients bypass RLS entirely via the token-based read path (see spec-shareable-links).

### 5.6 spec-conflict-check
The conflict check spec queries `clients` by `org_id`, which is exactly the firm-wide shared client pool described in §2.4. No additional changes needed here.

### 5.7 PDF Export
PDFs generated by firm members should show the firm name in the header (from `organizations.name`). The `useOrganization()` hook provides this at render time to the PDF renderer.

---

## 6. Edge Cases

### 6.1 Removing the Last Admin
Before executing `removeMember()` or `updateMemberRole()` to demote a user from admin, check that at least one other admin remains:

```typescript
// src/lib/members.ts — guard before role change or removal
async function assertNotLastAdmin(orgId: string, targetUserId: string, newRole?: MemberRole) {
  const { count } = await supabase
    .from("organization_members")
    .select("*", { count: "exact", head: true })
    .eq("org_id", orgId)
    .eq("role", "admin")
    .neq("user_id", targetUserId);

  const remainingAdmins = count ?? 0;
  const targetBecomingNonAdmin = !newRole || newRole !== "admin";
  if (remainingAdmins === 0 && targetBecomingNonAdmin) {
    throw new Error(
      "Cannot remove the only admin. Promote another member to Admin first."
    );
  }
}
```

### 6.2 Invitation Expiry
Invitations expire after 48 hours. The `accept-invitation` Edge Function rejects expired tokens with HTTP 410 Gone. The admin dashboard shows pending invitations with expiry info. A [Resend] action re-creates the invitation with a new 48-hour window.

### 6.3 Seat Limit Enforcement
The `invite-member` Edge Function checks active member count against `organizations.seat_limit` before inserting a new invitation. If the org is at capacity, it returns HTTP 422 with `{ error: "Seat limit reached" }`. The UI shows a tooltip explaining the upgrade path.

### 6.4 Invited Email Already Has an Account
`supabase.auth.admin.inviteUserByEmail()` sends a magic link to existing Supabase users (sign-in link) or new users (account creation link). Both flows redirect to `/accept-invite?token=<uuid>` and work identically from the `accept-invitation` Edge Function perspective.

### 6.5 Invitee Email Mismatch
If an invitee uses a different email to sign in than the one invited, the `accept-invitation` Edge Function returns HTTP 403. The user sees: "This invitation was sent to a different email address. Sign in as attorney@lawfirm.ph to accept it."

### 6.6 Anonymous User Tries to Save
Anonymous users (no auth) compute results client-side. If they click "Save Case," they see the auth modal (from spec-auth-persistence). After signing in, `ensurePersonalOrg()` auto-creates a solo org and the case is saved with the new `org_id`.

### 6.7 User Transferred to Another Firm
Current design: one org membership per user. If a user leaves firm A and joins firm B, their old cases remain in firm A's `org_id` (accessible to firm A members). The departing attorney does not retain access after their row is deleted from `organization_members`. No case migration occurs automatically — this is deliberate to preserve client data ownership at the firm level.

### 6.8 Cases Created Before Org Feature Was Deployed
On any sign-in, `ensurePersonalOrg()` runs and backfills `cases.org_id` for any rows where `org_id IS NULL AND created_by = user.id`. This migration is idempotent (safe to run multiple times).

### 6.9 Firm Name Collision
`organizations.slug` has a UNIQUE constraint. Name collisions at slug level prompt appending a numeric suffix (`santos-reyes-2`). Slug is not user-facing in v1 (used internally for potential future URL routing).

---

## 7. Dependencies

### Must be built before this feature
- `spec-auth-persistence` — Supabase auth session, `cases` table, `user_profiles`

### External services
- **Supabase Auth** — `inviteUserByEmail` API for invitation emails
- **Supabase Edge Functions** — `invite-member` and `accept-invitation` deployed to the project's edge runtime
- **Stripe** (optional) — `Plan & Billing` tab links to Stripe Customer Portal; billing logic is out of scope for v1 (plan field is updated manually or via a separate billing webhook)

### npm packages
No additional npm packages required. Uses existing:
- `@supabase/supabase-js` ^2.x (already in project)
- React 19 (already in project)

---

## 8. Acceptance Criteria

### Authentication & Organization Setup
- [ ] New user signs in for the first time → a personal org named "{DisplayName}'s Firm" is auto-created with `plan = 'solo'`, `seat_limit = 1`, and the user is added as `admin`
- [ ] Existing solo user signs in → `ensurePersonalOrg()` is idempotent (no duplicate orgs created)
- [ ] Anonymous user computes an inheritance case → result renders without requiring auth or an org
- [ ] Anonymous user clicks "Save Case" → auth modal appears; after sign-in, case is saved with correct `org_id`

### Member Management
- [ ] Admin visits `/settings/firm` → sees the Members tab with a list of all org members and pending invitations
- [ ] Admin clicks [+ Invite Member], enters email and selects role, submits → invitation row created in `organization_invitations`; Supabase sends invitation email within 30 seconds
- [ ] Invitee clicks email link → `/accept-invite?token=<uuid>` renders with firm name and role; user signs in and joins org
- [ ] After accepting, invitee can access all org cases and clients immediately
- [ ] Admin changes a member's role → `organization_members.role` updates; member's permissions change on next page load
- [ ] Admin removes a member → member's row deleted; member receives 403 on next API call
- [ ] Admin attempts to remove the only admin → blocked with error message "Promote another member to Admin first"
- [ ] Admin attempts to invite when at seat limit → blocked with HTTP 422; UI shows "Upgrade your plan" tooltip
- [ ] Expired invitation token → `/accept-invite` shows "This invitation link has expired" message
- [ ] Resend invitation → old token replaced with new token; new email sent with 48-hour window

### Role-Based Access Control
- [ ] `readonly` member cannot see "Edit" controls on case detail page
- [ ] `readonly` member cannot see [+ New Case] button
- [ ] `paralegal` cannot see [Finalize] or [Archive] buttons on a case
- [ ] `paralegal` cannot access `/settings/firm`
- [ ] `attorney` cannot access `/settings/firm`
- [ ] `admin` sees all controls and the Firm Settings nav link
- [ ] Database RLS blocks direct Supabase queries that exceed role permissions (verified via curl/REST test)

### Data Isolation
- [ ] Member of Firm A cannot see cases belonging to Firm B via any API call
- [ ] `auth.current_org_id()` returns the correct org UUID for an authenticated user
- [ ] Cases with `org_id = NULL` (solo user pre-org) are visible only to their `created_by` user

### Client Pool
- [ ] All members of a firm see all clients created by any firm member
- [ ] Creating a client as an attorney sets `clients.org_id = auth.current_org_id()`
- [ ] `readonly` member can view clients but cannot create or edit them

### Migration
- [ ] User with pre-existing cases (no `org_id`) signs in → cases are backfilled with their personal `org_id` within one auth session
- [ ] User accepts an invitation to a firm → their pre-existing solo cases are backfilled with the firm's `org_id`

### Admin Dashboard
- [ ] Usage stats show correct case count for the current calendar month
- [ ] Seat usage progress bar reflects accurate active member count vs. seat limit
- [ ] Plan name and renewal date display correctly
- [ ] [Manage Billing →] link opens in a new tab

### Plan & Billing Tab
- [ ] Solo plan: `seat_limit = 1`; Team plan: `seat_limit = 5`; Firm plan: `seat_limit = 15`
- [ ] Upgrading plan updates `organizations.plan` and `organizations.seat_limit`
- [ ] Plan information displayed in the billing tab matches `organizations` table values

---

## 9. File Changes Required

| File | Action | Description |
|------|--------|-------------|
| `supabase/migrations/20260301_multi_seat.sql` | Create | All DDL from §2 (tables, indexes, RLS policies, helper functions) |
| `supabase/functions/invite-member/index.ts` | Create | Edge Function from §4.3 |
| `supabase/functions/accept-invitation/index.ts` | Create | Edge Function from §4.4 |
| `supabase/functions/_shared/cors.ts` | Create (if not exists) | CORS headers shared across Edge Functions |
| `src/hooks/useOrganization.ts` | Create | `useOrganization()` hook from §4.1 |
| `src/lib/ensurePersonalOrg.ts` | Create | Auto-org provisioning from §4.2 |
| `src/lib/members.ts` | Create | Member CRUD functions from §4.5 |
| `src/lib/orgUsage.ts` | Create | Usage stats query from §4.6 |
| `src/components/PermissionGate.tsx` | Create | Role-gated wrapper from §4.7 |
| `src/pages/FirmSettings.tsx` | Create | Admin dashboard with Members and Plan tabs (§3.2–3.6) |
| `src/pages/AcceptInvite.tsx` | Create | Accept invitation page (§3.7) |
| `src/App.tsx` | Modify | Add `/settings/firm` and `/accept-invite` routes; call `ensurePersonalOrg()` on auth state change |
| `src/components/TopNav.tsx` | Modify | Show firm name and Firm Settings link for org admins (§3.1) |
| `src/hooks/useAuth.ts` | Modify | Call `ensurePersonalOrg()` after successful sign-in |
