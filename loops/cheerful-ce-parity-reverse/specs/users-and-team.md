# Users & Team Domain — Tool Specifications

**Domain**: Users & Team
**Spec file**: `specs/users-and-team.md`
**Wave 2 status**: Tool design complete
**Wave 3 status**: Complete — all tools fully specified and verified against source

---

## Table of Contents

1. [User Settings](#user-settings) (1 tool)
2. [Connected Accounts (Unified View)](#connected-accounts-unified-view) (1 tool)
3. [Team Management](#team-management) (5 tools)
4. [Campaign Assignments](#campaign-assignments) (5 tools)
5. [Onboarding Status](#onboarding-status) (1 tool)

**Total**: 13 tools (0 existing + 13 new)

> **Cross-reference — Gmail accounts**: Individual Gmail account listing and sync status are in `specs/integrations.md` (`cheerful_list_gmail_accounts`). This domain's `cheerful_list_connected_accounts` provides a unified view of ALL connected accounts (Gmail + SMTP) with simplified fields.

> **Cross-reference — SMTP accounts**: Full SMTP account CRUD (create, get, update, delete, bulk import) is in `specs/integrations.md`. SMTP accounts are an integration concern; this domain covers the unified settings-page view.

> **Cross-reference — Email signatures**: Email signature CRUD (list, get, create, update, delete, for-reply) is in `specs/email.md`. Signatures are an email concern despite appearing on the settings page.

> **Service routes needed**: ZERO service routes exist for ANY user/team endpoint today. All 13 tools need new `/api/service/*` routes. Team management (6 endpoints at `/v1/teams/*`) and campaign assignments (5 endpoints at `/v1/teams/*/campaigns/*`) currently use JWT auth only. Connected accounts listing needs a new service route. Onboarding status needs a completely new backend endpoint (currently webapp-only via Supabase direct queries).

> **User profile limitation**: There is NO endpoint to update user email, name, or avatar. User profile data lives in Supabase's `auth.users` table and is managed through Supabase Auth (client SDK). The backend only reads from `auth.users`. The context engine cannot modify profile data.

> **Wave 3 corrections from Wave 2 skeletons**: 7 error conditions corrected against actual source code raise statements. See individual tool specs for details.

---

## User Settings

### `cheerful_get_user_settings`

**Status**: NEW

**Purpose**: Get the authenticated user's settings metadata (creation date, last activity timestamp).

**Maps to**: `GET /api/service/user/settings` (new service route needed; current route: `GET /user/settings` in `user.py` lines 25-45)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: authenticated (self-only — returns only the user's own settings).

**Parameters**: None (user-scoped, no filtering).

**Returns**: `UserSettingResponse` — user settings metadata. Note: the `PUT /user/settings` endpoint is a no-op placeholder with no updatable fields, so no update tool is provided.

**Return Schema**:
```json
{
  "user_id": "uuid — the user's ID (PK in user_setting table)",
  "created_at": "datetime — when settings record was created (ISO 8601, timezone-aware)",
  "updated_at": "datetime — last settings update (ISO 8601, timezone-aware)",
  "last_seen_update_at": "datetime | null — last time user viewed the updates/changelog section (nullable, timezone-aware)"
}
```

**Field Details**:

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| user_id | uuid | no | User's ID, matches `auth.users.id` |
| created_at | datetime | no | When the settings record was created. Auto-set by `server_default=func.now()` |
| updated_at | datetime | no | Last update timestamp. Auto-set by `server_default=func.now()` |
| last_seen_update_at | datetime | yes | Last time user viewed the changelog/updates section. Null if never viewed |

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
  "created_at": "2025-10-15T08:30:00+00:00",
  "updated_at": "2026-02-28T14:22:00+00:00",
  "last_seen_update_at": "2026-02-20T09:15:00+00:00"
}
```

**Slack Formatting Notes**:
- Minimal data — agent should combine with other tools (connected accounts, team info) for a full "your account" summary.
- Show `last_seen_update_at` only if user asks about changelog/updates.
- Format dates in human-readable form: "Created Oct 15, 2025 · Last active Feb 28, 2026"

**Edge Cases**:
- Settings are auto-created on first GET if they don't exist (backend handler creates with `get_or_create` pattern at lines 31-39). Tool always returns a valid response for authenticated users.
- `last_seen_update_at` is null if the user has never viewed the updates/changelog section.
- `updated_at` is initially equal to `created_at` for newly created settings.

**Service route implementation notes**: New `GET /api/service/user/settings` endpoint needed. Must accept `user_id` query param, use `verify_service_api_key` dependency, and perform the same get-or-create logic as the current JWT route. Query: `SELECT * FROM user_setting WHERE user_id = :user_id`, insert if not found.

---

## Connected Accounts (Unified View)

### `cheerful_list_connected_accounts`

**Status**: NEW

**Purpose**: List all connected email accounts (Gmail and SMTP) in a unified view, with optional filtering by account type and active status.

**Maps to**: `GET /api/service/user/connected-accounts` (new service route needed; current route: `GET /user/connected-accounts` in `user.py` lines 94-161)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: authenticated (self-only — returns only the user's own accounts).

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| account_type | enum | no | — (returns both) | Filter by type. One of: `"gmail"`, `"smtp"`. If omitted, returns both types. Maps to `AccountType` enum. |
| active_only | boolean | no | true | If true, only returns active (non-deactivated) accounts. Set to false to include deactivated/soft-deleted SMTP accounts. |

**Parameter Validation Rules**:
- `account_type` must be one of `"gmail"` or `"smtp"` if provided. Invalid values return 422 (Pydantic validation).
- `active_only` defaults to `true`. The backend Query param definition: `active_only: bool = True`.

**Returns**: Array of `ConnectedAccountResponse` objects — simplified account info with unified schema across Gmail and SMTP providers.

**Return Schema**:
```json
[
  {
    "id": "uuid — account ID (user_gmail_account.id or user_smtp_account.id)",
    "email": "string — email address (gmail_email for Gmail, email_address for SMTP)",
    "account_type": "string — 'gmail' or 'smtp' (AccountType enum)",
    "display_name": "string | null — human-readable display name",
    "is_active": "boolean — whether the account is currently active"
  }
]
```

**Field Details**:

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | uuid | no | Account ID — `user_gmail_account.id` for Gmail, `user_smtp_account.id` for SMTP |
| email | string | no | Email address — `gmail_email` for Gmail accounts, `email_address` for SMTP accounts |
| account_type | string | no | One of: `"gmail"`, `"smtp"` (AccountType enum from `account_type.py`) |
| display_name | string | yes | For Gmail: set to the `gmail_email` value (line 139 of user.py: `display_name=acct.gmail_email`). For SMTP: set to `display_name` field if provided during creation, else null |
| is_active | boolean | no | Whether the account is active. Inactive accounts are hidden when `active_only=true` |

**AccountType enum values** (verified from `src/models/database/account_type.py`): `"gmail"`, `"smtp"`

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Invalid account_type value | Validation error (Pydantic) | 422 |

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
    "display_name": "outreach@mybrand.com",
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
- Flag inactive accounts: `3. old@mybrand.com (SMTP, inactive)`
- Gmail `display_name` is the email itself — don't show it twice. For Gmail, just show the email.

**Edge Cases**:
- Returns empty array `[]` if user has no connected accounts.
- Gmail accounts' `display_name` is set to `gmail_email` (not null) — this is a correction from Wave 2 which stated Gmail display_name is always null.
- Deactivated accounts are hidden by default (`active_only=true`). Set `active_only=false` to see all including soft-deleted/deactivated SMTP accounts.
- The backend constructs `ConnectedAccountResponse` objects by iterating over Gmail accounts first, then SMTP accounts. Gmail accounts don't have a native `display_name` field — the route maps `gmail_email` to `display_name`.

**Service route implementation notes**: New `GET /api/service/user/connected-accounts` endpoint needed. Must accept `user_id`, `account_type` (optional), `active_only` (default true) query params. Query `user_gmail_account` and `user_smtp_account` tables filtered by `user_id`, combine into `ConnectedAccountResponse` list.

---

## Team Management

### `cheerful_list_teams`

**Status**: NEW

**Purpose**: List all teams the authenticated user belongs to (as owner or member), including whether the user owns any team.

**Maps to**: `GET /api/service/v1/teams/` (new service route needed; current route: `GET /v1/teams/` in `team.py` lines 90-106)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: authenticated (returns teams the user is a member of, via JOIN on `team_member` table).

**Parameters**: None (user-scoped, returns all teams for the user).

**Returns**: `UserTeamsResponse` — list of teams plus ownership flag.

**Return Schema**:
```json
{
  "teams": [
    {
      "id": "uuid — team ID",
      "name": "string — team name (1-255 chars)",
      "owner_user_id": "uuid — team owner's user ID",
      "created_at": "datetime — team creation time (ISO 8601, timezone-aware)",
      "updated_at": "datetime — last update time (ISO 8601, timezone-aware)"
    }
  ],
  "is_owner_of_any": "boolean — true if the user owns at least one team in the list"
}
```

**Field Details — TeamResponse**:

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | uuid | no | Team ID, auto-generated UUID |
| name | string | no | Team name, 1-255 characters |
| owner_user_id | uuid | no | User ID of the team owner |
| created_at | datetime | no | When the team was created |
| updated_at | datetime | no | Last time team was updated |

**Field Details — UserTeamsResponse**:

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| teams | TeamResponse[] | no | Array of teams the user belongs to (may be empty) |
| is_owner_of_any | boolean | no | True if the user owns at least one team. Computed by filtering `teams` where `owner_user_id == user_id` |

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
      "created_at": "2025-11-01T10:00:00+00:00",
      "updated_at": "2026-01-15T16:30:00+00:00"
    }
  ],
  "is_owner_of_any": true
}
```

**Slack Formatting Notes**:
- Format as a list with role context:
  ```
  Your teams:
  1. *Outreach Team* (owner) — created Nov 1, 2025
  ```
- Indicate user's role by comparing `owner_user_id` to the current user's ID.
- `is_owner_of_any` helps the agent know whether to offer admin actions (add members, assign campaigns).
- If no teams: `You don't belong to any teams yet. Would you like to create one?`

**Edge Cases**:
- Returns `{"teams": [], "is_owner_of_any": false}` if user has no teams.
- The backend uses `TeamRepository.get_teams_for_user()` which JOINs `team` with `team_member` on `team_member.user_id`. A user sees teams where they are either owner or member.
- Team owner is always listed as a member with role `"owner"` in the team's member list, but this endpoint only returns `TeamResponse` objects (no member details).

---

### `cheerful_create_team`

**Status**: NEW

**Purpose**: Create a new team. The authenticated user automatically becomes the team owner.

**Maps to**: `POST /api/service/v1/teams/` (new service route needed; current route: `POST /v1/teams/` in `team.py` lines 109-122)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: authenticated (any user can create a team).

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| name | string | yes | — | Team name. Length: 1-255 characters. Enforced by Pydantic `Field(..., min_length=1, max_length=255)`. |

**Parameter Validation Rules**:
- `name` must be between 1 and 255 characters (inclusive). Enforced by Pydantic field constraint on `TeamCreateRequest.name`.
- Empty string or string > 255 chars returns 422 (Pydantic validation error).

**Returns**: `TeamResponse` — the newly created team. HTTP 201.

**Return Schema**:
```json
{
  "id": "uuid — newly created team ID (auto-generated)",
  "name": "string — team name as provided",
  "owner_user_id": "uuid — the creating user's ID (automatically set)",
  "created_at": "datetime — creation time (ISO 8601, timezone-aware)",
  "updated_at": "datetime — same as created_at initially (ISO 8601, timezone-aware)"
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Name empty or > 255 chars | Pydantic validation error (field constraint) | 422 |

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
  "created_at": "2026-03-01T14:00:00+00:00",
  "updated_at": "2026-03-01T14:00:00+00:00"
}
```

**Slack Formatting Notes**:
- Confirm creation: `Team *Outreach Team* created! You're the owner. Add members with their email addresses.`
- Offer next action: suggest adding team members via `cheerful_add_team_member`.

**Edge Cases**:
- The creator is automatically added as a `TeamMember` with role `"owner"`. This happens inside `TeamRepository.create()` in the same transaction (lines 48-66 of repository).
- There is no unique constraint on team names — duplicate names are allowed. A user can create multiple teams with the same name.
- No limit on the number of teams a user can create.

---

### `cheerful_get_team`

**Status**: NEW

**Purpose**: Get a team's details including its full member list with roles, emails, and invitation status.

**Maps to**: `GET /api/service/v1/teams/{team_id}` (new service route needed; current route: `GET /v1/teams/{team_id}` in `team.py` lines 156-209)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: team member (user must be a member of the team — either owner or member role). Verified via `TeamMemberRepository.get_membership()`.

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
    "created_at": "datetime — creation time (ISO 8601, timezone-aware)",
    "updated_at": "datetime — last update time (ISO 8601, timezone-aware)"
  },
  "members": [
    {
      "id": "uuid — team member record ID (team_member.id)",
      "team_id": "uuid — team ID",
      "user_id": "uuid — member's user ID (auth.users.id)",
      "role": "string — 'owner' or 'member' (TeamMemberRole enum)",
      "created_at": "datetime — when member was added (ISO 8601, timezone-aware)",
      "email": "string | null — member's email from auth.users.email (nullable)",
      "avatar_url": "string | null — avatar URL from Google OAuth metadata (nullable)",
      "invited": "boolean — true if member's email_confirmed_at is null (pending invite)"
    }
  ]
}
```

**Field Details — TeamMemberResponse**:

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | uuid | no | Team member record ID (`team_member.id`), auto-generated |
| team_id | uuid | no | Team ID this membership belongs to |
| user_id | uuid | no | Member's user ID from `auth.users` |
| role | string | no | One of: `"owner"`, `"member"`. See TeamMemberRole enum |
| created_at | datetime | no | When the member was added to the team |
| email | string | yes | Member's email from `auth.users.email`. Null if auth user record not found (rare) |
| avatar_url | string | yes | Extracted from `raw_user_meta_data.avatar_url` or `raw_user_meta_data.picture` (Google OAuth). Null for email/password signups or if no metadata |
| invited | boolean | no | True when `auth.users.email_confirmed_at` is null (user received invite but hasn't confirmed). False if auth user not found |

**TeamMemberRole enum values** (verified from `src/models/database/team.py`): `"owner"`, `"member"`

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Team not found | "Team not found" | 404 |
| User not a team member | "Not a member of this team" | 403 |

> **Wave 3 correction**: Error message for non-member is `"Not a member of this team"` (verified at team.py line 177), not `"Access denied to team {team_id}"` as listed in Wave 2.

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
    "created_at": "2025-11-01T10:00:00+00:00",
    "updated_at": "2026-01-15T16:30:00+00:00"
  },
  "members": [
    {
      "id": "m1m2m3m4-a5b6-c7d8-e9f0-123456789abc",
      "team_id": "d1e2f3a4-b5c6-7890-1234-567890abcdef",
      "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "role": "owner",
      "created_at": "2025-11-01T10:00:00+00:00",
      "email": "boss@mybrand.com",
      "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocK_example",
      "invited": false
    },
    {
      "id": "m5m6m7m8-b9c0-d1e2-f3a4-567890abcdef",
      "team_id": "d1e2f3a4-b5c6-7890-1234-567890abcdef",
      "user_id": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
      "role": "member",
      "created_at": "2026-01-10T09:00:00+00:00",
      "email": "teammate@mybrand.com",
      "avatar_url": null,
      "invited": false
    },
    {
      "id": "m9m0n1n2-c3d4-e5f6-a7b8-901234567890",
      "team_id": "d1e2f3a4-b5c6-7890-1234-567890abcdef",
      "user_id": "c3d4e5f6-a7b8-9012-cdef-345678901234",
      "role": "member",
      "created_at": "2026-02-20T11:30:00+00:00",
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
- Owner is always in the members list with `role: "owner"` (added during team creation).
- `email` may be null if the `auth.users` record is not found for the member's `user_id` (rare edge case — e.g., user deleted from Supabase but team_member record persists).
- `avatar_url` is extracted from Google OAuth metadata via `_get_avatar_url()` helper (team.py lines 42-46): checks `raw_user_meta_data.avatar_url` first, then `raw_user_meta_data.picture`. Null for email/password signups.
- `invited` is computed as `auth_user.email_confirmed_at is None` — true for users who received an invite but haven't clicked the confirmation link. Set to `False` if auth user record not found.

---

### `cheerful_delete_team`

**Status**: NEW

**Purpose**: Delete a team and clean up all associated campaign assignments for non-owner members.

**Maps to**: `DELETE /api/service/v1/teams/{team_id}` (new service route needed; current route: `DELETE /v1/teams/{team_id}` in `team.py` lines 125-153)

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
| Team not found | "Team not found" | 404 |
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
- Agent should warn about the cascade effect before executing: "This will also remove campaign access for all team members. Are you sure?"

**Edge Cases**:
- **Cascade behavior** (verified at team.py lines 139-148): Deleting a team iterates over ALL team members. For each non-owner member, it calls `assignment_repo.unassign_all_for_owner_campaigns(user_id=member.user_id, campaign_owner_id=team.owner_user_id)`, which removes ALL `campaign_member_assignment` records for that member from campaigns owned by the team owner. The number of removed assignments is logged.
- The owner's own campaign access is unaffected (they own the campaigns directly, not via assignment).
- `TeamRepository.delete()` deletes the `team` row. The `team_member` table has FK to `team.id` — cascade behavior depends on DB FK constraint.
- This is a destructive, non-reversible operation. The agent should always confirm with the user before executing.

---

### `cheerful_add_team_member`

**Status**: NEW

**Purpose**: Add a new member to a team by email address. If the user doesn't have a Cheerful account, a Supabase invite email is sent automatically.

**Maps to**: `POST /api/service/v1/teams/{team_id}/members` (new service route needed; current route: `POST /v1/teams/{team_id}/members` in `team.py` lines 212-269)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: owner-only (only the team owner can add members).

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| team_id | uuid | yes | — | Team ID to add the member to. |
| user_email | string | yes | — | Email address of the person to add. No format validation in Pydantic model — just `str` with `Field(...)`. |

**Parameter Validation Rules**:
- `user_email` is a required string field (`AddTeamMemberRequest.user_email: str = Field(..., description="Email of user to add")`). No email format validation in the Pydantic model — any non-empty string is accepted. Actual validation happens when looking up or inviting the user.

**Returns**: `TeamMemberResponse` — the newly created member record. HTTP 201.

**Return Schema**:
```json
{
  "id": "uuid — team member record ID",
  "team_id": "uuid — team ID",
  "user_id": "uuid — member's user ID (may be newly created Supabase user if invited)",
  "role": "string — always 'member' for added members",
  "created_at": "datetime — when member was added (ISO 8601, timezone-aware)",
  "email": "string | null — the member's email",
  "avatar_url": "string | null — avatar URL from Google OAuth (null for email-only, invited, or non-Google users)",
  "invited": "boolean — true if the user didn't have an account and was invited via Supabase"
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Team not found | "Team not found" | 404 |
| User is not owner | "Only the team owner can add members" | 403 |
| User already a member | "User is already a member of this team" | 400 |
| Supabase invite failed | "Could not invite user: {error_message}" | 400 |

> **Wave 3 correction**: "User already a member" error is HTTP 400 (not 409 as listed in Wave 2). The route catches `ValueError` from `member_repo.add_member()` and raises `HTTPException(status_code=400, detail=str(e))` at team.py line 259. The repository raises `ValueError("User is already a member of this team")` on `IntegrityError` (unique constraint `unique_team_member`).

> **Wave 3 addition**: New error condition — Supabase invite failure. When the email doesn't match any existing user, `supabase.auth.admin.invite_user_by_email()` is called. If this fails (e.g., invalid email, Supabase error), `AuthApiError` is caught and raised as `HTTPException(status_code=400, detail=f"Could not invite user: {e.message}")` at team.py lines 244-250.

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
  "created_at": "2026-03-01T14:30:00+00:00",
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
  "created_at": "2026-03-01T14:30:00+00:00",
  "email": "brandnew@agency.com",
  "avatar_url": null,
  "invited": true
}
```

**Slack Formatting Notes**:
- If `invited: false`: `Added *newmember@agency.com* to team *Outreach Team*.`
- If `invited: true`: `Invited *brandnew@agency.com* to team *Outreach Team*. They'll receive an email to set up their account.`
- Offer next action: suggest assigning campaigns via `cheerful_assign_campaign` or `cheerful_bulk_assign_campaigns`.

**Edge Cases**:
- **Invite flow** (team.py lines 236-249): If the email doesn't match any existing Supabase user (`auth.users` table), `supabase.auth.admin.invite_user_by_email()` is called. This creates a new Supabase auth user with a pending invite. The new user's `email_confirmed_at` will be null until they accept. The invite is a built-in Supabase flow — the team owner doesn't control the invite email content.
- **Existing user flow** (team.py lines 250-252): If the email matches an existing `auth.users` record, the user is directly added as a team member. No invite email is sent.
- The owner cannot add themselves — they're already a member with role `"owner"` (added during team creation). Attempting to add the owner's email returns 400: "User is already a member of this team".
- `avatar_url` is only populated for the existing user flow (from `auth_user` metadata). For invited users, `auth_user` is None so `_get_avatar_url(auth_user)` returns None.
- The role is always `"member"` — there's no way to add someone as a co-owner via the API. `TeamMemberRole.MEMBER` is hardcoded at line 256.

---

### `cheerful_remove_team_member`

**Status**: NEW

**Purpose**: Remove a member from a team. Also removes all campaign assignments for that member from the team owner's campaigns.

**Maps to**: `DELETE /api/service/v1/teams/{team_id}/members/{member_user_id}` (new service route needed; current route: `DELETE /v1/teams/{team_id}/members/{member_user_id}` in `team.py` lines 272-314)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: owner-only (only the team owner can remove members).

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| team_id | uuid | yes | — | Team ID. |
| member_user_id | uuid | yes | — | User ID of the member to remove. Path parameter in the backend. |

**Returns**: No content. HTTP 204.

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Team not found | "Team not found" | 404 |
| User is not owner | "Only the team owner can remove members" | 403 |
| Cannot remove owner | "Cannot remove the team owner" | 400 |
| Member not found | "Member not found" | 404 |

> **Wave 3 correction**: Error message for member not found is `"Member not found"` (verified at team.py line 299), not `"Member not found in team"` as listed in Wave 2.

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
- Agent should warn about the cascade effect before executing: "This will also remove their access to all assigned campaigns. Proceed?"

**Edge Cases**:
- **Cascade behavior** (team.py lines 301-307): Removing a member calls `assignment_repo.unassign_all_for_owner_campaigns(user_id=member_user_id, campaign_owner_id=team.owner_user_id)`, which deletes ALL `campaign_member_assignment` records for that member from campaigns owned by the team owner. The count of removed assignments is logged.
- **Order of operations**: The member is removed from the team first (`member_repo.remove_member`), then assignments are cleaned up. Both happen in the same transaction (committed together).
- The team owner cannot be removed (checked at line 294: `member_user_id == team.owner_user_id` → 400). To remove the owner's involvement, delete the entire team.
- After removal, the member immediately loses access to any campaigns they were assigned to via this team.

---

## Campaign Assignments

Campaign assignments control which team members can access which campaigns. Only the team owner can assign/unassign. Campaign access is determined by: `campaign.user_id == user_id` (owner) OR `campaign_member_assignment` record exists (assigned member).

### `cheerful_list_my_campaign_assignments`

**Status**: NEW

**Purpose**: List all campaigns assigned to the authenticated user across all teams they belong to.

**Maps to**: `GET /api/service/v1/teams/my-assignments` (new service route needed; current route: `GET /v1/teams/my-assignments` in `team.py` lines 50-87)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: authenticated (returns only the user's own assignments).

**Parameters**: None (user-scoped, returns all assignments for the user).

**Returns**: `CampaignAssignmentsListResponse` — list of campaign assignments.

**Return Schema**:
```json
{
  "assignments": [
    {
      "id": "uuid — assignment record ID (campaign_member_assignment.id)",
      "campaign_id": "uuid — assigned campaign ID",
      "user_id": "uuid — the assigned user's ID (same as authenticated user)",
      "created_at": "datetime — when assignment was created (ISO 8601, timezone-aware)",
      "user_email": "null — always null in this endpoint (not populated)",
      "campaign_name": "string | null — the campaign's name (nullable if campaign deleted)"
    }
  ],
  "total": "integer — total number of assignments"
}
```

**Field Details — CampaignAssignmentResponse**:

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | uuid | no | Assignment record ID from `campaign_member_assignment.id` |
| campaign_id | uuid | no | The assigned campaign's ID |
| user_id | uuid | no | The assigned user's ID (same as the authenticated user) |
| created_at | datetime | no | When the assignment was created |
| user_email | string | yes | **Always null in this endpoint** — the route does not look up the user's email (team.py lines 71-80 construct response without `user_email` parameter, defaulting to None) |
| campaign_name | string | yes | Campaign name from `campaign.name`. Null if campaign record not found (orphaned assignment) |

> **Wave 3 note**: `user_email` is always null in this endpoint's response. The route only populates `campaign_name` via campaign lookup but does not perform an `auth.users` lookup for email. This differs from `cheerful_list_campaign_assignments` which DOES populate `user_email`.

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
      "created_at": "2026-02-15T10:00:00+00:00",
      "user_email": null,
      "campaign_name": "Spring Gifting 2026"
    },
    {
      "id": "b2b3b4b5-c6c7-d8d9-e0e1-f2f3f4f5f6f7",
      "campaign_id": "d2d3d4d5-e6e7-f8f9-a0a1-b2b3b4b5b6b7",
      "user_id": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
      "created_at": "2026-02-20T14:30:00+00:00",
      "user_email": null,
      "campaign_name": "Paid Promo Q1"
    }
  ],
  "total": 2
}
```

**Slack Formatting Notes**:
- Format as a list:
  ```
  You have 2 campaign assignments:
  1. *Spring Gifting 2026* — assigned Feb 15, 2026
  2. *Paid Promo Q1* — assigned Feb 20, 2026
  ```
- If empty: `You don't have any campaign assignments.`
- These are campaigns assigned TO the user (not campaigns they own).

**Edge Cases**:
- Returns `{"assignments": [], "total": 0}` if user has no assignments.
- This does NOT include campaigns the user owns directly — only campaigns assigned via team membership. The backend calls `assignment_repo.get_assigned_campaign_ids(user_id)` which queries `campaign_member_assignment` only.
- `campaign_name` is null if the campaign record has been deleted but the assignment record still exists (orphaned).
- If a campaign still exists but the assignment record references a campaign the user no longer has access to via team, the assignment still appears here (cleanup happens on member removal, not on individual assignment basis).

---

### `cheerful_list_campaign_assignments`

**Status**: NEW

**Purpose**: List all team member assignments for a specific campaign within a team.

**Maps to**: `GET /api/service/v1/teams/{team_id}/campaigns/{campaign_id}/assignments` (new service route needed; current route: `GET /v1/teams/{team_id}/campaigns/{campaign_id}/assignments` in `team.py` lines 319-371)

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
      "created_at": "datetime — when assignment was created (ISO 8601, timezone-aware)",
      "user_email": "string | null — assigned user's email from auth.users (nullable)",
      "campaign_name": "string | null — campaign name (nullable)"
    }
  ],
  "total": "integer — total number of assignments for this campaign"
}
```

> Note: Unlike `cheerful_list_my_campaign_assignments`, this endpoint DOES populate `user_email` by looking up each assigned user in `auth.users`.

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Team not found | "Team not found" | 404 |
| User not a team member | "Not a member of this team" | 403 |
| Campaign not found | "Campaign not found" | 404 |
| Campaign not owned by team owner | "Campaign does not belong to this team's owner" | 403 |

> **Wave 3 correction**: Error messages verified against source (team.py lines 335, 340, 347, 351): "Not a member of this team" (not "Access denied to team {team_id}"), "Campaign does not belong to this team's owner" (not "Campaign does not belong to the team owner").

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
      "created_at": "2026-02-15T10:00:00+00:00",
      "user_email": "teammate@mybrand.com",
      "campaign_name": "Spring Gifting 2026"
    }
  ],
  "total": 1
}
```

