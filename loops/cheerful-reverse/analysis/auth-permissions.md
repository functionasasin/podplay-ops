# Cheerful Platform — Auth & Permissions Analysis

## 1. Architecture Overview

Cheerful uses **Supabase Auth** as the identity provider, with a **dual-layer** permission model:

1. **Frontend Auth Gate** — Next.js middleware redirects unauthenticated users; Supabase session cookie enforces per-request auth.
2. **Backend API Auth** — FastAPI validates Supabase JWTs on every request via `get_current_user` dependency.
3. **Database-Level RLS** — PostgreSQL Row Level Security enforces data isolation at the database layer, acting as a defense-in-depth backstop.

**No custom roles or ACL database.** Permission enforcement happens through:
- JWT claims (role: `authenticated` vs `service_role`)
- Ownership FK columns (`user_id` on every table)
- Team membership (`team_member` table)
- Campaign assignment (`campaign_member_assignment` table)

---

## 2. Authentication Flow

### 2.1 Sign-In/Sign-Up (Webapp)

**Flow:**
```
User enters email
    → checkEmailExists() → Supabase RPC check_email_exists (service_role)
    → exists? → show password field (sign-in mode)
    → not exists? → show password field (sign-up mode)

Sign-in:
    → validateCSRFFromFormData() [CSRF protection on all form submissions]
    → supabase.auth.signInWithPassword({ email, password })
    → getUser() → check user_onboarding.onboarding_completed
    → redirect: /mail (completed) or /onboarding (new)

Sign-up:
    → validateCSRFFromFormData()
    → supabase.auth.signUp({ email, password, redirectTo: /auth/callback })
    → email verification link sent
    → redirect to /sign-in with success message
```

**Source:** `apps/webapp/app/actions.ts:74-258`

### 2.2 Google OAuth

```
/sign-in → GoogleSignInButton → signInWithGoogle()
    → supabase.auth.signInWithOAuth({ provider: 'google', redirectTo: /auth/callback })
    → Google OAuth consent screen
    → /auth/callback → Supabase exchanges code for session
    → redirect to /mail or /onboarding
```

**Source:** `apps/webapp/app/actions.ts:17-42`

### 2.3 Session Token

Supabase issues a **JWT** with:
- `sub`: user UUID (auth.users.id)
- `email`: user's email address
- `role`: `authenticated` (for regular users) or `service_role` (for service clients)
- `exp`: expiration (60-second leeway allowed)

Two JWT algorithms supported:
- **HS256**: Production (shared secret via `SUPABASE_JWT_SECRET`)
- **ES256**: Newer Supabase CLI (JWKS fetched from `{SUPABASE_URL}/auth/v1/.well-known/jwks.json`)

**Source:** `apps/backend/src/api/dependencies/auth.py:51-115`

### 2.4 Password Reset

```
/forgot-password → resetPasswordForEmail(email, redirectTo: /reset-password)
    → User clicks email link → /reset-password (Supabase magic link)
    → supabase.auth.updateUser({ password }) [updates the authenticated session]
    → Optional: signOut({ scope: 'others' }) to terminate other sessions
```

CSRF-protected at every form submission step.

**Source:** `apps/webapp/app/actions.ts:261-397`

### 2.5 User Invite Flow (Team Members)

When a team owner adds a member by email who doesn't have an account:
```
POST /api/teams/{team_id}/members { user_email: "new@example.com" }
    → lookup AuthUser by email (service_role DB access)
    → not found → supabase.auth.admin.invite_user_by_email(email)
    → Supabase sends invite email with magic link
    → User clicks link → /set-password (set-password action)
    → setPasswordAction() → supabase.auth.updateUser({ password })
    → ensure user_setting exists
    → redirect /onboarding?verified=true
```

**Source:** `apps/backend/src/api/route/team.py:229-312`

---

## 3. Backend API Authentication

### 3.1 User Auth (`get_current_user`)

All protected backend API endpoints declare:
```python
current_user: dict = Depends(get_current_user)
```

The `get_current_user` dependency:
1. Extracts `Authorization: Bearer {token}` header
2. Detects JWT algorithm (ES256 vs HS256) from unverified header
3. Verifies token signature and expiry
4. Extracts `sub` (user_id), `email`, `role` from payload
5. Returns `{"user_id": str, "email": str, "role": str, "payload": dict}`

