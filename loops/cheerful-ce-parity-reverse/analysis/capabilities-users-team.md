# Users & Team — Capability Extraction

**Aspect**: w1-users-team
**Sources**: `spec-backend-api.md` (Domain 12, 24), `spec-webapp.md` (Settings, Team, Onboarding), actual source code (`user.py`, `team.py`, `email_signature.py`, `smtp_account.py`), webapp onboarding routes, webapp API routes

---

## Existing Context Engine Tools

| Tool | Description | Coverage |
|------|-------------|----------|
| (none) | No user/team tools exist in the context engine | 0% |

**Gap**: Zero coverage. No CE tools for user settings, connected accounts, team management, campaign assignments, email signatures, or onboarding status.

---

## Frontend/Backend Capabilities (Not Yet in Context Engine)

### Sub-Domain A: User Settings

| # | Action | Backend Endpoint | Method | Key Parameters | Returns |
|---|--------|-----------------|--------|----------------|---------|
| 1 | Get user settings | `/user/settings` | GET | (none — user from JWT) | `UserSettingResponse`: user_id, created_at, updated_at, last_seen_update_at (nullable) |
| 2 | Update user settings | `/user/settings` | PUT | (none — placeholder, no updatable fields currently) | `UserSettingResponse` |

**Notes**:
- `PUT /user/settings` is a placeholder — the endpoint exists but has no update fields. The handler creates settings if they don't exist, same as GET.
- `UserSetting` DB model has: `user_id` (PK), `created_at`, `updated_at`, `last_seen_update_at` (nullable datetime).
- The frontend (`settings/page.tsx`) renders a tabbed interface with tabs: "email", "integrations", "team".

### Sub-Domain B: Connected Accounts (Gmail + SMTP)

| # | Action | Backend Endpoint | Method | Key Parameters | Returns |
|---|--------|-----------------|--------|----------------|---------|
| 3 | List Gmail accounts | `/user/gmail-accounts` | GET | (none) | `UserGmailAccountResponse[]`: id, gmail_email, sync_in_progress, is_active, created_at. **Excludes** refresh_token and last_poll_history_id |
| 4 | List all connected accounts (Gmail + SMTP) | `/user/connected-accounts` | GET | account_type: string (nullable, "gmail" or "smtp"), active_only: bool (default true) | `ConnectedAccountResponse[]`: id, email, account_type (AccountType enum: "gmail" or "smtp"), display_name (nullable), is_active |
| 5 | Create SMTP account | `/smtp-accounts` | POST | email_address, display_name, smtp_host, smtp_port, smtp_username, smtp_password, smtp_use_tls, imap_host, imap_port, imap_username, imap_password, imap_use_ssl | `SmtpAccountResponse` (201). Reactivates soft-deleted accounts. 409 if duplicate active. |
| 6 | List SMTP accounts | `/smtp-accounts` | GET | (none) | `SmtpAccountResponse[]` |
| 7 | Get SMTP account by ID | `/smtp-accounts/{account_id}` | GET | account_id (path) | `SmtpAccountResponse`. 404 if not found, 403 if not owner. |
| 8 | Update SMTP account | `/smtp-accounts/{account_id}` | PATCH | account_id (path), optional fields: display_name, smtp_host, smtp_port, smtp_username, smtp_password, smtp_use_tls, imap_host, imap_port, imap_username, imap_password, imap_use_ssl | `SmtpAccountResponse`. Encrypts password fields if provided. |
| 9 | Delete SMTP account | `/smtp-accounts/{account_id}` | DELETE | account_id (path) | 204. 404 if not found, 403 if not owner. |
| 10 | Bulk import SMTP accounts | `/smtp-accounts/bulk` | POST | provider (BulkSmtpProvider enum: "gmail" or "custom"), accounts[] with per-account fields | `BulkSmtpImportResponse`: created, skipped, errors, results[]. Verifies IMAP credentials before saving. |

**AccountType enum** (verified from `account_type.py`):
- `"gmail"`
- `"smtp"`