**Slack Formatting Notes**:
- Format: `*Spring Gifting 2026* is assigned to 1 member: teammate@mybrand.com`
- Multiple members: list them as a numbered list.
- If no assignments: `*Spring Gifting 2026* is not assigned to any team members.`

**Edge Cases**:
- The campaign must belong to the team owner (`campaign.user_id == team.owner_user_id`). If the campaign doesn't belong to the team owner, returns 403 even if the campaign exists.
- Returns empty list if no members are assigned to this campaign.
- The team owner's own access to the campaign is via ownership, not via assignment — so the owner typically does NOT appear in this list unless explicitly assigned.

---

### `cheerful_assign_campaign`

**Status**: NEW

**Purpose**: Assign a campaign to a team member, granting them access to view and edit the campaign.

**Maps to**: `POST /api/service/v1/teams/{team_id}/campaigns/{campaign_id}/assignments` (new service route needed; current route: `POST /v1/teams/{team_id}/campaigns/{campaign_id}/assignments` in `team.py` lines 374-433)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: owner-only (only the team owner can assign campaigns).

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| team_id | uuid | yes | — | Team ID. |
| campaign_id | uuid | yes | — | Campaign ID to assign. Must belong to the team owner. |
| user_id | uuid | yes | — | User ID of the team member to assign the campaign to. Note: this is the ASSIGNEE's user_id (a tool parameter via `AssignCampaignRequest.user_id`), not the authenticated user's user_id (which is injected via RequestContext). |

