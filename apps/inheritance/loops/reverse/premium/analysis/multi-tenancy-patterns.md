# Multi-Tenancy Patterns Analysis

**Aspect:** multi-tenancy-patterns
**Wave:** 1 — Domain Research
**Date:** 2026-02-28

---

## 1. Multi-Tenancy Architecture Models

### Three Core Isolation Models

| Model | Description | Cost | Risk | Recommended for |
|-------|-------------|------|------|-----------------|
| **Shared DB, Shared Schema (Pooled)** | All tenants share tables; `org_id` column + RLS enforces isolation | Lowest | Medium — requires bulletproof RLS | ✅ Our platform |
| **Shared DB, Separate Schema (Semi-Pooled)** | Each tenant has own schema in same DB | Medium | Low — cleaner separation | Hits PG limits at ~5,000 schemas |
| **Dedicated DB per Tenant (Siloed)** | Each tenant gets own database instance | Highest | Lowest | Enterprise/regulated customers only |

### Recommendation: Shared Schema (Pooled) with Supabase RLS

For a PH estate law platform serving solo practitioners and small firms:
- **Shared schema is the right choice.** PH law firms are small (1–15 attorneys); we won't approach the 5,000-schema Postgres limit.
- Supabase's built-in RLS handles the isolation reliably at database level.
- Single codebase, single schema, lower ops overhead.
- Supabase officially supports and recommends this pattern for B2B SaaS.

**Key insight from research:** Schema-per-tenant is only needed when tenants require completely isolated migrations, PITR, or regulatory separation. PH estate law firms have no such compliance mandates.

---

## 2. Organization/Firm Table Schema

### Core Tables

```sql
-- organizations (law firms)
CREATE TABLE organizations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,                    -- "Santos & Reyes Law Office"
  slug          TEXT UNIQUE,                      -- "santos-reyes" (for URLs)
  plan          TEXT NOT NULL DEFAULT 'solo',     -- 'solo' | 'team' | 'firm'
  seat_limit    INTEGER NOT NULL DEFAULT 1,
  billing_email TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- organization members (join table: user ↔ org)
CREATE TABLE organization_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'attorney',   -- 'admin' | 'attorney' | 'paralegal' | 'readonly'
  invited_by  UUID REFERENCES auth.users(id),
  joined_at   TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);

-- org invitations (pending, before user accepts)
CREATE TABLE organization_invitations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'attorney',
  token       TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::TEXT,
  invited_by  UUID NOT NULL REFERENCES auth.users(id),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '48 hours'),
  accepted_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, email)
);

-- indexes
CREATE INDEX idx_org_members_org_id   ON organization_members(org_id);
CREATE INDEX idx_org_members_user_id  ON organization_members(user_id);
CREATE INDEX idx_org_invitations_token ON organization_invitations(token);
CREATE INDEX idx_org_invitations_email ON organization_invitations(email);
```

### Adding org_id to All Resource Tables

Every resource table gets an `org_id` column:

```sql
-- Example: cases table with org scope
ALTER TABLE cases ADD COLUMN org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX idx_cases_org_id ON cases(org_id);

-- Example: clients table with org scope
ALTER TABLE clients ADD COLUMN org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX idx_clients_org_id ON clients(org_id);
```

The `org_id` is the RLS anchor — every SELECT/INSERT/UPDATE/DELETE filters on this.

---

## 3. User Roles and Permission Matrix

### Role Definitions

| Role | Description | PH Law Firm Equivalent |
|------|-------------|------------------------|
| `admin` | Full access; manages members, billing, firm settings | Managing partner / firm owner |
| `attorney` | Full case CRUD, client CRUD, can export and generate PDFs | Associate attorney, counsel |
| `paralegal` | Read + create cases, no firm settings, no billing | Paralegal, legal assistant |
| `readonly` | View only, no create/edit/delete | Accounting, administrative staff |

### Permission Matrix

| Action | admin | attorney | paralegal | readonly |
|--------|-------|----------|-----------|---------|
| View cases (org-scoped) | ✅ | ✅ | ✅ | ✅ |
| Create new case | ✅ | ✅ | ✅ | ❌ |
| Edit case inputs | ✅ | ✅ | ✅ | ❌ |
| Delete case | ✅ | ✅ | ❌ | ❌ |
| Finalize / archive case | ✅ | ✅ | ❌ | ❌ |
| View clients | ✅ | ✅ | ✅ | ✅ |
| Create client | ✅ | ✅ | ✅ | ❌ |
| Edit client | ✅ | ✅ | ✅ | ❌ |
| Delete client | ✅ | ✅ | ❌ | ❌ |
| Export PDF | ✅ | ✅ | ✅ | ✅ |
| Add case notes | ✅ | ✅ | ✅ | ❌ |
| Share case link | ✅ | ✅ | ❌ | ❌ |
| Manage org members | ✅ | ❌ | ❌ | ❌ |
| Invite members | ✅ | ❌ | ❌ | ❌ |
| Update firm settings (branding) | ✅ | ❌ | ❌ | ❌ |
| View/manage billing | ✅ | ❌ | ❌ | ❌ |
| View usage stats | ✅ | ❌ | ❌ | ❌ |