**BulkSmtpProvider enum** (verified from request model):
- `"gmail"` — auto-fills SMTP/IMAP settings (smtp.gmail.com:587, imap.gmail.com:993)
- `"custom"` — requires full SMTP/IMAP credentials per account

**Notes**:
- Gmail accounts are created via OAuth flow (webapp-only, no backend endpoint). The CE can list them but not create/delete them.
- SMTP accounts support full CRUD + bulk import with IMAP credential verification.
- SMTP passwords are encrypted at rest via `crypto_service.encrypt()`.
- Bulk import uses parallel IMAP verification (up to 10 workers, 10s timeout per connection).

### Sub-Domain C: Email Signatures

| # | Action | Backend Endpoint | Method | Key Parameters | Returns |
|---|--------|-----------------|--------|----------------|---------|
| 11 | List email signatures | `/email-signatures` | GET | campaign_id: uuid (optional — filter by campaign) | `EmailSignatureListResponse`: signatures[] |
| 12 | Get signatures for reply dropdown | `/email-signatures/for-reply` | GET | campaign_id: uuid (optional) | `SignaturesForReplyResponse`: user_signatures[], campaign_signature (nullable) |
| 13 | Create email signature | `/email-signatures` | POST | name (1-255 chars), content (1-10000 chars), is_default (bool, default false), campaign_id (optional uuid), is_enabled (bool, default false — for campaign auto-append) | `EmailSignatureResponse` (201). Content is sanitized HTML. If is_default=true and no campaign_id, clears existing default. |
| 14 | Get email signature by ID | `/email-signatures/{signature_id}` | GET | signature_id (path) | `EmailSignatureResponse`. 404 if not found, 403 if not owner. |
| 15 | Update email signature | `/email-signatures/{signature_id}` | PATCH | signature_id (path), optional fields: name (1-255), content (1-10000), is_default (bool), is_enabled (bool) | `EmailSignatureResponse`. Content sanitized. If is_default=true, clears other defaults. |
| 16 | Delete email signature | `/email-signatures/{signature_id}` | DELETE | signature_id (path) | 204. 404 if not found, 403 if not owner. |

**EmailSignatureResponse fields** (verified from Pydantic model):
- `id`: uuid
- `user_id`: uuid
- `name`: string
- `content`: string (sanitized HTML)
- `is_default`: bool
- `campaign_id`: uuid | null (null = user-level signature)
- `campaign_name`: string | null (populated when campaign_id is set)
- `is_enabled`: bool (auto-append for campaign signatures)
- `created_at`: datetime
- `updated_at`: datetime

**Notes**:
- Two signature types: **user-level** (no campaign_id, reusable across campaigns) and **campaign-specific** (tied to a campaign, auto-appended when is_enabled=true).
- Signature content has max length of 10,000 chars and is sanitized via `sanitize_signature_html()`.
- Only one user-level signature can be `is_default` at a time (creating/updating a new default clears the previous).

### Sub-Domain D: Team Management

| # | Action | Backend Endpoint | Method | Key Parameters | Returns |
|---|--------|-----------------|--------|----------------|---------|
| 17 | List my teams | `/v1/teams/` | GET | (none) | `UserTeamsResponse`: teams[] (TeamResponse[]), is_owner_of_any (bool) |
| 18 | Create team | `/v1/teams/` | POST | name (1-255 chars) | `TeamResponse` (201). Creator becomes owner. |
| 19 | Get team with members | `/v1/teams/{team_id}` | GET | team_id (path) | `TeamWithMembersResponse`: team (TeamResponse), members[] (TeamMemberResponse[]) |
| 20 | Delete team | `/v1/teams/{team_id}` | DELETE | team_id (path) | 204. Owner-only. Cleans up campaign assignments for all non-owner members. |
| 21 | Add team member | `/v1/teams/{team_id}/members` | POST | team_id (path), user_email (string) | `TeamMemberResponse` (201). Owner-only. If user doesn't exist → Supabase invite email sent, member created with invited=true. |
| 22 | Remove team member | `/v1/teams/{team_id}/members/{member_user_id}` | DELETE | team_id (path), member_user_id (path) | 204. Owner-only. Cannot remove owner. Also removes all campaign assignments for the member from owner's campaigns. |