**Parameter Validation Rules**:
- `user_id` (assignee) must be an existing member of the team. Verified via `member_repo.get_membership(team_id, request.user_id)`.
- `campaign_id` must belong to the team owner (not the assignee). Verified via `campaign.user_id != team.owner_user_id`.

**Returns**: `CampaignAssignmentResponse` — the newly created assignment. HTTP 201.

**Return Schema**:
```json
{
  "id": "uuid — assignment record ID",
  "campaign_id": "uuid — campaign ID",
  "user_id": "uuid — assigned user's ID",
  "created_at": "datetime — when assignment was created (ISO 8601, timezone-aware)",
  "user_email": "string | null — assigned user's email from auth.users (nullable)",
  "campaign_name": "string | null — campaign name (nullable)"
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Team not found | "Team not found" | 404 |
| Caller is not owner | "Only the team owner can assign campaigns" | 403 |
| Assignee not a team member | "User is not a member of this team" | 400 |
| Campaign not found | "Campaign not found" | 404 |
| Campaign not owned by team owner | "Campaign does not belong to this team's owner" | 403 |
| Already assigned | "User is already assigned to this campaign" | 400 |

> **Wave 3 correction**: "Already assigned" error is HTTP 400 (not 409 as listed in Wave 2). The route catches `ValueError` from `assignment_repo.assign()` and raises `HTTPException(status_code=400, detail=str(e))` at team.py line 416. The repository checks for existing assignment before flush and raises `ValueError("User is already assigned to this campaign")`.

> **Wave 3 correction**: Campaign ownership error message is `"Campaign does not belong to this team's owner"` (team.py line 410), not `"Campaign does not belong to the team owner"`.

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
  "created_at": "2026-03-01T15:00:00+00:00",
  "user_email": "teammate@mybrand.com",
  "campaign_name": "Spring Gifting 2026"
}
```