**Key PH legal ethics consideration:** Philippine Bar rules require conflict-of-interest checks before representation. The platform should scope all client search to the firm's `org_id` so conflict screening covers the full firm, not just the individual attorney's cases.

---

## 4. RLS Policies for Firm-Scoped Access

### Helper Function: Get Current User's Org ID

```sql
-- Returns the org_id for the currently authenticated user
-- (assumes single-org membership; multi-org requires a different approach)
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
```

### RLS Policies on Cases Table

```sql
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;

-- SELECT: any org member can see org's cases
CREATE POLICY cases_select ON cases
  FOR SELECT USING (
    org_id = auth.current_org_id()
    OR created_by = auth.uid()  -- solo (no org) users see their own cases
  );

-- INSERT: attorney+ can create cases within their org
CREATE POLICY cases_insert ON cases
  FOR INSERT WITH CHECK (
    org_id = auth.current_org_id()
    AND auth.current_org_role() IN ('admin', 'attorney', 'paralegal')
  );

-- UPDATE: attorney+ can update; readonly cannot
CREATE POLICY cases_update ON cases
  FOR UPDATE USING (
    org_id = auth.current_org_id()
    AND auth.current_org_role() IN ('admin', 'attorney', 'paralegal')
  );

-- DELETE: admin and attorney can delete
CREATE POLICY cases_delete ON cases
  FOR DELETE USING (
    org_id = auth.current_org_id()
    AND auth.current_org_role() IN ('admin', 'attorney')
  );
```

### RLS Policies on Organization Members Table

```sql
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Members can see their own org's members
CREATE POLICY org_members_select ON organization_members
  FOR SELECT USING (org_id = auth.current_org_id());

-- Only admins can insert/update/delete members
CREATE POLICY org_members_admin_write ON organization_members
  FOR ALL USING (
    org_id = auth.current_org_id()
    AND auth.current_org_role() = 'admin'
  );
```

### Critical Security Notes

1. **Never trust `org_id` from the client.** RLS derives `org_id` from `auth.uid()` via `organization_members` table. Client cannot forge it.
2. **PgBouncer transaction mode breaks `SET app.current_tenant`.** Use Supabase's built-in session management or session mode pooling.
3. **Use `SECURITY DEFINER` on helper functions** so they run as the defining user and bypass caller-level RLS on the `organization_members` table itself.
4. **Add composite indexes:** `(org_id, created_at)` on cases for dashboard queries; `(org_id, user_id)` on members.

---

## 5. Invitation Flow

### Flow Description

```
Admin UI                    Supabase Edge Fn           Email Service
   │                              │                          │
   │── POST /api/invite ─────────►│                          │
   │   { email, role, org_id }    │                          │
   │                              │── INSERT organization_   │
   │                              │   invitations row        │
   │                              │── supabase.auth.admin.   │
   │                              │   inviteUserByEmail()   ─┤
   │                              │                          │── Send email with
   │                              │                          │   magic link + token
   │◄── { status: "invited" } ───│                          │
   │                              │                          │
   │                        [User clicks email link]         │
   │                              │                          │
   │                    POST /api/invite/accept              │
   │                    { token }                            │
   │                              │── Verify token not expired
   │                              │── INSERT organization_members
   │                              │   { org_id, user_id, role }
   │                              │── UPDATE organization_invitations
   │                              │   SET accepted_at = NOW()
   │                              │── Redirect to app
```

### Edge Function: `invite-member`