**TeamResponse fields** (verified from Pydantic model):
- `id`: uuid
- `name`: string
- `owner_user_id`: uuid
- `created_at`: datetime
- `updated_at`: datetime

**TeamMemberResponse fields** (verified from Pydantic model):
- `id`: uuid
- `team_id`: uuid
- `user_id`: uuid
- `role`: string (TeamMemberRole enum: "owner" or "member")
- `created_at`: datetime
- `email`: string | null
- `avatar_url`: string | null (extracted from user meta: avatar_url or picture)
- `invited`: bool (true if email_confirmed_at is null)

**TeamMemberRole enum** (verified from `team.py` database model):
- `"owner"`
- `"member"`

**Notes**:
- Team owner is also added as a `TeamMember` with role="owner" when the team is created. This simplifies member queries.
- When adding a member by email, if the user doesn't exist in Supabase, an invite email is sent via `supabase.auth.admin.invite_user_by_email()`.
- Avatar URL is pulled from Supabase auth metadata (`raw_user_meta_data.avatar_url` or `raw_user_meta_data.picture` from Google OAuth).

### Sub-Domain E: Campaign Assignments

| # | Action | Backend Endpoint | Method | Key Parameters | Returns |
|---|--------|-----------------|--------|----------------|---------|
| 23 | List my campaign assignments | `/v1/teams/my-assignments` | GET | (none) | `CampaignAssignmentsListResponse`: assignments[] (CampaignAssignmentResponse[]), total (int) |
| 24 | List campaign assignments for a campaign | `/v1/teams/{team_id}/campaigns/{campaign_id}/assignments` | GET | team_id (path), campaign_id (path) | `CampaignAssignmentsListResponse`. Team-member visible. Verifies campaign belongs to team owner. |
| 25 | Assign campaign to team member | `/v1/teams/{team_id}/campaigns/{campaign_id}/assignments` | POST | team_id (path), campaign_id (path), user_id (uuid in body) | `CampaignAssignmentResponse` (201). Owner-only. Verifies assignee is team member and campaign belongs to owner. |
| 26 | Unassign campaign from member | `/v1/teams/{team_id}/campaigns/{campaign_id}/assignments/{assignee_user_id}` | DELETE | team_id (path), campaign_id (path), assignee_user_id (path) | 204. Owner-only. |
| 27 | Bulk assign campaigns to member | `/v1/teams/{team_id}/campaigns/bulk-assign` | POST | team_id (path), user_id (uuid in body), campaign_ids (uuid[] in body) | `BulkAssignCampaignsResponse`: assigned[] (string[]), skipped[] (string[]), total_assigned (int), total_skipped (int). Owner-only. Skips campaigns not owned by team owner or already assigned. |

**CampaignAssignmentResponse fields** (verified from Pydantic model):
- `id`: uuid
- `campaign_id`: uuid
- `user_id`: uuid
- `created_at`: datetime
- `user_email`: string | null
- `campaign_name`: string | null

**Permission Model**:
- **Campaign access** is determined by: `campaign.user_id == user_id` (owner) OR `campaign_member_assignment` record exists (assigned member).
- Only the team **owner** can assign/unassign campaigns, add/remove members, or delete the team.
- Any **team member** (including owner) can view team details, member list, and campaign assignment list.

### Sub-Domain F: Onboarding (Webapp-Only)

| # | Action | Backend Endpoint | Method | Key Parameters | Returns |
|---|--------|-----------------|--------|----------------|---------|
| 28 | Get onboarding status | `/api/onboarding/status` (webapp API route) | GET | (none — user from Supabase session) | { completed, role, referralSource, walkthroughCompleted, setupChecklistCompleted } |
| 29 | Complete onboarding | `/api/onboarding/complete` (webapp API route) | POST | role (required), referralSource (required), referralOtherText (optional), csrfToken | { success, message }. Sets `onboarding_completed` cookie. |
| 30 | Complete walkthrough | `/api/onboarding/walkthrough-complete` (webapp API route) | POST | (none) | { success, message } |
| 31 | Complete setup checklist | `/api/onboarding/setup-checklist-complete` (webapp API route) | POST | (none) | { success, message } |