**Slack Formatting Notes**:
- Confirm: `Assigned *Spring Gifting 2026* to *teammate@mybrand.com*.`

**Edge Cases**:
- The `user_id` parameter here is the ASSIGNEE — the person being given access. The authenticated user (team owner) is resolved via `RequestContext`. This is one of the few tools where `user_id` appears as a parameter, but it refers to a DIFFERENT user (the assignee), not the authenticated user.
- Assigning a campaign doesn't grant the member ownership — they can view/edit but can't delete, change senders, or launch the campaign (owner-only operations).
- The backend validates team membership BEFORE campaign ownership (team.py lines 395-398 check membership, then 400-410 check campaign). This means if the assignee is not a team member, you get 400 before campaign validation.
- The assignment is backed by `campaign_member_assignment` table with unique constraint `unique_campaign_assignment` on `(campaign_id, user_id)`.

---

### `cheerful_unassign_campaign`

**Status**: NEW

**Purpose**: Remove a campaign assignment from a team member, revoking their access.

**Maps to**: `DELETE /api/service/v1/teams/{team_id}/campaigns/{campaign_id}/assignments/{assignee_user_id}` (new service route needed; current route: `DELETE /v1/teams/{team_id}/campaigns/{campaign_id}/assignments/{assignee_user_id}` in `team.py` lines 436-477)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: owner-only (only the team owner can unassign campaigns).

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| team_id | uuid | yes | — | Team ID. |
| campaign_id | uuid | yes | — | Campaign ID to unassign. |
| assignee_user_id | uuid | yes | — | User ID of the member to unassign from the campaign. Path parameter in backend. |

