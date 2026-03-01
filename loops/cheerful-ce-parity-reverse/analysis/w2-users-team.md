# Wave 2 Analysis: Users & Team Tool Design

**Aspect**: w2-users-team
**Date**: 2026-03-01
**Sources**: `analysis/capabilities-users-team.md`, `specs/integrations.md` (cross-reference), `specs/email.md` (cross-reference)

---

## Design Decisions

### 1. Domain Boundaries — What's NOT in this spec

Several capabilities from the w1-users-team extraction are covered by other domain specs:

- **Gmail account listing/sync**: `specs/integrations.md` — `cheerful_list_gmail_accounts`, `cheerful_get_gmail_sync_status`
- **SMTP account CRUD + bulk import**: `specs/integrations.md` — 6 SMTP tools
- **Email signature CRUD**: `specs/email.md` — 6 email signature tools
- **Campaign-scoped signatures**: `specs/campaigns.md` — 3 campaign signature tools

This spec focuses on: user settings, unified account view, team management, campaign assignments, onboarding status.

### 2. Tool Count: 13 (0 existing + 13 new)

| Sub-domain | Tools | Notes |
|-----------|-------|-------|
| User Settings | 1 | GET only — PUT is a no-op placeholder |
| Connected Accounts (Unified) | 1 | Simplified view, cross-refs integrations.md |
| Team Management | 5 | create, list, get, delete, add member, remove member |
| Campaign Assignments | 5 | list mine, list per-campaign, assign, unassign, bulk assign |
| Onboarding Status | 1 | Read-only — requires new backend endpoint |

### 3. Key Design Decisions

**`cheerful_assign_campaign` `user_id` parameter**: This is one of the few tools where `user_id` appears as an explicit parameter. Here it refers to the ASSIGNEE (the team member being given access), NOT the authenticated user. The authenticated user's identity is still injected via `RequestContext`. Documented clearly in the spec to avoid confusion.

**No onboarding mutation tools**: Onboarding is a guided interactive UI flow (7 steps including brand description, product details, Gmail OAuth). The CE only reads status — the agent uses this to understand user context and role.

**No user profile update tool**: There's no backend endpoint to update email/name/avatar. Profile data is managed by Supabase Auth (client SDK). The CE cannot modify profile data.

**Unified connected accounts**: Despite Gmail and SMTP tools existing in `specs/integrations.md`, the unified `/user/connected-accounts` endpoint provides a simplified settings-page view (type + active status). This is useful for the agent to quickly check "what accounts does this user have?" without calling multiple tools.

### 4. Service Route Gap

| Endpoint | Current Auth | Needs Service Route |
|----------|-------------|-------------------|
| `GET /user/settings` | JWT | Yes |
| `GET /user/connected-accounts` | JWT | Yes |
| `GET /v1/teams/` | JWT | Yes |
| `POST /v1/teams/` | JWT | Yes |
| `GET /v1/teams/{team_id}` | JWT | Yes |
| `DELETE /v1/teams/{team_id}` | JWT | Yes |
| `POST /v1/teams/{team_id}/members` | JWT | Yes |
| `DELETE /v1/teams/{team_id}/members/{member_user_id}` | JWT | Yes |
| `GET /v1/teams/my-assignments` | JWT | Yes |
| `GET /v1/teams/{team_id}/campaigns/{campaign_id}/assignments` | JWT | Yes |
| `POST /v1/teams/{team_id}/campaigns/{campaign_id}/assignments` | JWT | Yes |
| `DELETE /v1/teams/{team_id}/campaigns/{campaign_id}/assignments/{assignee_user_id}` | JWT | Yes |
| `POST /v1/teams/{team_id}/campaigns/bulk-assign` | JWT | Yes |
| `GET /api/onboarding/status` | **Webapp-only (Supabase direct)** | Yes — NEW BACKEND ENDPOINT needed |

**Total**: 13 new service routes needed + 1 entirely new backend endpoint (onboarding).

### 5. Permission Model Summary

| Tool | Permission |
|------|-----------|
| `cheerful_get_user_settings` | authenticated (self-only) |
| `cheerful_list_connected_accounts` | authenticated (self-only) |
| `cheerful_list_teams` | authenticated (own teams) |
| `cheerful_create_team` | authenticated |
| `cheerful_get_team` | team member |
| `cheerful_delete_team` | owner-only |
| `cheerful_add_team_member` | owner-only |
| `cheerful_remove_team_member` | owner-only |
| `cheerful_list_my_campaign_assignments` | authenticated (self-only) |
| `cheerful_list_campaign_assignments` | team member |
| `cheerful_assign_campaign` | owner-only |
| `cheerful_unassign_campaign` | owner-only |
| `cheerful_bulk_assign_campaigns` | owner-only |
| `cheerful_get_onboarding_status` | authenticated (self-only) |

### 6. Cascade Side Effects

Two tools have important cascade behavior:
- `cheerful_remove_team_member`: Also removes ALL campaign assignments for the removed member from the team owner's campaigns.
- `cheerful_delete_team`: Also removes ALL campaign assignments for ALL non-owner members from the team owner's campaigns, plus deletes all team member records.

Both documented with warnings for the agent to confirm with the user before executing.
