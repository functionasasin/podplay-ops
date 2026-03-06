# Analysis: Organization Model — HR Departments, Members, Roles, Invitations

**Wave:** 5 — Frontend Data Model + UI Design
**Aspect:** org-model
**Date:** 2026-03-06
**Depends on:** database-migrations.md (tables already specified), auth-flow.md, navigation.md, route-table.md

---

## Overview

Organizations represent HR departments or companies that use the app collaboratively. A user can
belong to multiple orgs (switching via the org switcher in the sidebar). Computations and batch
uploads can be scoped to an org, making them visible to all org members.

The database schema (tables, RLS, RPCs) is already specified in `database-migrations.md`. This
file covers:
1. TypeScript interfaces for org entities
2. `useOrganization()` hook — context and API
3. `useOrgMembers()` hook — member list management
4. `useOrgInvitations()` hook — invite management
5. Org settings pages: general, members, invitations, danger zone
6. Org creation flow (modal wizard)
7. Seat limits and enforcement
8. Invitation acceptance flow (link → sign-in/sign-up → join)

---

## 1. TypeScript Interfaces

These match the database columns exactly (via mapper functions defined in `database-migrations.md`).

```typescript
// src/types/org.ts

export type OrgRole = 'owner' | 'admin' | 'member'

export type OrgIndustry =
  | 'manufacturing'
  | 'retail'
  | 'hospitality'
  | 'healthcare'
  | 'finance'
  | 'bpo'
  | 'other'

export interface Organization {
  id: string           // UUID
  name: string         // 2–80 chars
  slug: string         // 2–40 chars, lowercase alphanumeric + hyphens, unique
  industry: OrgIndustry
  createdAt: string    // ISO 8601
  updatedAt: string    // ISO 8601
}

export interface OrgMember {
  id: string           // UUID (membership row id)
  organizationId: string  // UUID
  userId: string       // UUID (auth.users.id)
  role: OrgRole
  joinedAt: string     // ISO 8601
  // Joined from profiles/auth.users for display:
  email?: string       // populated when fetching member list
  fullName?: string    // populated when fetching member list
}

export interface OrgInvitation {
  id: string           // UUID
  organizationId: string  // UUID
  invitedBy: string    // UUID (user_id of sender)
  email: string        // invitee email
  role: 'admin' | 'member'  // NOT 'owner'
  token: string        // UUID — used in invitation link
  expiresAt: string    // ISO 8601
  createdAt: string    // ISO 8601
}

// What the Supabase query returns for member list (join with user profiles)
export interface OrgMemberWithProfile extends OrgMember {
  email: string
  fullName: string
}
```

---

## 2. Seat Limits

Seat limits are enforced **application-side** (not DB-level) to keep migrations simple.

| Plan       | Max members |
|------------|------------|
| Free       | 3          |
| Pro        | 25         |
| Enterprise | Unlimited  |

For MVP, all orgs are on the Free plan (3 members). The seat limit check happens in:
1. `useOrgInvitations().sendInvitation()` — checks current member count + pending invitation count
2. `OrgMembersPage` — disables the "Invite member" button with tooltip "Upgrade to invite more members" when at limit

**Seat limit enforcement logic:**

```typescript
// src/lib/org-limits.ts

export const ORG_SEAT_LIMIT = 3  // Free plan

export function isAtSeatLimit(memberCount: number, pendingInviteCount: number): boolean {
  return memberCount + pendingInviteCount >= ORG_SEAT_LIMIT
}
```

---

## 3. `OrgContext` and `useOrganization()` Hook

### File: `src/contexts/OrgContext.tsx`

The active org is stored in `localStorage` under the key `retirement_pay_active_org_id`. When the
user switches orgs, the stored value updates and the context re-fetches.