**Returns**: No content. HTTP 204.

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Team not found | "Team not found" | 404 |
| Caller is not owner | "Only the team owner can unassign campaigns" | 403 |
| Campaign not found | "Campaign not found" | 404 |
| Campaign not owned by team owner | "Campaign does not belong to this team's owner" | 403 |
| Assignment not found | "Assignment not found" | 404 |

> **Wave 3 addition**: The unassign endpoint also validates that the campaign exists and belongs to the team owner BEFORE checking the assignment (team.py lines 455-465). Wave 2 only listed team/owner/assignment errors, missing the campaign validation step.

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
- After unassignment, the member immediately loses access to the campaign data (threads, creators, drafts, etc.).
- The campaign owner always retains access regardless of assignments (via `campaign.user_id`).
- The validation order is: team exists → caller is owner → campaign exists → campaign belongs to owner → assignment exists. Each failure returns the appropriate error before subsequent checks.

---

### `cheerful_bulk_assign_campaigns`

**Status**: NEW

**Purpose**: Assign multiple campaigns to a team member in a single operation. Skips campaigns that aren't owned by the team owner or are already assigned.

**Maps to**: `POST /api/service/v1/teams/{team_id}/campaigns/bulk-assign` (new service route needed; current route: `POST /v1/teams/{team_id}/campaigns/bulk-assign` in `team.py` lines 480-536)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: owner-only (only the team owner can assign campaigns).

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| team_id | uuid | yes | — | Team ID. |
| user_id | uuid | yes | — | User ID of the team member to assign campaigns to (the ASSIGNEE). Maps to `BulkAssignCampaignsRequest.user_id`. |
| campaign_ids | uuid[] | yes | — | Array of campaign IDs to assign. Maps to `BulkAssignCampaignsRequest.campaign_ids`. |