```typescript
// supabase/functions/invite-member/index.ts
import { createClient } from "@supabase/supabase-js";

Deno.serve(async (req) => {
  const { email, role, org_id } = await req.json();
  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")! // bypasses RLS
  );

  // Verify requester is admin of org
  const { data: { user } } = await adminClient.auth.getUser(
    req.headers.get("Authorization")!.replace("Bearer ", "")
  );
  const { data: membership } = await adminClient
    .from("organization_members")
    .select("role")
    .eq("org_id", org_id)
    .eq("user_id", user!.id)
    .single();

  if (membership?.role !== "admin") {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  }

  // Create invitation record
  const { data: invite } = await adminClient
    .from("organization_invitations")
    .insert({ org_id, email, role, invited_by: user!.id })
    .select()
    .single();

  // Send Supabase invite email (creates user or sends magic link)
  await adminClient.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${Deno.env.get("APP_URL")}/accept-invite?token=${invite.token}`
  });

  return new Response(JSON.stringify({ status: "invited" }), { status: 200 });
});
```

### Accept Invitation Flow

```typescript
// On the /accept-invite page after Supabase auth redirect
async function acceptInvitation(token: string, supabase: SupabaseClient) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Call accept edge function (uses service role to insert member)
  const response = await fetch("/api/invite/accept", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session!.access_token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ token })
  });

  if (!response.ok) throw new Error("Invalid or expired invitation");
  // Redirect to dashboard
  window.location.href = "/dashboard";
}
```

---

## 6. Shared Client Pool Design

### Option A: Firm-Wide Shared Pool (Recommended)

All attorneys at a firm can see all clients. This mirrors how real PH law firms work — clients belong to the firm, not individual attorneys. Conflict screening requires firm-wide visibility.

```sql
-- clients.org_id = the firm
-- All members of the org can see all clients (per RLS)
-- creator_id tracks who created the client record for audit
```

**Pro:** Enables conflict-of-interest screening across all firm members.
**Pro:** Clients can have cases handled by different attorneys over time.
**Con:** Junior staff can see all clients (mitigated by readonly role).

### Option B: Attorney-Scoped Pool (Not Recommended)

Clients scoped to creating attorney. Firm-wide visibility requires admin.

**Rejected because:** PH bar ethics require firm-level conflict screening, not individual attorney-level.

### Shared Pool RLS

```sql
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY clients_org_member ON clients
  FOR ALL USING (org_id = auth.current_org_id());
```

---

## 7. Billing Models

### Market Benchmarks (2025)

| Product | Model | Price |
|---------|-------|-------|
| Clio Starter | Per seat/month | $39–$49/user/mo |
| Clio Essentials | Per seat/month | $79/user/mo |
| MyCase Basic | Per seat/month | $39–$49/user/mo |
| MyCase Advanced | Per seat/month | $79–$89/user/mo |
| PracticePanther Solo | Per seat/month | $49–$59/user/mo |
| PracticePanther Essential | Per seat/month | $69–$79/user/mo |

### Recommended Pricing Structure for PH Market

PH is a price-sensitive market. Clio-level pricing ($49/user) may be too high for solo practitioners. Consider:

```
Plan        │ Price (PHP/mo)  │ USD Equivalent  │ Seats  │ Features
────────────┼─────────────────┼─────────────────┼────────┼──────────────────────
Solo        │ ₱999/mo         │ ~$17            │ 1      │ All core features, PDF export,
            │                 │                 │        │ 50 cases/mo
Team        │ ₱1,999/mo       │ ~$34            │ Up to 5│ All + Client CRM, Case notes,
            │                 │                 │        │ Firm branding, unlimited cases
Firm        │ ₱3,999/mo       │ ~$68            │ Up to 15│ All + Multi-seat, Admin dashboard,
            │                 │                 │        │ Shareable links, Priority support
Enterprise  │ Custom          │ Custom          │ 15+    │ Custom SLA, dedicated support
```

**Rationale:**
- PHP pricing removes currency friction for PH lawyers
- Solo tier at ₱999 is affordable for fresh bar passers / solo practitioners
- Per-case pricing (e.g., ₱100/case) is alternative but harder to budget
- Flat monthly seat pricing is simplest for small firms
- Annual billing discount: 2 months free (16.7% savings)

### Seat Counting Logic

```sql
-- Check if org has available seats before allowing new case
SELECT
  o.seat_limit,
  COUNT(om.id) AS used_seats