**Source:** `apps/backend/src/api/dependencies/auth.py:122-171`

### 3.2 Optional User Auth (`get_optional_user`)

Some endpoints accept both authenticated and unauthenticated requests (e.g., webhook callbacks). Uses `get_optional_user` which returns `None` instead of raising 401.

**Source:** `apps/backend/src/api/dependencies/auth.py:174-219`

### 3.3 Service-to-Service Auth

Internal services (context-engine, etc.) authenticate to the backend `/api/service/` prefix via a shared secret:
```python
x_service_api_key: str = Header(alias="X-Service-Api-Key")
# Validated against settings.SERVICE_API_KEY
```

**Source:** `apps/backend/src/api/dependencies/service_auth.py`

### 3.4 Dev-Only Impersonation

In `DEPLOY_ENVIRONMENT == "development"` only:
```
Authorization: Bearer {real_user_token}
X-Impersonate-User: {target_email}
```

The backend looks up `user_gmail_account.user_id` for the target email (must be an active Gmail account), then acts as that user. All impersonation events are logged. Disabled in production — raises 403.

**Source:** `apps/backend/src/api/dependencies/impersonation.py`

---

## 4. Middleware Auth Gate (Next.js)

**File:** `apps/webapp/utils/supabase/middleware.ts`

The Next.js middleware runs on every request and:

1. Creates a Supabase SSR client using the session cookie
2. Calls `supabase.auth.getUser()` to verify the session
3. Forwards `x-cheerful-user` (email) and `x-user-logged-in` headers to downstream handlers

**Protected routes:** `/mail`, `/settings`, `/dashboard`, `/campaigns`
- Unauthenticated → redirect to `/sign-in`

**Onboarding gate:**
- Logged-in + onboarding incomplete → must go through `/onboarding`
- Completed onboarding cached in `onboarding_completed` httpOnly cookie (1-year TTL) to avoid DB query on every request

**Auth page redirects:**
- Logged-in user hits `/sign-in`, `/sign-up`, `/` → redirect to `/mail` (completed) or `/onboarding`

---

## 5. Team & Permission Model

### 5.1 Data Model

```
auth.users (1) ─── owns ──→ team (N)
                              │
                              └─── has ──→ team_member (N)
                                            │ role: 'owner' | 'member'
                                            └─ user_id → auth.users

auth.users (1) ─── owns ──→ campaign (N)
                              │
                              └─── assigned via ──→ campaign_member_assignment (N)
                                                     │
                                                     └─ user_id → auth.users (team member)
```

**Key design decisions:**
- Team owner is also added to `team_member` with `role='owner'` — simplifies "get all members" queries
- Campaign ownership lives on `campaign.user_id` — NOT on the team table
- `campaign_member_assignment` is per-campaign, not per-team — assignments are granular
- No `team_id` on `campaign` table — sharing is determined by `campaign_member_assignment` alone

### 5.2 Roles

| Role | Where | Permissions |
|------|-------|-------------|
| `owner` | team_member.role | Create/delete team, add/remove members, assign campaigns |
| `member` | team_member.role | View team, view assigned campaigns, interact with assigned campaign data |

### 5.3 Campaign Access

A user can access a campaign if either:
- They OWN the campaign (`campaign.user_id = auth.uid()`)
- They are ASSIGNED to the campaign (`campaign_member_assignment.user_id = auth.uid()`)

This is enforced at both:
- **Database level**: `can_access_campaign()` SECURITY DEFINER function used in RLS policies
- **API level**: Backend route checks are explicit (e.g., team owner only can assign campaigns)

---

## 6. Row Level Security (RLS) Policy Inventory

### 6.1 Policy Architecture Principles

- **All tables have RLS enabled** — no table is left unprotected
- **Backend uses service_role client** — bypasses RLS entirely for server-side operations (writing, AI processing, workflow activities)
- **Frontend uses anon/user client** — subject to RLS for all reads
- **SECURITY DEFINER functions** — break cross-table RLS recursion cycles

### 6.2 User-Scoped Tables (owner-only: `user_id = auth.uid()`)