```typescript
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { toOrganization, toOrgMember } from '@/lib/mappers'
import type { Organization, OrgMember, OrgRole } from '@/types/org'
import { useAuth } from '@/contexts/AuthContext'

const ACTIVE_ORG_KEY = 'retirement_pay_active_org_id'

interface OrgContextValue {
  // Current active org (null = personal/no org selected)
  activeOrg: Organization | null
  // All orgs the current user belongs to
  userOrgs: Organization[]
  // Current user's role in activeOrg (null if no active org)
  currentUserRole: OrgRole | null
  // Loading state for initial fetch
  loading: boolean
  // Switch to a different org (null = personal)
  switchOrg: (orgId: string | null) => void
  // Refresh org list (call after create/leave/delete)
  refreshOrgs: () => Promise<void>
}

const OrgContext = createContext<OrgContextValue | null>(null)

export function OrgProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [userOrgs, setUserOrgs] = useState<Organization[]>([])
  const [activeOrgId, setActiveOrgId] = useState<string | null>(() =>
    localStorage.getItem(ACTIVE_ORG_KEY)
  )
  const [membershipMap, setMembershipMap] = useState<Map<string, OrgMember>>(new Map())
  const [loading, setLoading] = useState(true)

  const fetchUserOrgs = useCallback(async () => {
    if (!user) {
      setUserOrgs([])
      setMembershipMap(new Map())
      setLoading(false)
      return
    }

    // Fetch all orgs the user belongs to, including their role
    const { data, error } = await supabase
      .from('organization_members')
      .select(`
        id,
        organization_id,
        user_id,
        role,
        joined_at,
        organizations (
          id,
          name,
          slug,
          industry,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', user.id)

    if (error || !data) {
      setUserOrgs([])
      setLoading(false)
      return
    }

    const orgs: Organization[] = []
    const map = new Map<string, OrgMember>()

    for (const row of data) {
      if (row.organizations) {
        const org = toOrganization(row.organizations as any)
        orgs.push(org)
        map.set(org.id, toOrgMember({
          id: row.id,
          organization_id: row.organization_id,
          user_id: row.user_id,
          role: row.role,
          joined_at: row.joined_at,
        } as any))
      }
    }

    setUserOrgs(orgs)
    setMembershipMap(map)
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchUserOrgs()
  }, [fetchUserOrgs])

  const switchOrg = (orgId: string | null) => {
    setActiveOrgId(orgId)
    if (orgId) {
      localStorage.setItem(ACTIVE_ORG_KEY, orgId)
    } else {
      localStorage.removeItem(ACTIVE_ORG_KEY)
    }
  }

  // If stored active org is no longer in user's list (e.g., they left it), reset to null
  const activeOrg = userOrgs.find(o => o.id === activeOrgId) ?? null

  const currentUserRole = activeOrg
    ? (membershipMap.get(activeOrg.id)?.role ?? null)
    : null

  return (
    <OrgContext.Provider value={{
      activeOrg,
      userOrgs,
      currentUserRole,
      loading,
      switchOrg,
      refreshOrgs: fetchUserOrgs,
    }}>
      {children}
    </OrgContext.Provider>
  )
}

export function useOrganization() {
  const ctx = useContext(OrgContext)
  if (!ctx) throw new Error('useOrganization must be used inside OrgProvider')
  return ctx
}
```

**Provider placement:** `OrgProvider` wraps authenticated routes only. In `src/main.tsx`:

```typescript
ReactDOM.createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <OrgProvider>
      <RouterProvider router={router} />
    </OrgProvider>
  </AuthProvider>
)
```

`OrgProvider` depends on `AuthProvider` (uses `useAuth()`), so it must be nested inside it.

---

## 4. `useOrgMembers()` Hook

### File: `src/hooks/useOrgMembers.ts`

Used by `OrgMembersPage` to list members, change roles, and remove members.

```typescript
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { OrgMemberWithProfile, OrgRole } from '@/types/org'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