**Onboarding Data** (stored in `user_onboarding` table via Supabase):
- `user_id`: uuid (PK)
- `onboarding_completed`: bool
- `user_role`: string — one of: "brand-agency", "creator-agency", "creator", "sales", "other"
- `referral_source`: string — one of: "google", "social-media", "friend", "linkedin", "other"
- `referral_other_text`: string | null
- `completed_at`: datetime
- `walkthrough_completed`: bool
- `walkthrough_completed_at`: datetime
- `setup_checklist_completed`: bool
- `setup_checklist_completed_at`: datetime
- `updated_at`: datetime

**Onboarding Steps** (verified from webapp store):
1. Welcome — brand intro
2. Connect — integrations showcase
3. Describe — brand description
4. Product — product details
5. Role — selection from: Brand Agency, Creator Agency, Creator, Sales, Other
6. Referral — selection from: Google, Social Media, Friend / Colleague, LinkedIn, Other (with freetext)
7. Connect Email — Gmail OAuth flow

**Notes**:
- Onboarding is entirely **webapp-only** (Next.js API routes → Supabase direct queries). There are NO backend Python endpoints for onboarding.
- The middleware enforces: unauthenticated → `/sign-in`; authenticated + not onboarded → `/onboarding`; onboarded → `/mail`.
- The `onboarding_completed` cookie avoids a DB query on every request after completion.
- **CE relevance**: The context engine doesn't need to complete onboarding (that's a UI flow), but could read onboarding status to understand the user's role/profile. This would require either a new backend service endpoint or direct Supabase access.

---

## Summary Statistics

| Sub-Domain | Endpoints | Existing CE Tools | Gap |
|-----------|-----------|------------------|-----|
| User Settings | 2 | 0 | 2 |
| Connected Accounts (Gmail + SMTP) | 8 | 0 | 8 |
| Email Signatures | 6 | 0 | 6 |
| Team Management | 6 | 0 | 6 |
| Campaign Assignments | 5 | 0 | 5 |
| Onboarding | 4 (webapp-only) | 0 | 4 (webapp-only, may not need CE tools) |
| **Total** | **31** | **0** | **27 actionable + 4 webapp-only** |

## Key Discoveries

1. **Email Signatures are user settings too**: The `/settings` page has an "email" tab that manages both connected accounts AND email signatures. Signatures have their own CRUD endpoints under `/email-signatures` with a rich model (user-level vs campaign-specific, auto-append flag, HTML sanitization).

2. **SMTP accounts have full CRUD + bulk import**: Unlike Gmail (which requires OAuth and has no backend create/delete), SMTP accounts support full CRUD including bulk import with parallel IMAP verification. This is a significant capability gap.

3. **Team model is simple but powerful**: Owner-centric permission model. The team owner controls everything (add/remove members, assign/unassign campaigns, delete team). Members get read-only access to team info and view access to assigned campaigns.

4. **Onboarding is webapp-only**: No backend API endpoints. All onboarding state is managed via Supabase direct queries from Next.js API routes. For CE parity, we'd need new service endpoints or the CE to directly query Supabase — the former is more consistent with the existing architecture.

5. **No profile editing endpoint**: There's no endpoint to update user email, name, or avatar. User profile data lives in Supabase's `auth.users` table and is managed through Supabase Auth (client SDK). The backend only reads from `auth.users` — never writes to it.

6. **The `PUT /user/settings` is a no-op**: The endpoint exists but has no updatable fields. It's a placeholder for future settings.

7. **Campaign assignment cascades on member removal**: When a team member is removed, ALL their campaign assignments from the team owner's campaigns are also removed. Similarly when a team is deleted.