| Table | R | W | Notes |
|-------|---|---|-------|
| `user_gmail_account` | SELECT only | — | Backend-managed; frontend reads only |
| `user_smtp_account` | SELECT only | — | Backend-managed; sensitive credentials |
| `gmail_message` | SELECT only | — | Backend-managed; immutable event log |
| `gmail_thread_state` | SELECT only | — | Backend-managed |
| `gmail_thread_llm_draft` | SELECT only | — | Backend-managed |
| `gmail_thread_ui_draft` | SELECT only | — | Backend-managed |
| `gmail_thread_state_follow_up_schedule` | SELECT only | — | Via thread_state.user_id |
| `email_attachment` | SELECT only | — | Via gmail_message.user_id |
| `email_attachment_llm_extracted_content` | SELECT only | — | Via attachment→message chain |
| `latest_gmail_message_per_thread` | SELECT only | — | Via gmail_message.user_id |
| `user_setting` | SELECT only | — | Backend-managed |
| `email_dispatch_queue` | Full CRUD | — | User-editable |
| `product` | Full CRUD | Full CRUD | User manages their products |
| `email_signature` | Full CRUD | Full CRUD | User manages signatures |

**Source:** `supabase/migrations/20250903000001_rls_policies.sql`

### 6.3 Team-Aware Tables (owner OR assigned member)

All campaign child tables use `can_access_campaign(campaign_id)` for SELECT, but only owner can INSERT/UPDATE/DELETE most:

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `campaign` | owner OR assigned | owner only | owner only | owner only |
| `campaign_recipient` | via `can_access_campaign` | owner OR assigned | owner OR assigned | owner OR assigned |
| `campaign_sender` | via `can_access_campaign` | owner only | owner only | owner only |
| `campaign_thread` | via `can_access_campaign` | owner only | owner only | owner only |
| `campaign_outbox_queue` | via `can_access_campaign` | owner only | — | — |
| `campaign_follow_up_outbox_queue` | via `can_access_campaign` | — | — | — |
| `campaign_lookalike_suggestion` | via `can_access_campaign` | owner OR assigned | owner OR assigned | — |
| `campaign_rule_suggestion_analytics` | via `can_access_campaign` | — | — | — |
| `campaign_workflow` | via `can_access_campaign` | owner only | — | — |
| `campaign_workflow_execution` | via `can_access_campaign` | — | — | — |
| `creator_post` | via `can_access_campaign` | — | — | — |
| `email_reply_example` | via `can_access_campaign` | — | — | — |

**Source:** `supabase/migrations/20260217100000_fix_campaign_child_table_rls_for_team_members.sql`

### 6.4 Team Tables

| Table | Policy | Notes |
|-------|--------|-------|
| `team` | Owner: full CRUD; Members: SELECT via `is_member_of_team()` | |
| `team_member` | Owner: full CRUD; Members: SELECT own row + owner's team rows | No self-referential queries (recursion prevention) |
| `campaign_member_assignment` | Owner: full CRUD via `is_campaign_owner()`; Assigned user: SELECT own row | |

### 6.5 Global Tables (no user scoping)

| Table | Policy |
|-------|--------|
| `creator` | Read-only for all authenticated users (global creator database) |
| `creator_list` | Owner-scoped SELECT/INSERT/UPDATE/DELETE |
| `creator_list_item` | Via creator_list.user_id |
| `creator_enrichment_attempt` | SELECT for authenticated; INSERT via backend service_role |

**Source:** `supabase/migrations/20260123000000_create_creator_table.sql`, `20260127061714_create_creator_list_tables.sql`

### 6.6 Email Account Credential Protection

Critical security decision (migration `20260217100003`):

**Problem:** Team members needed to see sender email addresses from `user_gmail_account`/`user_smtp_account`, but PostgreSQL RLS controls rows not columns — a broad SELECT policy would expose `refresh_token`, `smtp_password` to team members.

**Solution:**
- Drop team-member SELECT policies on `user_gmail_account` and `user_smtp_account` entirely
- Routes that need sender emails use `createServiceClient()` (bypasses RLS) after verifying campaign access at the API layer
- Team members have **zero direct SELECT access** to credential tables

---

## 7. SECURITY DEFINER Helper Functions

These PostgreSQL functions bypass RLS to prevent cross-table recursion:

| Function | Purpose | Used By |
|----------|---------|---------|
| `public.is_member_of_team(team_id)` | Check if `auth.uid()` is in `team_member` | `team` SELECT policy |
| `public.is_campaign_owner(campaign_id)` | Check if `auth.uid()` owns campaign | `campaign_member_assignment` ALL policy |
| `public.can_access_campaign(campaign_id)` | Owner OR assigned check | All campaign child table SELECT policies |