export function useOrgMembers(organizationId: string | null) {
  const { user } = useAuth()
  const [members, setMembers] = useState<OrgMemberWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMembers = useCallback(async () => {
    if (!organizationId) {
      setMembers([])
      setLoading(false)
      return
    }

    setLoading(true)
    // Join organization_members with auth.users via user_id
    // Note: Supabase exposes auth.users.email via the members view only to service_role.
    // We use a SECURITY DEFINER RPC to get member profiles instead.
    const { data, error } = await supabase.rpc('get_org_members', {
      p_org_id: organizationId,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setMembers((data ?? []) as OrgMemberWithProfile[])
    setLoading(false)
  }, [organizationId])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  const updateRole = async (memberId: string, newRole: OrgRole) => {
    if (newRole === 'owner') {
      toast.error('Cannot assign owner role via this action.')
      return
    }

    const { error } = await supabase
      .from('organization_members')
      .update({ role: newRole })
      .eq('id', memberId)

    if (error) {
      toast.error('Failed to update role: ' + error.message)
      return
    }

    toast.success('Role updated.')
    await fetchMembers()
  }

  const removeMember = async (memberId: string, targetUserId: string) => {
    // Prevent removing yourself if you are the owner
    if (targetUserId === user?.id) {
      // Self-removal = leaving the org — handled separately by leaveOrg()
      toast.error('Use "Leave organization" to remove yourself.')
      return
    }

    const { error } = await supabase
      .from('organization_members')
      .delete()
      .eq('id', memberId)

    if (error) {
      toast.error('Failed to remove member: ' + error.message)
      return
    }

    toast.success('Member removed.')
    await fetchMembers()
  }

  const leaveOrg = async (organizationId: string) => {
    if (!user) return

    const { error } = await supabase
      .from('organization_members')
      .delete()
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)

    if (error) {
      toast.error('Failed to leave organization: ' + error.message)
      return
    }

    toast.success('You have left the organization.')
    // Caller should call refreshOrgs() and switchOrg(null) after this
  }

  return { members, loading, error, updateRole, removeMember, leaveOrg, refresh: fetchMembers }
}
```

### RPC: `get_org_members`

Because `auth.users` is not directly accessible to the `authenticated` role, member emails and
names are fetched via a SECURITY DEFINER function. This must be added to `database-migrations.md`
but is specified here for completeness.

```sql
-- 20240101000009_create_rpc_get_org_members.sql

CREATE OR REPLACE FUNCTION public.get_org_members(
  p_org_id UUID
)
RETURNS TABLE (
  id               UUID,
  organization_id  UUID,
  user_id          UUID,
  role             TEXT,
  joined_at        TIMESTAMPTZ,
  email            TEXT,
  full_name        TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is a member of the org
  IF NOT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = p_org_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: not a member of this organization';
  END IF;

  RETURN QUERY
  SELECT
    om.id,
    om.organization_id,
    om.user_id,
    om.role,
    om.joined_at,
    u.email::TEXT,
    (u.raw_user_meta_data->>'full_name')::TEXT
  FROM public.organization_members om
  JOIN auth.users u ON u.id = om.user_id
  WHERE om.organization_id = p_org_id
  ORDER BY om.joined_at ASC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_org_members(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_org_members(UUID) TO authenticated;
```

**Frontend call:**
```typescript
const { data, error } = await supabase.rpc('get_org_members', { p_org_id: organizationId })
// data: Array<{ id, organization_id, user_id, role, joined_at, email, full_name }>
```

---

## 5. `useOrgInvitations()` Hook

### File: `src/hooks/useOrgInvitations.ts`

```typescript
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { OrgInvitation } from '@/types/org'
import { isAtSeatLimit, ORG_SEAT_LIMIT } from '@/lib/org-limits'
import { toast } from 'sonner'

export function useOrgInvitations(organizationId: string | null, memberCount: number) {
  const [invitations, setInvitations] = useState<OrgInvitation[]>([])
  const [loading, setLoading] = useState(true)

  const fetchInvitations = useCallback(async () => {
    if (!organizationId) {
      setInvitations([])
      setLoading(false)
      return
    }

    setLoading(true)
    const { data, error } = await supabase
      .from('organization_invitations')
      .select('*')
      .eq('organization_id', organizationId)
      .gt('expires_at', new Date().toISOString())  // Only show non-expired
      .order('created_at', { ascending: false })

    if (error) {
      setLoading(false)
      return
    }

    setInvitations((data ?? []).map(row => ({
      id: row.id,
      organizationId: row.organization_id,
      invitedBy: row.invited_by,
      email: row.email,
      role: row.role as 'admin' | 'member',
      token: row.token,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
    })))
    setLoading(false)
  }, [organizationId])

  useEffect(() => {
    fetchInvitations()
  }, [fetchInvitations])

  const sendInvitation = async (email: string, role: 'admin' | 'member') => {
    if (!organizationId) return

    const pendingCount = invitations.length
    if (isAtSeatLimit(memberCount, pendingCount)) {
      toast.error(`Seat limit reached. Free plan allows ${ORG_SEAT_LIMIT} members. Upgrade to invite more.`)
      return
    }

    const { error } = await supabase
      .from('organization_invitations')
      .insert({
        organization_id: organizationId,
        email,
        role,
        invited_by: (await supabase.auth.getUser()).data.user?.id,
      })

    if (error) {
      if (error.code === '23505') {  // unique_violation: email already invited
        toast.error(`${email} already has a pending invitation.`)
      } else {
        toast.error('Failed to send invitation: ' + error.message)
      }
      return
    }

    // In production: a Supabase Edge Function or webhook sends the invitation email.
    // The invitation link format: https://app.domain/org/accept-invite?token={token}
    // In MVP without Edge Functions: show the token link directly in the UI for manual sharing.
    toast.success(`Invitation sent to ${email}.`)
    await fetchInvitations()
  }

  const cancelInvitation = async (invitationId: string) => {
    const { error } = await supabase
      .from('organization_invitations')
      .delete()
      .eq('id', invitationId)

    if (error) {
      toast.error('Failed to cancel invitation: ' + error.message)
      return
    }

    toast.success('Invitation cancelled.')
    await fetchInvitations()
  }

  return { invitations, loading, sendInvitation, cancelInvitation, refresh: fetchInvitations }
}
```

---

## 6. Invitation Acceptance Flow

The invitation link format: `https://retirement-pay.fly.dev/org/accept-invite?token={uuid}`

This route is **unauthenticated** — the user may or may not be signed in.

### Route: `/org/accept-invite`

**File:** `src/routes/org/accept-invite.tsx`

**Logic:**
1. Read `token` from URL search params
2. Fetch invitation record: `SELECT * FROM organization_invitations WHERE token = $1 AND expires_at > NOW()`
3. If not found or expired: show "This invitation is invalid or has expired." error state
4. If found:
   - Show org name + invited role
   - If user is signed in: show "Accept invitation" button
   - If user is not signed in: show "Sign in or create an account to accept this invitation" — sign-in/sign-up forms with the token preserved in URL
5. On acceptance (user authenticated): call `accept_org_invitation(p_token UUID)` RPC

```typescript
// Route: /org/accept-invite (search param: token)
import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useOrganization } from '@/contexts/OrgContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, AlertCircle, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import { Link } from '@tanstack/react-router'

export const Route = createFileRoute('/org/accept-invite')({
  component: AcceptInvitePage,
  validateSearch: (search: Record<string, unknown>) => ({
    token: (search.token as string) ?? '',
  }),
})

interface InvitationDetails {
  orgName: string
  orgId: string
  role: 'admin' | 'member'
  email: string
  expiresAt: string
}

function AcceptInvitePage() {
  const navigate = useNavigate()
  const { token } = useSearch({ from: '/org/accept-invite' })
  const { user } = useAuth()
  const { refreshOrgs, switchOrg } = useOrganization()
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null)
  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'expired' | 'accepted'>('loading')
  const [accepting, setAccepting] = useState(false)

  useEffect(() => {
    if (!token) {
      setStatus('invalid')
      return
    }

    supabase.rpc('get_invitation_details', { p_token: token as any }).then(({ data, error }) => {
      if (error || !data) {
        setStatus('invalid')
        return
      }

      const inv = data as InvitationDetails
      if (new Date(inv.expiresAt) < new Date()) {
        setStatus('expired')
        return
      }

      setInvitation(inv)
      setStatus('valid')
    })
  }, [token])

  const handleAccept = async () => {
    if (!user) return
    setAccepting(true)

    const { error } = await supabase.rpc('accept_org_invitation', { p_token: token as any })

    if (error) {
      toast.error('Failed to accept invitation: ' + error.message)
      setAccepting(false)
      return
    }

    toast.success(`You have joined ${invitation!.orgName}.`)
    await refreshOrgs()
    switchOrg(invitation!.orgId)
    navigate({ to: '/dashboard' })
  }

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-500">Checking invitation...</p>
      </div>
    )
  }

  if (status === 'invalid' || status === 'expired') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
            <h2 className="text-xl font-semibold">
              {status === 'expired' ? 'Invitation expired' : 'Invalid invitation'}
            </h2>
            <p className="text-slate-600">
              {status === 'expired'
                ? 'This invitation link has expired. Ask the org admin to send a new one.'
                : 'This invitation link is invalid or has already been used.'}
            </p>
            <Button asChild variant="outline">
              <Link to="/">Go to home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!invitation) return null

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <Building2 className="mx-auto h-10 w-10 text-blue-600" />
          <CardTitle className="text-xl">You're invited!</CardTitle>
          <CardDescription>
            Join <strong>{invitation.orgName}</strong> as{' '}
            <Badge variant="secondary">{invitation.role}</Badge>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!user ? (
            <Alert>
              <AlertDescription>
                <Link to="/auth/sign-in" search={{ redirect: `/org/accept-invite?token=${token}` }}
                  className="text-blue-600 hover:underline font-medium">
                  Sign in
                </Link>{' '}
                or{' '}
                <Link to="/auth/sign-up" search={{ redirect: `/org/accept-invite?token=${token}` }}
                  className="text-blue-600 hover:underline font-medium">
                  create an account
                </Link>{' '}
                to accept this invitation.
              </AlertDescription>
            </Alert>
          ) : (
            <Button className="w-full" onClick={handleAccept} disabled={accepting}>
              {accepting ? 'Joining...' : `Accept and join ${invitation.orgName}`}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
```

### RPC: `accept_org_invitation`

```sql
-- 20240101000010_create_rpc_accept_org_invitation.sql

CREATE OR REPLACE FUNCTION public.accept_org_invitation(
  p_token UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inv RECORD;
BEGIN
  -- Fetch invitation
  SELECT * INTO v_inv
  FROM public.organization_invitations
  WHERE token = p_token
    AND expires_at > NOW();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found or expired';
  END IF;

  -- Check if already a member
  IF EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = v_inv.organization_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'You are already a member of this organization';
  END IF;

  -- Add member
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (v_inv.organization_id, auth.uid(), v_inv.role);

  -- Delete the invitation (consumed)
  DELETE FROM public.organization_invitations WHERE id = v_inv.id;
END;
$$;

REVOKE ALL ON FUNCTION public.accept_org_invitation(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_org_invitation(UUID) TO authenticated;
```

### RPC: `get_invitation_details`

Public RPC (anon grant) so the accept-invite page can display org name and role without auth.

```sql
-- 20240101000011_create_rpc_get_invitation_details.sql

CREATE OR REPLACE FUNCTION public.get_invitation_details(
  p_token UUID
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
    'orgName',    o.name,
    'orgId',      o.id,
    'role',       i.role,
    'email',      i.email,
    'expiresAt',  i.expires_at
  )
  INTO v_result
  FROM public.organization_invitations i
  JOIN public.organizations o ON o.id = i.organization_id
  WHERE i.token = p_token;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_invitation_details(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_invitation_details(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_invitation_details(UUID) TO authenticated;
```

---

## 7. Org Creation Flow

The org creation flow is a **modal dialog** (not a full-page route) triggered from the org
switcher in the sidebar when the user selects "New organization."

### Component: `CreateOrgDialog`

**File:** `src/components/org/CreateOrgDialog.tsx`

**Fields:**
1. `name` — Text input. 2–80 chars. Required.
2. `slug` — Text input. Auto-generated from `name` (lowercase, spaces→hyphens, strip non-alphanum).
   User can edit. Validated live: `^[a-z0-9-]{2,40}$`. Shows "Already taken" error from RPC.
3. `industry` — Select from `OrgIndustry` values.

**Submit:** Calls `create_organization` RPC. On success, calls `refreshOrgs()`, `switchOrg(newOrgId)`,
closes dialog, shows toast "Organization created."

```typescript
// src/components/org/CreateOrgDialog.tsx
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useOrganization } from '@/contexts/OrgContext'
import { toast } from 'sonner'

const INDUSTRY_LABELS: Record<string, string> = {
  manufacturing: 'Manufacturing',
  retail: 'Retail / Trade',
  hospitality: 'Hospitality / Food Service',
  healthcare: 'Healthcare',
  finance: 'Finance / Banking',
  bpo: 'BPO / IT-BPM',
  other: 'Other',
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40)
}

interface CreateOrgDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateOrgDialog({ open, onOpenChange }: CreateOrgDialogProps) {
  const { refreshOrgs, switchOrg } = useOrganization()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [industry, setIndustry] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleNameChange = (value: string) => {
    setName(value)
    if (!slugManuallyEdited) {
      setSlug(slugify(value))
    }
  }

  const handleSlugChange = (value: string) => {
    setSlug(value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
    setSlugManuallyEdited(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (name.length < 2 || name.length > 80) {
      setError('Organization name must be 2–80 characters.')
      return
    }
    if (!/^[a-z0-9-]{2,40}$/.test(slug)) {
      setError('Slug must be 2–40 lowercase letters, numbers, or hyphens.')
      return
    }
    if (!industry) {
      setError('Select an industry.')
      return
    }

    setLoading(true)
    const { data: orgId, error: rpcError } = await supabase.rpc('create_organization', {
      p_name: name,
      p_slug: slug,
      p_industry: industry,
    })

    setLoading(false)

    if (rpcError) {
      if (rpcError.message.includes('unique') || rpcError.message.includes('slug')) {
        setError('That slug is already taken. Try a different one.')
      } else {
        setError(rpcError.message)
      }
      return
    }

    toast.success(`"${name}" created.`)
    await refreshOrgs()
    switchOrg(orgId as string)
    onOpenChange(false)
    // Reset form
    setName('')
    setSlug('')
    setIndustry('')
    setSlugManuallyEdited(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create organization</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="org-name">Organization name</Label>
            <Input
              id="org-name"
              placeholder="Acme Corp HR"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              maxLength={80}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-slug">URL slug</Label>
            <Input
              id="org-slug"
              placeholder="acme-corp-hr"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              required
              maxLength={40}
              pattern="^[a-z0-9-]{2,40}$"
            />
            <p className="text-xs text-slate-500">
              Lowercase letters, numbers, hyphens only. Must be unique.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-industry">Industry</Label>
            <Select value={industry} onValueChange={setIndustry} required>
              <SelectTrigger id="org-industry">
                <SelectValue placeholder="Select industry" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(INDUSTRY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create organization'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

---

## 8. Org Settings Pages

Route prefix: `/org/settings` (requires auth, requires active org, requires role owner or admin
for most sub-pages)

### Sub-routes:

| Path | Component | Role Required | Purpose |
|------|-----------|--------------|---------|
| `/org/settings` | Redirects to `/org/settings/general` | member | — |
| `/org/settings/general` | `OrgGeneralSettings` | owner | Edit name, industry, slug; delete org |
| `/org/settings/members` | `OrgMembersPage` | member | View members, change roles, remove members |
| `/org/settings/invitations` | `OrgInvitationsPage` | admin, owner | View pending invitations, send new, cancel |

### `OrgGeneralSettings`

**File:** `src/routes/org/settings/general.tsx`

**Sections:**
1. **Name & Industry form** — Pre-filled with current org values. Submit calls `supabase.from('organizations').update(...)`. Only visible to owners. Toast on success/error.
2. **Danger zone** — "Delete organization" button (red, destructive variant). Only visible to owners.
   - Opens a confirmation dialog: type the org name to confirm.
   - On confirm: calls `supabase.from('organizations').delete().eq('id', activeOrg.id)`.
   - On success: `refreshOrgs()`, `switchOrg(null)`, navigate to `/dashboard`, toast "Organization deleted."

```typescript
// Danger zone delete confirmation dialog
// Must type org name exactly to enable Delete button
const [confirmName, setConfirmName] = useState('')
const canDelete = confirmName === activeOrg.name

// Delete call
const { error } = await supabase
  .from('organizations')
  .delete()
  .eq('id', activeOrg.id)
```

### `OrgMembersPage`

**File:** `src/routes/org/settings/members.tsx`

**Layout:** Table with columns: Avatar initials, Name, Email, Role (badge + select for owner/admin),
Joined date, Actions (Remove button for owner/admin viewing non-owner members).

**Behavior:**
- `useOrgMembers(activeOrg.id)` fetches members.
- Current user's row: role select is disabled (cannot demote yourself). No remove button.
- Owner row: role select is disabled for all users (cannot reassign owner). No remove button for the owner (would orphan the org).
- Admin can change member roles and remove members, but cannot change owner's role.
- Owner can change admin roles and remove admins.

**Role badge colors:**
- `owner` → Badge variant `default` (blue)
- `admin` → Badge variant `secondary` (slate)
- `member` → Badge variant `outline`

### `OrgInvitationsPage`

**File:** `src/routes/org/settings/invitations.tsx`

**Sections:**
1. **Invite form** — Email input + role select (admin/member) + "Send invitation" button.
   - Disabled with tooltip "Seat limit reached" when `isAtSeatLimit(members.length, invitations.length)`.
   - On submit: `sendInvitation(email, role)`.
2. **Pending invitations table** — Columns: Email, Role, Expires, Actions (Cancel button).
   - Shows "No pending invitations" empty state when list is empty.
   - Expired invitations are filtered out client-side (`expiresAt > now`).

**Invitation link display (MVP):** Since no Edge Function sends emails in MVP, after `sendInvitation`
succeeds, show an `Alert` with the invitation link for manual sharing:
```
https://retirement-pay.fly.dev/org/accept-invite?token={invitation.token}
```
The link is copyable via a "Copy link" button.

---

## 9. Org Switcher (Sidebar Integration)

The org switcher is part of the sidebar (specified in `navigation.md`). Key behaviors:

**Trigger:** Clicking the org name/avatar in the sidebar header opens a dropdown.

**Dropdown items:**
1. **Personal** — switch to no org (personal computations only). Selected when `activeOrg === null`.
2. **[Org name]** — one item per org in `userOrgs`. Check icon on the active one.
3. **Divider**
4. **Manage organization** — navigates to `/org/settings/general`. Only shows when `activeOrg !== null`.
5. **New organization** — opens `CreateOrgDialog`.

**Component:** `OrgSwitcher`

**File:** `src/components/org/OrgSwitcher.tsx`

```typescript
import { Building2, Check, ChevronsUpDown, Plus, Settings } from 'lucide-react'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { useOrganization } from '@/contexts/OrgContext'
import { useNavigate } from '@tanstack/react-router'
import { CreateOrgDialog } from './CreateOrgDialog'
import { useState } from 'react'

export function OrgSwitcher() {
  const { activeOrg, userOrgs, switchOrg } = useOrganization()
  const navigate = useNavigate()
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="w-full justify-between px-2">
            <div className="flex items-center gap-2 min-w-0">
              <Building2 className="h-4 w-4 shrink-0 text-slate-500" />
              <span className="truncate text-sm font-medium">
                {activeOrg?.name ?? 'Personal'}
              </span>
            </div>
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-slate-400" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuItem onClick={() => switchOrg(null)}>
            <Check className={`mr-2 h-4 w-4 ${activeOrg === null ? 'opacity-100' : 'opacity-0'}`} />
            Personal
          </DropdownMenuItem>
          {userOrgs.map(org => (
            <DropdownMenuItem key={org.id} onClick={() => switchOrg(org.id)}>
              <Check className={`mr-2 h-4 w-4 ${activeOrg?.id === org.id ? 'opacity-100' : 'opacity-0'}`} />
              {org.name}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          {activeOrg && (
            <DropdownMenuItem onClick={() => navigate({ to: '/org/settings/general' })}>
              <Settings className="mr-2 h-4 w-4" />
              Manage organization
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New organization
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <CreateOrgDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  )
}
```

---

## 10. Updated Migration File List

The following RPCs were discovered while specifying the org model. They must be added to the
migration sequence in `database-migrations.md`:

| Migration file | RPC | Grant |
|----------------|-----|-------|
| `20240101000009_create_rpc_get_org_members.sql` | `get_org_members(UUID)` | `authenticated` |
| `20240101000010_create_rpc_accept_org_invitation.sql` | `accept_org_invitation(UUID)` | `authenticated` |
| `20240101000011_create_rpc_get_invitation_details.sql` | `get_invitation_details(UUID)` | `anon`, `authenticated` |

`get_invitation_details` needs `anon` GRANT because `/org/accept-invite` is an unauthenticated
route — the user must be able to see the invitation details before signing in.

---

## 11. Complete Route List for Org Model

| Path | Component | Auth Guard | Role Guard |
|------|-----------|-----------|-----------|
| `/org/accept-invite` | `AcceptInvitePage` | None (public) | None |
| `/org/settings` | Redirect to `/org/settings/general` | Required | member |
| `/org/settings/general` | `OrgGeneralSettings` | Required | owner |
| `/org/settings/members` | `OrgMembersPage` | Required | member |
| `/org/settings/invitations` | `OrgInvitationsPage` | Required | admin, owner |

**Role guard behavior:** If user lacks the required role, redirect to `/org/settings/members`
with an `Alert` banner: "You don't have permission to access this page."

---

## 12. Summary of New Artifacts

| Artifact | File path |
|----------|-----------|
| TypeScript types | `src/types/org.ts` |
| OrgContext + useOrganization | `src/contexts/OrgContext.tsx` |
| useOrgMembers hook | `src/hooks/useOrgMembers.ts` |
| useOrgInvitations hook | `src/hooks/useOrgInvitations.ts` |
| CreateOrgDialog | `src/components/org/CreateOrgDialog.tsx` |
| OrgSwitcher | `src/components/org/OrgSwitcher.tsx` |
| AcceptInvitePage | `src/routes/org/accept-invite.tsx` |
| OrgGeneralSettings | `src/routes/org/settings/general.tsx` |
| OrgMembersPage | `src/routes/org/settings/members.tsx` |
| OrgInvitationsPage | `src/routes/org/settings/invitations.tsx` |
| Seat limit utility | `src/lib/org-limits.ts` |
| RPCs (3 new) | `supabase/migrations/20240101000009–11_*.sql` |