**Parameter Validation Rules**:
- `user_id` (assignee) must be an existing member of the team. Verified via `member_repo.get_membership(team_id, request.user_id)`.
- `campaign_ids` must be a list of valid UUIDs. No explicit min/max length validation in the Pydantic model (`list[uuid.UUID]`), but an empty list would result in 0 assigned, 0 skipped.

**Returns**: `BulkAssignCampaignsResponse` — results of the bulk operation. HTTP 201.

**Return Schema**:
```json
{
  "assigned": ["string — array of campaign ID strings that were successfully assigned"],
  "skipped": ["string — array of campaign ID strings that were skipped"],
  "total_assigned": "integer — count of newly assigned campaigns",
  "total_skipped": "integer — count of skipped campaigns"
}
```

**Field Details**:

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| assigned | string[] | no | Campaign IDs (as strings via `str(campaign_id)`) that were newly assigned |
| skipped | string[] | no | Campaign IDs (as strings) that were skipped. Reasons: campaign not found, campaign not owned by team owner, or campaign already assigned to the user |
| total_assigned | integer | no | Count of `assigned` array |
| total_skipped | integer | no | Count of `skipped` array |

> **Note**: The `assigned` and `skipped` arrays contain UUID strings (not objects). The backend calls `str(campaign_id)` when building these arrays (team.py lines 515-520).

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Team not found | "Team not found" | 404 |
| Caller is not owner | "Only the team owner can assign campaigns" | 403 |
| Assignee not a team member | "User is not a member of this team" | 400 |

