# Organization Model — TaxKlaro

**Wave:** 4 (Platform Layer)
**Status:** COMPLETE
**Date:** 2026-03-06
**Depends on:** supabase-migrations, supabase-auth-flow, frontend-state-management

---

## Summary

TaxKlaro uses an organization-first data model where every user belongs to at least one organization. This document specifies: the org data model (tables defined in `001_initial_schema.sql`), roles and permissions, plan tiers mapped to org features, the `useOrganization()` hook, post-signup onboarding, and team invitation flow.

**Key adaptation from the old spec:** The old spec used server-side API gating (Redis-backed rate limits, Express middleware). The new stack has no API server — all computation runs client-side in WASM. Gating is split:
- **Data access gating**: Supabase RLS policies (already defined in `002_rls_policies.sql`)
- **Feature gating**: Application-level checks in the `useOrganization()` hook
- **Computation gating**: Client-side enforcement in the wizard (CWT entry limits, save limits)
- **Rate limiting**: Not applicable for WASM computation (runs locally); only applicable for Supabase RPC calls, which are handled by Supabase's built-in rate limiting

---

## 1. Database Schema (defined in `001_initial_schema.sql`)

Tables already specified in `analysis/supabase-migrations.md`. Summary:

| Table | Purpose |
|-------|---------|
| `organizations` | Top-level org entity with plan and seat limit |
| `organization_members` | Join table: user ↔ org with role |
| `organization_invitations` | Email invites with 7-day expiry tokens |
| `user_profiles` | Extended user data (firm name, logo, TIN for PDF export) |

### Plan Enum Values

```sql
CREATE TYPE org_plan AS ENUM ('free', 'pro', 'enterprise');
```

### Role Enum Values

```sql
CREATE TYPE org_role AS ENUM ('admin', 'accountant', 'staff', 'readonly');
```

### Seat Limits Per Plan

| Plan | Default seat_limit | Who can change it |
|------|--------------------|-------------------|
| `free` | 1 | Not upgradeable (requires plan change) |
| `pro` | 1 | Not upgradeable (single-user plan) |
| `enterprise` | 20 (configurable) | Admin can request increase via support |

---

## 2. Role Permissions

| Permission | `readonly` | `staff` | `accountant` | `admin` |
|-----------|-----------|---------|--------------|---------|
| View computations (own) | — | ✓ | ✓ | ✓ |
| View computations (all org) | — | — | ✓ | ✓ |
| Create/edit computations | — | ✓ | ✓ | ✓ |
| Delete computations | — | — | ✓ | ✓ |
| View clients | — | ✓ | ✓ | ✓ |
| Create/edit clients | — | ✓ | ✓ | ✓ |
| Delete clients | — | — | ✓ | ✓ |
| Invite team members | — | — | — | ✓ |
| Remove team members | — | — | — | ✓ |
| Change member roles | — | — | — | ✓ |
| Update firm profile | — | — | — | ✓ |
| Change plan | — | — | — | ✓ |
| Generate PDF exports | — | — | ✓ | ✓ |

**Note:** RLS policies enforce org-level access. Role-level checks (e.g., only accountants can delete) are enforced at the application level in route `beforeLoad` guards and component-level checks.

---

## 3. Plan Feature Gating

The old spec had server-side gating codes (`ERR_REQUIRES_PRO`, `ERR_REQUIRES_ENTERPRISE`). In the new stack, gating is enforced at two levels:

### 3.1 RLS-Level Gating (Supabase enforces this automatically)

| Feature | RLS Rule |
|---------|----------|
| Access computations | `org_id IN (SELECT user_org_ids())` — only org members can see |
| Access clients | `org_id IN (SELECT user_org_ids())` |
| Org admin operations | Role = 'admin' check in RPC functions |

### 3.2 Application-Level Gating (Checked in `useOrganization()` hook)

The hook exposes a `can(feature)` method that returns `boolean`:

```typescript
// Feature gates
type OrgFeature =
  | 'save_computation'       // FREE: 10/month, PRO/ENTERPRISE: unlimited
  | 'view_full_history'      // PRO/ENTERPRISE only (FREE: last 3)
  | 'filter_history'         // PRO/ENTERPRISE only
  | 'year_comparison'        // PRO/ENTERPRISE only
  | 'pdf_export'             // PRO/ENTERPRISE only
  | 'share_link_30days'      // PRO only
  | 'share_link_365days'     // ENTERPRISE only
  | 'quarterly_dashboard'    // PRO/ENTERPRISE only
  | 'cwt_50_entries'         // PRO: max 50 CWT entries
  | 'cwt_unlimited'          // ENTERPRISE: unlimited CWT entries
  | 'persistent_cwt'         // PRO/ENTERPRISE: saved CWT manager
  | 'client_management'      // ENTERPRISE only
  | 'batch_computation'      // ENTERPRISE only
  | 'white_label_pdf'        // ENTERPRISE only
  | 'multi_seat'             // ENTERPRISE only
  | 'invite_members'         // ENTERPRISE only (admin role)
  | 'deadline_1day_reminder' // PRO/ENTERPRISE only
```

### 3.3 Plan-to-Feature Mapping

```typescript
const PLAN_FEATURES: Record<OrgPlan, OrgFeature[]> = {
  free: [
    'save_computation',        // limited to 10/month
  ],
  pro: [
    'save_computation',
    'view_full_history',
    'filter_history',
    'year_comparison',
    'pdf_export',
    'share_link_30days',
    'quarterly_dashboard',
    'cwt_50_entries',
    'persistent_cwt',
    'deadline_1day_reminder',
  ],
  enterprise: [
    'save_computation',
    'view_full_history',
    'filter_history',
    'year_comparison',
    'pdf_export',
    'share_link_30days',
    'share_link_365days',
    'quarterly_dashboard',
    'cwt_50_entries',
    'cwt_unlimited',
    'persistent_cwt',
    'client_management',
    'batch_computation',
    'white_label_pdf',
    'multi_seat',
    'invite_members',
    'deadline_1day_reminder',
  ],
};
```

### 3.4 Monthly Save Cap (FREE Plan)

The FREE plan allows 10 saves/month. This is tracked via a DB query:

```typescript
// Called before saving a computation on FREE plan
async function checkSaveLimit(orgId: string): Promise<{ allowed: boolean; count: number }> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from('computations')
    .select('id', { count: 'exact' })
    .eq('org_id', orgId)
    .gte('created_at', startOfMonth.toISOString())
    .is('deleted_at', null);

  return { allowed: (count ?? 0) < 10, count: count ?? 0 };
}
```

---

## 4. `useOrganization()` Hook

### 4.1 Return Type

```typescript
// src/hooks/useOrganization.ts

interface OrgMember {
  id: string;
  userId: string;
  email: string;
  fullName: string | null;
  role: OrgRole;
  joinedAt: string;
}

interface OrgInvitation {
  id: string;
  email: string;
  role: OrgRole;
  status: InvitationStatus;
  invitedBy: string;
  expiresAt: string;
  createdAt: string;
}

interface UseOrganizationReturn {
  // Current org data
  org: Organization | null;
  members: OrgMember[];
  invitations: OrgInvitation[];   // pending only; admin-only view
  loading: boolean;
  error: string | null;

  // Current user's role in the org
  currentRole: OrgRole | null;

  // Feature gating
  plan: OrgPlan;
  can: (feature: OrgFeature) => boolean;
  saveCount: number;              // current month save count (FREE plan)
  saveLimit: number;              // 10 for FREE, Infinity for PRO/ENTERPRISE

  // Actions
  updateOrgProfile: (data: UpdateOrgProfileInput) => Promise<void>;
  inviteMember: (email: string, role: OrgRole) => Promise<void>;
  revokeInvitation: (invitationId: string) => Promise<void>;
  removeMember: (userId: string) => Promise<void>;
  changeMemberRole: (userId: string, role: OrgRole) => Promise<void>;
  refetch: () => Promise<void>;
}
```

### 4.2 Implementation

