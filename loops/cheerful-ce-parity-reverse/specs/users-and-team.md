# Users & Team Domain — Tool Specifications

**Domain**: Users & Team
**Spec file**: `specs/users-and-team.md`
**Wave 2 status**: Tool design complete
**Wave 3 status**: Pending (full OpenAPI-level specs)

---

## Table of Contents

1. [User Settings](#user-settings) (1 tool)
2. [Connected Accounts (Unified View)](#connected-accounts-unified-view) (1 tool)
3. [Team Management](#team-management) (5 tools)
4. [Campaign Assignments](#campaign-assignments) (5 tools)
5. [Onboarding Status](#onboarding-status) (1 tool)

**Total**: 13 tools (0 existing + 13 new)

> **Cross-reference — Gmail accounts**: Individual Gmail account listing and sync status are in `specs/integrations.md` (`cheerful_list_gmail_accounts`, `cheerful_get_gmail_sync_status`). This domain's `cheerful_list_connected_accounts` provides a unified view of ALL connected accounts (Gmail + SMTP) with simplified fields.

> **Cross-reference — SMTP accounts**: Full SMTP account CRUD (create, get, update, delete, bulk import) is in `specs/integrations.md`. SMTP accounts are an integration concern; this domain covers the unified settings-page view.

> **Cross-reference — Email signatures**: Email signature CRUD (list, get, create, update, delete, for-reply) is in `specs/email.md`. Campaign-scoped signature convenience tools are in `specs/campaigns.md`. Signatures are an email concern despite appearing on the settings page.

> **Service routes needed**: 11 new `/api/service/*` endpoints needed. Team management (6 endpoints) and campaign assignments (5 endpoints) are JWT-auth only — all need new service routes. Connected accounts listing needs a new service route. Onboarding status needs a new service route (currently webapp-only via Supabase direct queries, no backend endpoint exists at all).

> **User profile limitation**: There is NO endpoint to update user email, name, or avatar. User profile data lives in Supabase's `auth.users` table and is managed through Supabase Auth (client SDK). The backend only reads from `auth.users`. The context engine cannot modify profile data.

---

## User Settings

### `cheerful_get_user_settings`

**Status**: NEW

**Purpose**: Get the authenticated user's settings metadata (creation date, last activity timestamp).

**Maps to**: `GET /api/service/user/settings` (new service route needed; main route: `GET /user/settings`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: authenticated (self-only — returns only the user's own settings).

**Parameters**: None (user-scoped, no filtering).

**Returns**: `UserSettingResponse` — user settings metadata. Note: this is a minimal object. The PUT endpoint is a no-op placeholder with no updatable fields.

**Return Schema**:
```json
{
  "user_id": "uuid — the user's ID",
  "created_at": "datetime — when settings were created (ISO 8601)",
  "updated_at": "datetime — last settings update (ISO 8601)",
  "last_seen_update_at": "datetime | null — last time user viewed the updates/changelog (nullable)"
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |

**Example Request**:
```
cheerful_get_user_settings()
```

**Example Response**:
```json
{
  "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "created_at": "2025-10-15T08:30:00Z",
  "updated_at": "2026-02-28T14:22:00Z",
  "last_seen_update_at": "2026-02-20T09:15:00Z"
}
```

**Slack Formatting Notes**:
- Minimal data — agent should combine with other tools (connected accounts, team info) for a full "your account" summary.
- Show `last_seen_update_at` only if user asks about changelog/updates.

**Edge Cases**:
- Settings are auto-created on first GET if they don't exist (backend handles this). Tool always returns a valid response for authenticated users.
- `last_seen_update_at` is null if the user has never viewed the updates/changelog section.

**Service route changes needed**: New `GET /api/service/user/settings` endpoint that accepts `user_id` query param and returns `UserSettingResponse`.

---

## Connected Accounts (Unified View)

### `cheerful_list_connected_accounts`

**Status**: NEW

**Purpose**: List all connected email accounts (Gmail and SMTP) in a unified view, with optional filtering by account type and active status.

**Maps to**: `GET /api/service/user/connected-accounts` (new service route needed; main route: `GET /user/connected-accounts`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: authenticated (self-only — returns only the user's own accounts).

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| account_type | enum | no | — | Filter by type. One of: "gmail", "smtp". If omitted, returns both types. |
| active_only | boolean | no | true | If true, only returns active (non-deactivated) accounts. |

**Returns**: Array of `ConnectedAccountResponse` objects — simplified account info with unified schema across Gmail and SMTP.

**Return Schema**:
```json
[
  {
    "id": "uuid — account ID",
    "email": "string — email address",
    "account_type": "string — 'gmail' or 'smtp' (AccountType enum)",
    "display_name": "string | null — human-readable display name (nullable, SMTP-only)",
    "is_active": "boolean — whether the account is active"
  }
]
```

**AccountType enum values**: `"gmail"`, `"smtp"`

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |

**Example Request**:
```
cheerful_list_connected_accounts()
cheerful_list_connected_accounts(account_type="smtp", active_only=false)
```

**Example Response**:
```json
[
  {
    "id": "f1a2b3c4-d5e6-7890-abcd-ef1234567890",
    "email": "outreach@mybrand.com",
    "account_type": "gmail",
    "display_name": null,
    "is_active": true
  },
  {
    "id": "a9b8c7d6-e5f4-3210-fedc-ba0987654321",
    "email": "campaigns@mybrand.com",
    "account_type": "smtp",
    "display_name": "Campaign Sender",
    "is_active": true
  }
]
```

**Slack Formatting Notes**:
- Format as a numbered list: `1. outreach@mybrand.com (Gmail, active)`
- Group by account type if there are many accounts.
- Flag inactive accounts with a warning indicator.

**Edge Cases**:
- Returns empty array if user has no connected accounts.
- Gmail accounts never have `display_name` (always null). SMTP accounts may have one.
- Deactivated accounts are hidden by default (`active_only=true`). Set `active_only=false` to see all including soft-deleted/deactivated SMTP accounts.

**Service route changes needed**: New `GET /api/service/user/connected-accounts` endpoint that accepts `user_id`, `account_type`, `active_only` query params.

> **Cross-reference**: For detailed Gmail account info (sync status, last poll), use `cheerful_list_gmail_accounts` from `specs/integrations.md`. For full SMTP account CRUD, see `specs/integrations.md` SMTP section.

---

## Team Management

### `cheerful_list_teams`

**Status**: NEW

**Purpose**: List all teams the authenticated user belongs to (as owner or member), including whether the user owns any team.

**Maps to**: `GET /api/service/v1/teams/` (new service route needed; main route: `GET /v1/teams/`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: authenticated (returns teams the user is a member of).

**Parameters**: None (user-scoped, returns all teams for the user).

**Returns**: `UserTeamsResponse` — list of teams plus ownership flag.

**Return Schema**:
```json
{
  "teams": [
    {
      "id": "uuid — team ID",
      "name": "string — team name",
      "owner_user_id": "uuid — team owner's user ID",
      "created_at": "datetime — team creation time (ISO 8601)",
      "updated_at": "datetime — last update time (ISO 8601)"
    }
  ],
  "is_owner_of_any": "boolean — true if the user owns at least one team"
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |

**Example Request**:
```
cheerful_list_teams()
```

**Example Response**:
```json
{
  "teams": [
    {
      "id": "d1e2f3a4-b5c6-7890-1234-567890abcdef",
      "name": "Outreach Team",
      "owner_user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "created_at": "2025-11-01T10:00:00Z",
      "updated_at": "2026-01-15T16:30:00Z"
    }
  ],
  "is_owner_of_any": true
}
```

**Slack Formatting Notes**:
- Format as a list: `*Outreach Team* (owner) — created Nov 1, 2025`
- Indicate user's role (owner vs member) for each team by comparing `owner_user_id` to the current user.
- `is_owner_of_any` helps the agent know whether to offer admin actions (add members, assign campaigns).

**Edge Cases**:
- Returns `{"teams": [], "is_owner_of_any": false}` if user has no teams.
- Team owner is always listed as a member with role "owner" in the team's member list (via `cheerful_get_team`), but this endpoint only returns the `TeamResponse` (not members).

---

### `cheerful_create_team`

**Status**: NEW

**Purpose**: Create a new team. The authenticated user automatically becomes the team owner.

**Maps to**: `POST /api/service/v1/teams/` (new service route needed; main route: `POST /v1/teams/`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: authenticated (any user can create a team).

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| name | string | yes | — | Team name. Length: 1-255 characters. |

**Parameter Validation Rules**:
- `name` must be between 1 and 255 characters (inclusive).

**Returns**: `TeamResponse` — the newly created team. HTTP 201.

**Return Schema**:
```json
{
  "id": "uuid — newly created team ID",
  "name": "string — team name",
  "owner_user_id": "uuid — the creating user's ID (automatically set)",
  "created_at": "datetime — creation time (ISO 8601)",
  "updated_at": "datetime — same as created_at initially (ISO 8601)"
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Name too short/long | Validation error (Pydantic) | 422 |

**Example Request**:
```
cheerful_create_team(name="Outreach Team")
```

**Example Response**:
```json
{
  "id": "d1e2f3a4-b5c6-7890-1234-567890abcdef",
  "name": "Outreach Team",
  "owner_user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "created_at": "2026-03-01T14:00:00Z",
  "updated_at": "2026-03-01T14:00:00Z"
}
```

**Slack Formatting Notes**:
- Confirm creation: `Team *Outreach Team* created! You're the owner. Add members with their email addresses.`
- Offer next action: suggest adding team members.

**Edge Cases**:
- The creator is automatically added as a `TeamMember` with role "owner". This member record is created in the same transaction as the team.
- There is no unique constraint on team names — duplicate names are allowed.

---

### `cheerful_get_team`

**Status**: NEW

**Purpose**: Get a team's details including its full member list with roles, emails, and invitation status.

**Maps to**: `GET /api/service/v1/teams/{team_id}` (new service route needed; main route: `GET /v1/teams/{team_id}`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: team member (user must be a member of the team — either owner or member role).

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| team_id | uuid | yes | — | Team ID to retrieve. |

**Returns**: `TeamWithMembersResponse` — team details plus full member list.

**Return Schema**:
```json
{
  "team": {
    "id": "uuid — team ID",
    "name": "string — team name",
    "owner_user_id": "uuid — team owner's user ID",
    "created_at": "datetime — creation time (ISO 8601)",
    "updated_at": "datetime — last update time (ISO 8601)"
  },
  "members": [
    {
      "id": "uuid — team member record ID",
      "team_id": "uuid — team ID",
      "user_id": "uuid — member's user ID",
      "role": "string — 'owner' or 'member' (TeamMemberRole enum)",
      "created_at": "datetime — when member was added (ISO 8601)",
      "email": "string | null — member's email address (nullable)",
      "avatar_url": "string | null — member's avatar URL from Google OAuth metadata (nullable)",
      "invited": "boolean — true if member hasn't confirmed their email yet (pending invite)"
    }
  ]
}
```

**TeamMemberRole enum values**: `"owner"`, `"member"`

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Team not found | "Team {team_id} not found" | 404 |
| User not a team member | "Access denied to team {team_id}" | 403 |

**Example Request**:
```
cheerful_get_team(team_id="d1e2f3a4-b5c6-7890-1234-567890abcdef")
```

**Example Response**:
```json
{
  "team": {
    "id": "d1e2f3a4-b5c6-7890-1234-567890abcdef",
    "name": "Outreach Team",
    "owner_user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "created_at": "2025-11-01T10:00:00Z",
    "updated_at": "2026-01-15T16:30:00Z"
  },
  "members": [
    {
      "id": "m1m2m3m4-a5b6-c7d8-e9f0-123456789abc",
      "team_id": "d1e2f3a4-b5c6-7890-1234-567890abcdef",
      "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "role": "owner",
      "created_at": "2025-11-01T10:00:00Z",
      "email": "boss@mybrand.com",
      "avatar_url": "https://lh3.googleusercontent.com/a/example",
      "invited": false
    },
    {
      "id": "m5m6m7m8-b9c0-d1e2-f3a4-567890abcdef",
      "team_id": "d1e2f3a4-b5c6-7890-1234-567890abcdef",
      "user_id": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
      "role": "member",
      "created_at": "2026-01-10T09:00:00Z",
      "email": "teammate@mybrand.com",
      "avatar_url": null,
      "invited": false
    },
    {
      "id": "m9m0n1n2-c3d4-e5f6-a7b8-901234567890",
      "team_id": "d1e2f3a4-b5c6-7890-1234-567890abcdef",
      "user_id": "c3d4e5f6-a7b8-9012-cdef-345678901234",
      "role": "member",
      "created_at": "2026-02-20T11:30:00Z",
      "email": "newperson@agency.com",
      "avatar_url": null,
      "invited": true
    }
  ]
}
```

**Slack Formatting Notes**:
- Format as a team header with member list:
  ```
  *Outreach Team* (3 members)

  1. boss@mybrand.com — Owner
  2. teammate@mybrand.com — Member
  3. newperson@agency.com — Member (invited, pending)
  ```
- Flag invited members as "pending" so the user knows they haven't accepted yet.
- `avatar_url` is for webapp display — not useful in Slack but included in schema for completeness.

**Edge Cases**:
- Owner is always in the members list with `role: "owner"`.
- `email` may be null if the user's Supabase profile doesn't have an email (rare edge case).
- `avatar_url` is extracted from Google OAuth metadata (`raw_user_meta_data.avatar_url` or `raw_user_meta_data.picture`) — null if user signed up via email/password.
- `invited` is true when the user's `email_confirmed_at` is null in Supabase (they received the invite email but haven't clicked the confirmation link).

---

### `cheerful_delete_team`

**Status**: NEW

**Purpose**: Delete a team and clean up all associated campaign assignments for non-owner members.

**Maps to**: `DELETE /api/service/v1/teams/{team_id}` (new service route needed; main route: `DELETE /v1/teams/{team_id}`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: owner-only (only the team owner can delete the team).

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| team_id | uuid | yes | — | Team ID to delete. |

**Returns**: No content. HTTP 204.

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Team not found | "Team {team_id} not found" | 404 |
| User is not owner | "Only the team owner can delete the team" | 403 |

**Example Request**:
```
cheerful_delete_team(team_id="d1e2f3a4-b5c6-7890-1234-567890abcdef")
```

**Example Response**:
```json
null
```

**Slack Formatting Notes**:
- Confirm deletion: `Team *Outreach Team* has been deleted. All campaign assignments for team members have been removed.`
- Warn about side effects before executing (agent should confirm with user).

**Edge Cases**:
- **Cascade behavior**: Deleting a team removes ALL `campaign_member_assignment` records for non-owner members of this team's owner's campaigns. This means team members lose access to any campaigns they were assigned to.
- The owner's own campaign access is unaffected (they own the campaigns directly).
- Team member records are also deleted (the `team_member` table entries).

---

### `cheerful_add_team_member`

**Status**: NEW

**Purpose**: Add a new member to a team by email address. If the user doesn't have a Cheerful account, a Supabase invite email is sent automatically.

**Maps to**: `POST /api/service/v1/teams/{team_id}/members` (new service route needed; main route: `POST /v1/teams/{team_id}/members`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: owner-only (only the team owner can add members).

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| team_id | uuid | yes | — | Team ID to add the member to. |
| user_email | string | yes | — | Email address of the person to add. Must be a valid email. |

**Parameter Validation Rules**:
- `user_email` must be a valid email address format.

**Returns**: `TeamMemberResponse` — the newly created member record. HTTP 201.

**Return Schema**:
```json
{
  "id": "uuid — team member record ID",
  "team_id": "uuid — team ID",
  "user_id": "uuid — member's user ID (may be newly created Supabase user)",
  "role": "string — always 'member' for added members",
  "created_at": "datetime — when member was added (ISO 8601)",
  "email": "string | null — the member's email",
  "avatar_url": "string | null — avatar URL from Google OAuth (null for email-only or invited users)",
  "invited": "boolean — true if the user didn't have an account and was invited via email"
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Team not found | "Team {team_id} not found" | 404 |
| User is not owner | "Only the team owner can add members" | 403 |
| User already a member | "User is already a member of this team" | 409 |
| Invalid email | Validation error (Pydantic) | 422 |

**Example Request**:
```
cheerful_add_team_member(team_id="d1e2f3a4-b5c6-7890-1234-567890abcdef", user_email="newmember@agency.com")
```

**Example Response** (existing user):
```json
{
  "id": "m5m6m7m8-b9c0-d1e2-f3a4-567890abcdef",
  "team_id": "d1e2f3a4-b5c6-7890-1234-567890abcdef",
  "user_id": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
  "role": "member",
  "created_at": "2026-03-01T14:30:00Z",
  "email": "newmember@agency.com",
  "avatar_url": null,
  "invited": false
}
```

**Example Response** (new user — invited):
```json
{
  "id": "m9m0n1n2-c3d4-e5f6-a7b8-901234567890",
  "team_id": "d1e2f3a4-b5c6-7890-1234-567890abcdef",
  "user_id": "c3d4e5f6-a7b8-9012-cdef-345678901234",
  "role": "member",
  "created_at": "2026-03-01T14:30:00Z",
  "email": "brandnew@agency.com",
  "avatar_url": null,
  "invited": true
}
```

**Slack Formatting Notes**:
- If `invited: false`: `Added *newmember@agency.com* to team *Outreach Team*.`
- If `invited: true`: `Invited *brandnew@agency.com* to team *Outreach Team*. They'll receive an email to set up their account.`
- Offer next action: suggest assigning campaigns to the new member.

**Edge Cases**:
- If the email doesn't match any existing Supabase user, `supabase.auth.admin.invite_user_by_email()` is called to create a new user and send an invite email. The new user's `email_confirmed_at` will be null until they accept.
- The invite is a Supabase built-in flow — the team owner doesn't control the invite email content.
- Adding the same email twice returns 409 (already a member).
- The owner cannot add themselves — they're already a member with role "owner".

---

### `cheerful_remove_team_member`

**Status**: NEW

**Purpose**: Remove a member from a team. Also removes all campaign assignments for that member from the team owner's campaigns.

**Maps to**: `DELETE /api/service/v1/teams/{team_id}/members/{member_user_id}` (new service route needed; main route: `DELETE /v1/teams/{team_id}/members/{member_user_id}`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: owner-only (only the team owner can remove members).

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| team_id | uuid | yes | — | Team ID. |
| member_user_id | uuid | yes | — | User ID of the member to remove. |

**Returns**: No content. HTTP 204.

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Team not found | "Team {team_id} not found" | 404 |
| User is not owner | "Only the team owner can remove members" | 403 |
| Member not found | "Member not found in team" | 404 |
| Cannot remove owner | "Cannot remove the team owner" | 400 |

**Example Request**:
```
cheerful_remove_team_member(team_id="d1e2f3a4-b5c6-7890-1234-567890abcdef", member_user_id="b2c3d4e5-f6a7-8901-bcde-f23456789012")
```

**Example Response**:
```json
null
```

**Slack Formatting Notes**:
- Confirm removal: `Removed *teammate@mybrand.com* from team *Outreach Team*. Their campaign assignments have also been removed.`
- Agent should warn about the cascade effect before executing (member loses access to all assigned campaigns).

**Edge Cases**:
- **Cascade behavior**: Removing a member also deletes ALL `campaign_member_assignment` records for that member from campaigns owned by the team owner. This is automatic and not separately reversible.
- The team owner cannot be removed (returns 400). To remove the owner, delete the entire team.
- After removal, the member can no longer access any campaigns they were assigned to via this team.

---

## Campaign Assignments

Campaign assignments control which team members can access which campaigns. Only the team owner can assign/unassign. Campaign access is determined by: `campaign.user_id == user_id` (owner) OR `campaign_member_assignment` record exists (assigned member).

### `cheerful_list_my_campaign_assignments`

**Status**: NEW

**Purpose**: List all campaigns assigned to the authenticated user across all teams they belong to.

**Maps to**: `GET /api/service/v1/teams/my-assignments` (new service route needed; main route: `GET /v1/teams/my-assignments`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: authenticated (returns only the user's own assignments).

**Parameters**: None (user-scoped, returns all assignments for the user).

**Returns**: `CampaignAssignmentsListResponse` — list of campaign assignments.

**Return Schema**:
```json
{
  "assignments": [
    {
      "id": "uuid — assignment record ID",
      "campaign_id": "uuid — assigned campaign ID",
      "user_id": "uuid — the assigned user's ID",
      "created_at": "datetime — when assignment was created (ISO 8601)",
      "user_email": "string | null — the assigned user's email (nullable)",
      "campaign_name": "string | null — the campaign's name (nullable)"
    }
  ],
  "total": "integer — total number of assignments"
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |

**Example Request**:
```
cheerful_list_my_campaign_assignments()
```

**Example Response**:
```json
{
  "assignments": [
    {
      "id": "a1a2a3a4-b5b6-c7c8-d9d0-e1e2e3e4e5e6",
      "campaign_id": "c1c2c3c4-d5d6-e7e8-f9f0-a1a2a3a4a5a6",
      "user_id": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
      "created_at": "2026-02-15T10:00:00Z",
      "user_email": "me@mybrand.com",
      "campaign_name": "Spring Gifting 2026"
    },
    {
      "id": "b2b3b4b5-c6c7-d8d9-e0e1-f2f3f4f5f6f7",
      "campaign_id": "d2d3d4d5-e6e7-f8f9-a0a1-b2b3b4b5b6b7",
      "user_id": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
      "created_at": "2026-02-20T14:30:00Z",
      "user_email": "me@mybrand.com",
      "campaign_name": "Paid Promo Q1"
    }
  ],
  "total": 2
}
```

**Slack Formatting Notes**:
- Format as a list: `You have 2 campaign assignments:`
  ```
  1. *Spring Gifting 2026* — assigned Feb 15, 2026
  2. *Paid Promo Q1* — assigned Feb 20, 2026
  ```
- If empty: `You don't have any campaign assignments.`
- These are campaigns assigned TO the user (not campaigns they own).

**Edge Cases**:
- Returns `{"assignments": [], "total": 0}` if user has no assignments.
- This does NOT include campaigns the user owns directly — only campaigns assigned via team membership.
- `campaign_name` and `user_email` may be null if the related records have been deleted (orphaned assignment).

---

### `cheerful_list_campaign_assignments`

**Status**: NEW

**Purpose**: List all team member assignments for a specific campaign within a team.

**Maps to**: `GET /api/service/v1/teams/{team_id}/campaigns/{campaign_id}/assignments` (new service route needed; main route: `GET /v1/teams/{team_id}/campaigns/{campaign_id}/assignments`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: team member (any team member can view assignment list). Campaign must belong to the team owner.

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| team_id | uuid | yes | — | Team ID. |
| campaign_id | uuid | yes | — | Campaign ID to list assignments for. |

**Returns**: `CampaignAssignmentsListResponse` — list of assignments for this campaign.

**Return Schema**:
```json
{
  "assignments": [
    {
      "id": "uuid — assignment record ID",
      "campaign_id": "uuid — campaign ID",
      "user_id": "uuid — assigned user's ID",
      "created_at": "datetime — when assignment was created (ISO 8601)",
      "user_email": "string | null — assigned user's email (nullable)",
      "campaign_name": "string | null — campaign name (nullable)"
    }
  ],
  "total": "integer — total number of assignments for this campaign"
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Team not found | "Team {team_id} not found" | 404 |
| User not a team member | "Access denied to team {team_id}" | 403 |
| Campaign not found | "Campaign {campaign_id} not found" | 404 |
| Campaign not owned by team owner | "Campaign does not belong to the team owner" | 403 |

**Example Request**:
```
cheerful_list_campaign_assignments(team_id="d1e2f3a4-b5c6-7890-1234-567890abcdef", campaign_id="c1c2c3c4-d5d6-e7e8-f9f0-a1a2a3a4a5a6")
```

**Example Response**:
```json
{
  "assignments": [
    {
      "id": "a1a2a3a4-b5b6-c7c8-d9d0-e1e2e3e4e5e6",
      "campaign_id": "c1c2c3c4-d5d6-e7e8-f9f0-a1a2a3a4a5a6",
      "user_id": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
      "created_at": "2026-02-15T10:00:00Z",
      "user_email": "teammate@mybrand.com",
      "campaign_name": "Spring Gifting 2026"
    }
  ],
  "total": 1
}
```

**Slack Formatting Notes**:
- Format: `*Spring Gifting 2026* is assigned to 1 member: teammate@mybrand.com`
- If no assignments: `*Spring Gifting 2026* is not assigned to any team members.`

**Edge Cases**:
- The campaign must belong to the team owner (`campaign.user_id == team.owner_user_id`). If the campaign doesn't belong to the team owner, returns 403.
- Returns empty list if no members are assigned to this campaign.

---

### `cheerful_assign_campaign`

**Status**: NEW

**Purpose**: Assign a campaign to a team member, granting them access to view and edit the campaign.

**Maps to**: `POST /api/service/v1/teams/{team_id}/campaigns/{campaign_id}/assignments` (new service route needed; main route: `POST /v1/teams/{team_id}/campaigns/{campaign_id}/assignments`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: owner-only (only the team owner can assign campaigns).

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| team_id | uuid | yes | — | Team ID. |
| campaign_id | uuid | yes | — | Campaign ID to assign. Must belong to the team owner. |
| user_id | uuid | yes | — | User ID of the team member to assign the campaign to. Note: this is the ASSIGNEE's user_id (a tool parameter), not the authenticated user's user_id (which is injected). |

**Parameter Validation Rules**:
- `user_id` (assignee) must be an existing member of the team.
- `campaign_id` must belong to the team owner (not the assignee).

**Returns**: `CampaignAssignmentResponse` — the newly created assignment. HTTP 201.

**Return Schema**:
```json
{
  "id": "uuid — assignment record ID",
  "campaign_id": "uuid — campaign ID",
  "user_id": "uuid — assigned user's ID",
  "created_at": "datetime — when assignment was created (ISO 8601)",
  "user_email": "string | null — assigned user's email",
  "campaign_name": "string | null — campaign name"
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Team not found | "Team {team_id} not found" | 404 |
| Caller is not owner | "Only the team owner can assign campaigns" | 403 |
| Campaign not found | "Campaign {campaign_id} not found" | 404 |
| Campaign not owned by team owner | "Campaign does not belong to the team owner" | 403 |
| Assignee not a team member | "User is not a member of this team" | 400 |
| Already assigned | "Campaign is already assigned to this user" | 409 |

**Example Request**:
```
cheerful_assign_campaign(team_id="d1e2f3a4-b5c6-7890-1234-567890abcdef", campaign_id="c1c2c3c4-d5d6-e7e8-f9f0-a1a2a3a4a5a6", user_id="b2c3d4e5-f6a7-8901-bcde-f23456789012")
```

**Example Response**:
```json
{
  "id": "a1a2a3a4-b5b6-c7c8-d9d0-e1e2e3e4e5e6",
  "campaign_id": "c1c2c3c4-d5d6-e7e8-f9f0-a1a2a3a4a5a6",
  "user_id": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
  "created_at": "2026-03-01T15:00:00Z",
  "user_email": "teammate@mybrand.com",
  "campaign_name": "Spring Gifting 2026"
}
```

**Slack Formatting Notes**:
- Confirm: `Assigned *Spring Gifting 2026* to *teammate@mybrand.com*.`

**Edge Cases**:
- The `user_id` parameter here is the ASSIGNEE — the person being given access. The authenticated user (team owner) is resolved via `RequestContext`. This is one of the few tools where `user_id` appears as a parameter, but it refers to a DIFFERENT user (the assignee), not the authenticated user.
- Assigning a campaign doesn't grant the member ownership — they can view/edit but can't delete, change senders, or launch the campaign (owner-only operations).

---

### `cheerful_unassign_campaign`

**Status**: NEW

**Purpose**: Remove a campaign assignment from a team member, revoking their access.

**Maps to**: `DELETE /api/service/v1/teams/{team_id}/campaigns/{campaign_id}/assignments/{assignee_user_id}` (new service route needed; main route: `DELETE /v1/teams/{team_id}/campaigns/{campaign_id}/assignments/{assignee_user_id}`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: owner-only (only the team owner can unassign campaigns).

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| team_id | uuid | yes | — | Team ID. |
| campaign_id | uuid | yes | — | Campaign ID to unassign. |
| assignee_user_id | uuid | yes | — | User ID of the member to unassign from the campaign. |

**Returns**: No content. HTTP 204.

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Team not found | "Team {team_id} not found" | 404 |
| Caller is not owner | "Only the team owner can unassign campaigns" | 403 |
| Assignment not found | "Assignment not found" | 404 |

**Example Request**:
```
cheerful_unassign_campaign(team_id="d1e2f3a4-b5c6-7890-1234-567890abcdef", campaign_id="c1c2c3c4-d5d6-e7e8-f9f0-a1a2a3a4a5a6", assignee_user_id="b2c3d4e5-f6a7-8901-bcde-f23456789012")
```

**Example Response**:
```json
null
```

**Slack Formatting Notes**:
- Confirm: `Removed *teammate@mybrand.com*'s access to *Spring Gifting 2026*.`

**Edge Cases**:
- After unassignment, the member immediately loses access to the campaign data (threads, creators, etc.).
- The campaign owner always retains access regardless of assignments.

---

### `cheerful_bulk_assign_campaigns`

**Status**: NEW

**Purpose**: Assign multiple campaigns to a team member in a single operation. Skips campaigns that aren't owned by the team owner or are already assigned.

**Maps to**: `POST /api/service/v1/teams/{team_id}/campaigns/bulk-assign` (new service route needed; main route: `POST /v1/teams/{team_id}/campaigns/bulk-assign`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: owner-only (only the team owner can assign campaigns).

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| team_id | uuid | yes | — | Team ID. |
| user_id | uuid | yes | — | User ID of the team member to assign campaigns to (the ASSIGNEE). |
| campaign_ids | uuid[] | yes | — | Array of campaign IDs to assign. |

**Parameter Validation Rules**:
- `user_id` (assignee) must be an existing member of the team.
- `campaign_ids` must be a non-empty array of valid UUIDs.

**Returns**: `BulkAssignCampaignsResponse` — results of the bulk operation.

**Return Schema**:
```json
{
  "assigned": ["uuid — array of campaign IDs that were successfully assigned"],
  "skipped": ["uuid — array of campaign IDs that were skipped (not owned by team owner or already assigned)"],
  "total_assigned": "integer — count of newly assigned campaigns",
  "total_skipped": "integer — count of skipped campaigns"
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Team not found | "Team {team_id} not found" | 404 |
| Caller is not owner | "Only the team owner can assign campaigns" | 403 |
| Assignee not a team member | "User is not a member of this team" | 400 |

**Example Request**:
```
cheerful_bulk_assign_campaigns(
  team_id="d1e2f3a4-b5c6-7890-1234-567890abcdef",
  user_id="b2c3d4e5-f6a7-8901-bcde-f23456789012",
  campaign_ids=["c1c2c3c4-d5d6-e7e8-f9f0-a1a2a3a4a5a6", "d2d3d4d5-e6e7-f8f9-a0a1-b2b3b4b5b6b7", "e3e4e5e6-f7f8-a9a0-b1b2-c3c4c5c6c7c8"]
)
```

**Example Response**:
```json
{
  "assigned": [
    "c1c2c3c4-d5d6-e7e8-f9f0-a1a2a3a4a5a6",
    "d2d3d4d5-e6e7-f8f9-a0a1-b2b3b4b5b6b7"
  ],
  "skipped": [
    "e3e4e5e6-f7f8-a9a0-b1b2-c3c4c5c6c7c8"
  ],
  "total_assigned": 2,
  "total_skipped": 1
}
```

**Slack Formatting Notes**:
- Summarize: `Bulk assigned 2 campaigns to *teammate@mybrand.com*. 1 skipped (already assigned or not owned).`
- If all skipped: `No campaigns were assigned — all 3 were already assigned or not owned by you.`
- List the assigned and skipped campaign names if the agent has them (from prior `cheerful_list_campaigns` call).

**Edge Cases**:
- Campaigns NOT owned by the team owner are silently skipped (not an error). This allows bulk assignment without needing to pre-filter.
- Campaigns already assigned to the member are silently skipped.
- The operation is not atomic — some may succeed while others are skipped. The response details which were assigned vs skipped.
- The `assigned` and `skipped` arrays contain campaign ID strings (not objects).

---

## Onboarding Status

### `cheerful_get_onboarding_status`

**Status**: NEW

**Purpose**: Get the authenticated user's onboarding completion status, including their self-reported role and referral source.

**Maps to**: `GET /api/service/onboarding/status` (new service route needed — **this endpoint does not currently exist in the backend**. Currently implemented as a webapp-only Next.js API route that queries Supabase directly. A new backend service route must be created.)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: authenticated (self-only).

**Parameters**: None (user-scoped).

**Returns**: Onboarding status object.

**Return Schema**:
```json
{
  "completed": "boolean — whether onboarding has been completed",
  "role": "string | null — user's self-reported role (nullable if not yet completed)",
  "referral_source": "string | null — how user found Cheerful (nullable if not yet completed)",
  "referral_other_text": "string | null — freetext if referral_source is 'other' (nullable)",
  "walkthrough_completed": "boolean — whether the product walkthrough has been completed",
  "setup_checklist_completed": "boolean — whether the setup checklist has been completed"
}
```

**Role enum values**: `"brand-agency"`, `"creator-agency"`, `"creator"`, `"sales"`, `"other"`

**Referral source enum values**: `"google"`, `"social-media"`, `"friend"`, `"linkedin"`, `"other"`

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Onboarding record not found | Returns defaults (all false/null) | 200 (graceful) |

**Example Request**:
```
cheerful_get_onboarding_status()
```

**Example Response** (completed):
```json
{
  "completed": true,
  "role": "brand-agency",
  "referral_source": "linkedin",
  "referral_other_text": null,
  "walkthrough_completed": true,
  "setup_checklist_completed": false
}
```

**Example Response** (not completed):
```json
{
  "completed": false,
  "role": null,
  "referral_source": null,
  "referral_other_text": null,
  "walkthrough_completed": false,
  "setup_checklist_completed": false
}
```

**Slack Formatting Notes**:
- Use contextually: `User is a *brand-agency* that found Cheerful via *LinkedIn*. Onboarding complete, walkthrough done, setup checklist pending.`
- This tool is primarily for the agent to understand user context — not typically requested directly by the user.

**Edge Cases**:
- If no `user_onboarding` record exists for the user, return defaults (all false, all null). The webapp creates this record during the onboarding flow.
- **No mutation tools for onboarding**: The context engine does NOT need to complete onboarding — that's a guided UI flow with multiple interactive steps (brand description, product details, Gmail OAuth connection). The CE only reads status.
- The `role` value helps the agent tailor its communication style and feature suggestions.

**Implementation note**: This requires a **new backend endpoint** (not just a new service route). The current implementation is entirely in Next.js API routes (`/api/onboarding/status`) that query Supabase directly. The backend must add a new endpoint at `/api/service/onboarding/status` that queries the `user_onboarding` table.