FROM organizations o
JOIN organization_members om ON om.org_id = o.id
WHERE o.id = $1
GROUP BY o.seat_limit;
```

---

## 8. Migration Path: Single-User → Firm Accounts

### Design Principle: Non-Breaking

The platform must continue working for anonymous/solo users who never create an org. Migration to multi-seat is opt-in.

### Migration Strategy

#### Phase 1: Personal Org Auto-Creation (on first login)

When a user first logs in and saves a case, auto-create a personal org:

```typescript
// Called after user signs in
async function ensurePersonalOrg(userId: string, supabase: SupabaseClient) {
  const { data: membership } = await supabase
    .from("organization_members")
    .select("org_id")
    .eq("user_id", userId)
    .single();

  if (!membership) {
    // Create personal org
    const { data: org } = await supabase
      .from("organizations")
      .insert({ name: "My Firm", plan: "solo", seat_limit: 1 })
      .select()
      .single();

    await supabase
      .from("organization_members")
      .insert({ org_id: org.id, user_id: userId, role: "admin" });
  }
}
```

#### Phase 2: Cases Already Saved Without Org

Cases saved before multi-tenancy was introduced have `org_id = NULL`. Migrate on first login:

```sql
-- Backfill: assign existing cases to user's personal org
UPDATE cases
SET org_id = (
  SELECT org_id
  FROM organization_members
  WHERE user_id = cases.created_by
  LIMIT 1
)
WHERE org_id IS NULL AND created_by IS NOT NULL;
```

#### Phase 3: Upgrade to Team Plan

Admin goes to Settings → Firm → Upgrade Plan. Selects Team or Firm tier. Org's `plan` and `seat_limit` are updated. Admin can now invite members.

### Anonymous Users (No Auth)

The calculator must still work without any auth. The RLS policies allow anonymous use by checking:

```sql
-- Anonymous: no org, no user — case stored ephemerally (no DB save)
-- Authenticated solo: org auto-created, cases saved to DB
-- Firm: org with multiple members, all cases shared
```

For anonymous users, no DB insert occurs — the WASM computation runs client-side and results are ephemeral. The "Save Case" button prompts for sign-up.

---

## 9. Admin Dashboard Features

### What Firm Admins Need

```
┌─────────────────────────────────────────────────────┐
│  Santos & Reyes Law Office — Admin Dashboard        │
├─────────────────────────────────────────────────────┤
│  Members                               [Invite +]   │
│  ┌──────────────────────────────────────────────┐   │
│  │ Name           Role        Status   Actions  │   │
│  │ Atty. Santos   Admin       Active   [•••]    │   │
│  │ Atty. Reyes    Attorney    Active   [Edit]   │   │
│  │ Paralegal Cruz Paralegal   Active   [Edit]   │   │
│  │ Juan dela Cruz —           Pending  [Resend] │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  Usage                                              │
│  Cases this month: 23 / Unlimited                   │
│  Active members: 3 / 5                              │
│  Plan: Team (₱1,999/mo) [Upgrade]                  │
│                                                     │
│  Firm Settings → (see spec-firm-branding)           │
│  Billing → (external: Stripe portal)               │
└─────────────────────────────────────────────────────┘
```

---

## 10. Key Implementation Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Multi-tenancy model | Shared schema + RLS | Supabase-native, cost-effective, adequate for PH firm sizes |
| Org discovery | `organization_members` join table | Allows future multi-org membership if needed |
| Role storage | TEXT column in org_members | Simple; avoid Postgres role complexity |
| Role enforcement | RLS helper functions | Database-level, can't be bypassed by app bugs |
| Client scoping | Firm-wide pool | Required for ethical conflict screening |
| Invitation mechanism | `supabase.auth.admin.inviteUserByEmail` + custom token | Standard Supabase pattern + custom org assignment |
| Anonymous users | No org required | Preserves zero-friction calculator experience |
| Pricing model | Seat-based tiered (PHP-denominated) | Matches legal software market; PHP reduces friction |

---

## Sources

- [Multi-Tenant SaaS Architecture: Complete Guide 2025](https://bix-tech.com/multi-tenant-architecture-the-complete-guide-for-modern-saas-and-analytics-platforms-2/)
- [How to Design a Multi-Tenant SaaS Architecture — Clerk](https://clerk.com/blog/how-to-design-multitenant-saas-architecture)
- [SaaS Tenant Isolation Strategies — Medium](https://kodekx-solutions.medium.com/saas-tenant-isolation-database-schema-and-row-level-security-strategies-7337d2159066)
- [Supabase Row Level Security Docs](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Enforcing RLS in Supabase Multi-Tenant Architecture — DEV](https://dev.to/blackie360/-enforcing-row-level-security-in-supabase-a-deep-dive-into-lockins-multi-tenant-architecture-4hd2)
- [Multi-Tenant Applications with RLS on Supabase — Antstack](https://www.antstack.com/blog/multi-tenant-applications-with-rls-on-supabase-postgress/)
- [Supabase inviteUserByEmail Docs](https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail)
- [Role-Based Access Control for Law Firms — National Law Review](https://natlawreview.com/article/why-law-firms-need-role-based-access-control)
- [Roles and Permissions in Clio Manage](https://help.clio.com/hc/en-us/articles/9200279456667-Roles-and-Permissions-in-Clio-Manage)
- [Seat-Based Pricing 101 — Schematic](https://schematichq.com/blog/seat-based-pricing-101-the-classic-saas-model-that-still-works-sometimes)
- [Clio Pricing](https://www.clio.com/pricing/)
- [MyCase Pricing 2025 — SalesTech Scout](https://www.salestechscout.com/article/mycase-pricing-explained-what-you-need-to-know-in-2025)
- [PracticePanther Pricing 2025 — TrustRadius](https://www.trustradius.com/products/practicepanther-law-practice-management/pricing)
- [supabase_rbac community library](https://database.dev/pointsource/supabase_rbac)