```typescript
// src/hooks/useOrganization.ts

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { OrgRole, OrgPlan, OrgFeature } from '@/types/org';

export function useOrganization(): UseOrganizationReturn {
  const { user } = useAuth();
  const [org, setOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [invitations, setInvitations] = useState<OrgInvitation[]>([]);
  const [currentRole, setCurrentRole] = useState<OrgRole | null>(null);
  const [saveCount, setSaveCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrg = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Get the user's org membership (first org, alphabetically by name)
      const { data: membership, error: memberErr } = await supabase
        .from('organization_members')
        .select(`
          role,
          organizations (
            id, name, slug, plan, seat_limit, created_at, updated_at
          )
        `)
        .eq('user_id', user.id)
        .order('joined_at', { ascending: true })
        .limit(1)
        .single();

      if (memberErr) throw memberErr;
      if (!membership) throw new Error('No organization found');

      const orgData = membership.organizations as Organization;
      setOrg(orgData);
      setCurrentRole(membership.role as OrgRole);

      // 2. Load all members
      const { data: membersData, error: membersErr } = await supabase
        .from('organization_members')
        .select(`
          id,
          user_id,
          role,
          joined_at,
          user_profiles (email, full_name)
        `)
        .eq('org_id', orgData.id);

      if (membersErr) throw membersErr;
      setMembers((membersData ?? []).map((m: any) => ({
        id: m.id,
        userId: m.user_id,
        email: m.user_profiles?.email ?? '',
        fullName: m.user_profiles?.full_name ?? null,
        role: m.role,
        joinedAt: m.joined_at,
      })));

      // 3. Load pending invitations (admin only)
      if (membership.role === 'admin') {
        const { data: invData } = await supabase
          .from('organization_invitations')
          .select('*')
          .eq('org_id', orgData.id)
          .eq('status', 'pending');
        setInvitations(invData ?? []);
      }

      // 4. Load save count for FREE plan
      if (orgData.plan === 'free') {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const { count } = await supabase
          .from('computations')
          .select('id', { count: 'exact', head: true })
          .eq('org_id', orgData.id)
          .gte('created_at', startOfMonth.toISOString())
          .is('deleted_at', null);
        setSaveCount(count ?? 0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load organization');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOrg();
  }, [fetchOrg]);

  const plan: OrgPlan = (org?.plan as OrgPlan) ?? 'free';

  const can = useCallback((feature: OrgFeature): boolean => {
    if (!org) return false;
    // Admin role required for certain features regardless of plan
    if (feature === 'invite_members' && currentRole !== 'admin') return false;
    return PLAN_FEATURES[plan]?.includes(feature) ?? false;
  }, [org, plan, currentRole]);

  const inviteMember = async (email: string, role: OrgRole) => {
    if (!org) throw new Error('No organization');
    const { error } = await supabase
      .from('organization_invitations')
      .insert({
        org_id: org.id,
        email,
        role,
        invited_by: user!.id,
      });
    if (error) throw error;
    await fetchOrg();
    // Note: Email is sent via Supabase Edge Function (see supabase-migrations.md §RPC)
  };

  const revokeInvitation = async (invitationId: string) => {
    const { error } = await supabase
      .from('organization_invitations')
      .update({ status: 'revoked' })
      .eq('id', invitationId)
      .eq('org_id', org!.id);
    if (error) throw error;
    await fetchOrg();
  };

  const removeMember = async (userId: string) => {
    const { error } = await supabase
      .from('organization_members')
      .delete()
      .eq('user_id', userId)
      .eq('org_id', org!.id);
    if (error) throw error;
    await fetchOrg();
  };

  const changeMemberRole = async (userId: string, role: OrgRole) => {
    const { error } = await supabase
      .from('organization_members')
      .update({ role })
      .eq('user_id', userId)
      .eq('org_id', org!.id);
    if (error) throw error;
    await fetchOrg();
  };

  const updateOrgProfile = async (data: UpdateOrgProfileInput) => {
    const { error } = await supabase
      .from('organizations')
      .update(data)
      .eq('id', org!.id);
    if (error) throw error;
    await fetchOrg();
  };

  return {
    org,
    members,
    invitations,
    loading,
    error,
    currentRole,
    plan,
    can,
    saveCount,
    saveLimit: plan === 'free' ? 10 : Infinity,
    updateOrgProfile,
    inviteMember,
    revokeInvitation,
    removeMember,
    changeMemberRole,
    refetch: fetchOrg,
  };
}
```