> **Note**: Individual campaign failures (not found, not owned, already assigned) are NOT errors — they are silently skipped and included in the `skipped` array. Only team-level validation failures are errors.

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
- If the agent has campaign names (from prior `cheerful_list_campaigns` call), list them:
  ```
  Assigned to *teammate@mybrand.com*:
  - Spring Gifting 2026
  - Paid Promo Q1

  Skipped (1):
  - e3e4e5e6... (not found or already assigned)
  ```

**Edge Cases**:
- Campaigns NOT owned by the team owner are silently skipped (team.py line 515: `if not campaign or campaign.user_id != team.owner_user_id: skipped.append(...)`). This allows bulk assignment without needing to pre-filter.
- Campaigns already assigned to the member are silently skipped (team.py lines 518-520: `except ValueError: skipped.append(...)`). The `ValueError` from `assignment_repo.assign()` is caught and the campaign is added to `skipped`.
- The operation is not atomic per campaign — some may succeed while others are skipped. But all successful assignments are committed together in a single `db.commit()`.
- Empty `campaign_ids` list: returns `{"assigned": [], "skipped": [], "total_assigned": 0, "total_skipped": 0}`.
- The response status is always 201 even if all campaigns were skipped (route status_code=201 is hardcoded).

---

## Onboarding Status

### `cheerful_get_onboarding_status`

**Status**: NEW

**Purpose**: Get the authenticated user's onboarding completion status, including their self-reported role and referral source.

**Maps to**: `GET /api/service/onboarding/status` (new backend endpoint AND service route needed — **this endpoint does not currently exist in the backend at all**. Currently implemented as a webapp-only Next.js API route at `app/api/onboarding/status/route.ts` that queries the `user_onboarding` table via Supabase client directly.)

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

**Field Details**:

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| completed | boolean | no | Whether onboarding has been completed. Maps to `user_onboarding.onboarding_completed`. Defaults to `false` if no record exists |
| role | string | yes | User's self-reported role. Maps to `user_onboarding.user_role`. Null if onboarding not completed |
| referral_source | string | yes | How user found Cheerful. Maps to `user_onboarding.referral_source`. Null if onboarding not completed |
| referral_other_text | string | yes | Freetext explanation when `referral_source` is `"other"`. Maps to `user_onboarding.referral_other_text`. Null if not applicable or not completed |
| walkthrough_completed | boolean | no | Whether the product walkthrough has been completed. Maps to `user_onboarding.walkthrough_completed`. Defaults to `false` |
| setup_checklist_completed | boolean | no | Whether the setup checklist has been completed. Maps to `user_onboarding.setup_checklist_completed`. Defaults to `false` |