All use `SECURITY DEFINER SET search_path = public STABLE` — execute with function definer's privileges, bypassing caller's RLS.

---

## 8. CSRF Protection

All webapp form submissions are protected by CSRF tokens:
- `CSRFToken` component embeds a signed token in hidden form fields
- `validateCSRFFromFormData()` validates the token before processing any mutation
- Applied to: sign-in, sign-up, forgot-password, reset-password, set-password, saveUserGmailCredentials

**Source:** `apps/webapp/lib/csrf-server.ts` (validation), `apps/webapp/components/csrf-token.tsx` (component)

---

## 9. Permission Matrix

### 9.1 Campaign Access Matrix

| Action | Campaign Owner | Assigned Team Member | Team Member (unassigned) | Unauthenticated |
|--------|---------------|---------------------|--------------------------|-----------------|
| View campaign list | Own campaigns | Assigned campaigns | None | Denied |
| View campaign details | ✓ | ✓ | ✗ | Denied |
| Create campaign | ✓ | ✗ | ✗ | Denied |
| Edit campaign | ✓ | ✗ | ✗ | Denied |
| Delete campaign | ✓ | ✗ | ✗ | Denied |
| View campaign recipients | ✓ | ✓ | ✗ | Denied |
| Add/edit recipients | ✓ | ✓ | ✗ | Denied |
| View creator suggestions | ✓ | ✓ | ✗ | Denied |
| Accept/reject suggestions | ✓ | ✓ | ✗ | Denied |
| Launch campaign | ✓ | ✗ | ✗ | Denied |
| View threads/outbox | ✓ | ✓ | ✗ | Denied |
| View sender accounts | ✓ (full) | ✗ (API layer only) | ✗ | Denied |
| Assign campaigns to members | ✓ (team owner) | ✗ | ✗ | Denied |

### 9.2 Team Management Matrix

| Action | Team Owner | Team Member | Non-member |
|--------|-----------|-------------|------------|
| Create team | ✓ | ✓ (own teams) | ✓ |
| Delete team | ✓ (own) | ✗ | ✗ |
| View team members | ✓ | ✓ | ✗ |
| Add team members | ✓ (own teams) | ✗ | ✗ |
| Remove team members | ✓ (own teams) | ✗ | ✗ |
| Assign campaigns | ✓ (own campaigns) | ✗ | ✗ |
| View my assignments | N/A | ✓ | ✗ |

---

## 10. Supabase Client Types

Three Supabase client types are used:

| Client | Key | RLS | Usage |
|--------|-----|-----|-------|
| **User client** (SSR) | `anon` key + cookie session | Enforced | Frontend webapp reads/writes |
| **Service client** | `service_role` key | Bypassed | Backend API all operations, Admin operations |
| **Admin client** | `service_role` key | Bypassed | Invite user, check_email_exists RPC |

The backend **always** uses a service_role client (configured via `SUPABASE_SERVICE_ROLE_KEY`) — meaning all database access from the Python API bypasses RLS. RLS is only enforced for direct Supabase queries from the frontend.

---

## 11. Key Security Properties

1. **Defense in depth**: RLS enforces isolation even if API layer is bypassed
2. **No credential leakage**: Refresh tokens and SMTP passwords are never accessible to team members via RLS
3. **Recursion-safe policies**: SECURITY DEFINER functions prevent infinite recursion in cross-table policies
4. **Environment-gated impersonation**: Dev impersonation is hard-disabled in production
5. **CSRF on all mutations**: All server actions use CSRF token validation
6. **Session isolation**: signOut({ scope: 'local' }) leaves other sessions active; `scope: 'others'` terminates other sessions on password reset
7. **Email verification**: New sign-ups require email confirmation before accessing the app

---

## 12. User Identity at Runtime

When a user makes an API request to the backend:
```python
current_user = {
    "user_id": "uuid-from-jwt-sub",  # auth.users.id
    "email": "user@example.com",      # from JWT email claim
    "role": "authenticated",           # from JWT role claim
    "payload": { ... }                 # full decoded JWT
}
```

This `user_id` is used as the data isolation key for all repository queries.
The backend constructs all `WHERE user_id = ?` clauses explicitly using this value — no reliance on RLS for the backend queries.