---

## 5. Supporting Types

```typescript
// src/types/org.ts

export type OrgPlan = 'free' | 'pro' | 'enterprise';
export type OrgRole = 'admin' | 'accountant' | 'staff' | 'readonly';
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

export type OrgFeature =
  | 'save_computation'
  | 'view_full_history'
  | 'filter_history'
  | 'year_comparison'
  | 'pdf_export'
  | 'share_link_30days'
  | 'share_link_365days'
  | 'quarterly_dashboard'
  | 'cwt_50_entries'
  | 'cwt_unlimited'
  | 'persistent_cwt'
  | 'client_management'
  | 'batch_computation'
  | 'white_label_pdf'
  | 'multi_seat'
  | 'invite_members'
  | 'deadline_1day_reminder';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: OrgPlan;
  seatLimit: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateOrgProfileInput {
  name?: string;
  slug?: string;
}
```

---

## 6. Onboarding Flow (Post-Signup)

After email confirmation, new users land on `/onboarding`. This route creates their first organization.

### Route: `routes/onboarding.tsx`

```typescript
// Guarded by: user authenticated + no existing org membership
// beforeLoad: redirect to /computations if user already has an org

function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'firm-name' | 'done'>('firm-name');
  const [firmName, setFirmName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateOrg = async () => {
    if (!firmName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      // Slug: lowercase, spaces -> hyphens, max 50 chars
      const slug = firmName.toLowerCase().replace(/\s+/g, '-').slice(0, 50);
      const { error } = await supabase.rpc('create_organization', {
        p_name: firmName.trim(),
        p_slug: slug,
      });
      if (error) throw error;
      navigate({ to: '/computations' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create organization');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md p-8">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome to TaxKlaro</CardTitle>
          <CardDescription>
            Set up your firm profile to get started.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="firm-name">Firm or Practice Name</Label>
            <Input
              id="firm-name"
              value={firmName}
              onChange={(e) => setFirmName(e.target.value)}
              placeholder="Dela Cruz & Associates"
              maxLength={100}
              data-testid="firm-name-input"
            />
            <p className="text-sm text-muted-foreground">
              This appears on your PDF exports and client communications.
            </p>
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            onClick={handleCreateOrg}
            disabled={!firmName.trim() || loading}
            data-testid="create-org-button"
          >
            {loading ? 'Creating...' : 'Continue'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
```

### Onboarding `beforeLoad` Guard

```typescript
// In routes/onboarding.tsx
export const Route = createFileRoute('/onboarding')({
  beforeLoad: async ({ context }) => {
    const { user } = context.auth;
    if (!user) throw redirect({ to: '/auth' });
    // Check if org already exists
    const { data } = await supabase
      .from('organization_members')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);
    if (data && data.length > 0) {
      throw redirect({ to: '/computations' });
    }
  },
});
```

---

## 7. Team Invitation Flow

### 7.1 Sending an Invitation

From `/settings/team`, admin clicks "Invite Member":

1. Admin fills email + role in InviteDialog
2. `useOrganization().inviteMember(email, role)` is called
3. Record inserted to `organization_invitations` with `status = 'pending'`, `expires_at = now() + 7 days`
4. Supabase Edge Function `send-invitation-email` is triggered (see note below)
5. Invitation appears in pending list immediately

**Note on email sending:** Supabase Edge Functions are out of scope for the WASM+Supabase stack. Invitation emails are sent via a Supabase Database Webhook → Edge Function:
- Edge Function: `supabase/functions/send-invitation-email/index.ts`
- Trigger: `INSERT` on `organization_invitations`
- Email service: Resend (API key stored as Supabase secret)
- Email body: "You've been invited to join {org_name} on TaxKlaro. [Accept Invitation]({appUrl}/invite/{token})"

### 7.2 Accepting an Invitation