**Role enum values** (verified from `onboarding-store.ts` `ROLE_OPTIONS`):
- `"brand-agency"` — Brand Agency
- `"creator-agency"` — Creator agency
- `"creator"` — Creator
- `"sales"` — Sales
- `"other"` — Other

**Referral source enum values** (verified from `onboarding-store.ts` `REFERRAL_OPTIONS`):
- `"google"` — Google
- `"social-media"` — Social Media
- `"friend"` — Friend / Colleague
- `"linkedin"` — LinkedIn
- `"other"` — Other (with freetext via `referral_other_text`)

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Onboarding record not found | Returns defaults (all false/null) — NOT an error | 200 (graceful) |

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
- If no `user_onboarding` record exists for the user, return defaults (all false, all null). The webapp handles this at `status/route.ts` line 22: if error code is `PGRST116` (no rows found), returns default values. The new backend endpoint must replicate this behavior.
- **No mutation tools for onboarding**: The context engine does NOT need to complete onboarding — that's a guided UI flow with multiple interactive steps (welcome, connect, describe brand, product, role selection, referral, Gmail OAuth). The CE only reads status to understand user context.
- The `role` value helps the agent tailor its communication style and feature suggestions (e.g., brand agency vs creator).
- The webapp `complete` endpoint uses CSRF validation and sets a cookie — neither of which is relevant to the CE flow.

**Implementation notes**: This requires a **new backend endpoint** (not just a new service route wrapping an existing endpoint). The current implementation is entirely in Next.js API routes that query `user_onboarding` table via Supabase client. The backend must add:
1. New SQLAlchemy model for `user_onboarding` table (columns: `user_id`, `onboarding_completed`, `user_role`, `referral_source`, `referral_other_text`, `completed_at`, `walkthrough_completed`, `walkthrough_completed_at`, `setup_checklist_completed`, `setup_checklist_completed_at`, `updated_at`)
2. New Pydantic response model
3. New service route at `GET /api/service/onboarding/status` that accepts `user_id` query param
4. Query: `SELECT * FROM user_onboarding WHERE user_id = :user_id`, return defaults if no row

---

## Appendix: Verified Source Files

| File | Lines | What Was Verified |
|------|-------|-------------------|
| `src/api/route/user.py` | ~161 | User settings GET/PUT, Gmail accounts list, connected accounts list |
| `src/api/route/team.py` | ~536 | All 11 team/assignment endpoints, error messages, validation order |
| `src/models/api/user.py` | ~49 | UserSettingResponse, UserGmailAccountResponse, ConnectedAccountResponse field types |
| `src/models/api/team.py` | ~94 | All team/assignment request/response models, field constraints |
| `src/models/database/user.py` | ~67 | AuthUser, UserGmailAccount, UserSetting SQLAlchemy models |
| `src/models/database/team.py` | ~96 | Team, TeamMember, CampaignMemberAssignment models, TeamMemberRole enum, unique constraints |
| `src/models/database/account_type.py` | ~8 | AccountType enum: GMAIL, SMTP |
| `src/repositories/team.py` | ~413 | TeamRepository, TeamMemberRepository, CampaignMemberAssignmentRepository — all methods, ValueError raises |
| `webapp/app/api/onboarding/status/route.ts` | ~42 | Onboarding status query, default values, PGRST116 error handling |
| `webapp/app/api/onboarding/complete/route.ts` | ~57 | Onboarding completion upsert, CSRF, cookie |
| `webapp/app/api/onboarding/walkthrough-complete/route.ts` | ~35 | Walkthrough completion upsert |
| `webapp/app/api/onboarding/setup-checklist-complete/route.ts` | ~35 | Setup checklist completion upsert |
| `webapp/app/onboarding/stores/onboarding-store.ts` | ~70 | ROLE_OPTIONS, REFERRAL_OPTIONS, OnboardingStep enum |

## Appendix: Wave 3 Corrections from Wave 2 Skeletons

| # | Tool | Correction | Wave 2 Value | Actual Value (from source) |
|---|------|-----------|--------------|---------------------------|
| 1 | `cheerful_add_team_member` | "Already a member" HTTP status | 409 | 400 (ValueError caught → HTTPException 400) |
| 2 | `cheerful_add_team_member` | New error condition | (missing) | "Could not invite user: {message}" (400) — Supabase AuthApiError |
| 3 | `cheerful_get_team` | Non-member error message | "Access denied to team {team_id}" | "Not a member of this team" |
| 4 | `cheerful_remove_team_member` | Member not found message | "Member not found in team" | "Member not found" |
| 5 | `cheerful_assign_campaign` | "Already assigned" HTTP status | 409 | 400 (ValueError caught → HTTPException 400) |
| 6 | `cheerful_assign_campaign` | Campaign ownership message | "Campaign does not belong to the team owner" | "Campaign does not belong to this team's owner" |
| 7 | `cheerful_list_campaign_assignments` | Non-member error message | "Access denied to team {team_id}" | "Not a member of this team" |
| 8 | `cheerful_list_campaign_assignments` | Campaign ownership message | "Campaign does not belong to the team owner" | "Campaign does not belong to this team's owner" |
| 9 | `cheerful_unassign_campaign` | Missing campaign validation | (not documented) | Campaign exists + belongs to team owner checked before assignment lookup |
| 10 | `cheerful_list_connected_accounts` | Gmail display_name | "always null" | Set to `gmail_email` value (user.py line 139) |
| 11 | `cheerful_list_my_campaign_assignments` | user_email field | Populated | Always null (route does not look up user email) |