Route: `/invite/$token`

```typescript
// routes/invite/$token.tsx
// Public route — does not require auth

function InvitePage() {
  const { token } = useParams({ from: '/invite/$token' });
  const [status, setStatus] = useState<'loading' | 'pending' | 'success' | 'error' | 'expired'>('loading');
  const [invitation, setInvitation] = useState<OrgInvitation | null>(null);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('organization_invitations')
        .select('*, organizations(name)')
        .eq('token', token)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .single();
      if (error || !data) {
        setStatus('expired');
      } else {
        setInvitation(data);
        setStatus('pending');
      }
    }
    load();
  }, [token]);

  const handleAccept = async () => {
    const { error } = await supabase.rpc('accept_invitation', {
      p_token: token,  // p_token is UUID in the RPC — token from URL is cast server-side
    });
    if (error) {
      setStatus('error');
    } else {
      setStatus('success');
    }
  };

  // Render: loading spinner, expired message, or accept CTA
  // After success: navigate to /computations
}
```

### 7.3 `accept_invitation` RPC (defined in `003_rpc_functions.sql`)

The RPC:
1. Validates the token exists, status = 'pending', not expired
2. Inserts a row into `organization_members`
3. Updates the invitation status to 'accepted', sets `accepted_at`
4. Returns `{ success: boolean, error?: string }`

**Note:** The `p_token` parameter in this RPC is `TEXT` (not UUID) because the token arrives as a URL path segment (string). The RPC queries `WHERE token::TEXT = p_token`. However — cross-referencing with `supabase-migrations.md` — the `token` column is `UUID`. To avoid the UUID=TEXT operator error documented in the lessons, the RPC should either:
- Cast inside the RPC: `WHERE token = p_token::UUID`
- Or declare p_token as UUID: `p_token UUID`

**Resolution:** Declare `p_token UUID` and cast at the JavaScript call site: `supabase.rpc('accept_invitation', { p_token: token as string })` — Supabase client sends it as a string but PostgreSQL coerces to UUID. The RPC is already defined with `p_token UUID` in `003_rpc_functions.sql`.

---

## 8. Router Context Integration

The `useOrganization()` hook is called inside authenticated routes. It is **not** placed in router context (unlike auth state) because it requires a Supabase query and should only run when the user is authenticated.

Pattern:
```typescript
// routes/__authenticated.tsx (layout route wrapping all auth-required routes)
function AuthenticatedLayout() {
  const { auth } = useRouterContext();
  const org = useOrganization();

  if (org.loading) return <FullPageSpinner />;
  if (!org.org) return <Navigate to="/onboarding" />;

  return <OrgContext.Provider value={org}><Outlet /></OrgContext.Provider>;
}
```

Child components access org via:
```typescript
const org = useContext(OrgContext);
// or via a convenience hook:
export function useCurrentOrg() {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error('useCurrentOrg must be used inside AuthenticatedLayout');
  return ctx;
}
```

---

## 9. UpgradePrompt Component

When `can(feature)` returns `false`, the UI shows an UpgradePrompt instead of the gated feature. This is a reusable component:

```typescript
// src/components/UpgradePrompt.tsx
interface UpgradePromptProps {
  feature: string;           // Human-readable feature name, e.g. "PDF export"
  requiredPlan: 'pro' | 'enterprise';
  description?: string;      // Optional one-line description of what the feature does
}

function UpgradePrompt({ feature, requiredPlan, description }: UpgradePromptProps) {
  return (
    <Card className="border-dashed border-amber-300 bg-amber-50">
      <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
        <LockIcon className="h-8 w-8 text-amber-500" />
        <div>
          <p className="font-semibold text-gray-900">{feature} requires {requiredPlan === 'pro' ? 'Pro' : 'Enterprise'}</p>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
        <Button variant="default" asChild>
          <a href="https://taxklaro.ph/pricing" target="_blank" rel="noreferrer">
            Upgrade to {requiredPlan === 'pro' ? 'Pro' : 'Enterprise'}
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
```

---

## 10. FREE Plan History Limitation

When `plan === 'free'` and `!can('view_full_history')`, the computations list:
1. Loads all computations from Supabase (RLS ensures org-scope, no server-side limit needed)
2. Client-side: shows only the 3 most recent computations
3. Below the list, renders: `<FreePlanHistoryBanner totalCount={allComputations.length} />`

```typescript
// src/components/FreePlanHistoryBanner.tsx
function FreePlanHistoryBanner({ totalCount }: { totalCount: number }) {
  if (totalCount <= 3) return null;
  return (
    <Alert className="mt-4 border-amber-300 bg-amber-50">
      <AlertDescription className="flex items-center justify-between">
        <span className="text-sm text-gray-700">
          You have {totalCount} saved computations.{' '}
          <strong>Upgrade to Pro</strong> to see all of them.
        </span>
        <Button size="sm" variant="default" asChild>
          <a href="https://taxklaro.ph/pricing" target="_blank" rel="noreferrer">
            Upgrade to Pro
          </a>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
```

---

## 11. Critical Traps

### Trap 1: Multi-org users
The `useOrganization()` hook fetches the user's FIRST org (by `joined_at ASC`). If a user belongs to multiple orgs, they see only the first. Multi-org switching is not implemented in the initial product — ENTERPRISE users with multiple firms must use separate accounts. Document this limitation explicitly in the UI (`/settings/team`).

### Trap 2: Admin check in RLS vs application
RLS policies allow any org member to INSERT into organization_invitations. The admin-only gate is enforced at the application layer via `can('invite_members')` (which checks `currentRole === 'admin'`). If the application check is bypassed, a non-admin could insert an invitation. To harden: add a Postgres trigger or CHECK constraint that validates the inserting user's role before INSERT.

### Trap 3: Stale org data after role change
If an admin changes another member's role, the affected member's `currentRole` in their `useOrganization()` hook is stale until they refresh. The hook has no real-time subscription. Fix: after any `changeMemberRole` call, invalidate the affected user's session (not feasible from client side). Instead: document that role changes take effect on the next page reload, and add a banner: "Your role was recently updated. [Refresh page]".

### Trap 4: Invitation token as UUID in URL
The invite token is a UUID stored in `organization_invitations.token`. The URL `/invite/550e8400-e29b-41d4-a716-446655440000` contains the UUID as a path segment. The RPC `accept_invitation(p_token UUID)` requires the token to be passed as UUID type. The Supabase JS client sends `.rpc('accept_invitation', { p_token: tokenString })` where `tokenString` is a string. PostgreSQL coerces the string to UUID if it's a valid UUID format. If the token is malformed (not a valid UUID), PostgreSQL throws an error — the route must handle this gracefully with a "Invalid invitation link" message.

### Trap 5: Seat limit enforcement
The `seat_limit` column prevents overstaffed orgs, but RLS doesn't check it. The `accept_invitation` RPC must check seat count before adding a member:
```sql
-- Inside accept_invitation RPC, before INSERT into organization_members:
IF (SELECT COUNT(*) FROM organization_members WHERE org_id = v_org_id) >= (SELECT seat_limit FROM organizations WHERE id = v_org_id) THEN
  RETURN json_build_object('success', false, 'error', 'Organization has reached its seat limit');
END IF;
```
This check is already included in the `accept_invitation` RPC defined in `003_rpc_functions.sql`.

---

## Files Produced for Forward Loop

| File | Purpose |
|------|---------|
| `src/hooks/useOrganization.ts` | Main org hook (see §4.2) |
| `src/types/org.ts` | OrgPlan, OrgRole, OrgFeature, Organization types (see §5) |
| `src/lib/organizations.ts` | Defined in supabase-migrations.md |
| `src/components/UpgradePrompt.tsx` | Gated feature placeholder (see §9) |
| `src/components/FreePlanHistoryBanner.tsx` | FREE plan limit banner (see §10) |
| `src/routes/onboarding.tsx` | Post-signup org creation (see §6) |
| `src/routes/invite/$token.tsx` | Accept invitation route (see §7.2) |
| `supabase/functions/send-invitation-email/index.ts` | Edge function for invite emails |
