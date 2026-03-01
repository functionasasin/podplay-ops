# w3-users-team-full — Full OpenAPI-Level Specs

**Aspect**: w3-users-team-full
**Date**: 2026-03-01
**Duration**: ~30 min

## Summary

Full OpenAPI-level specs for ALL 13 users & team tools (0 existing + 13 new), completing the Users & Team domain. 12 source files verified across backend routes, Pydantic models, database models, repository methods, and webapp onboarding routes.

## Source Files Verified

| File | Lines | What Was Verified |
|------|-------|-------------------|
| `src/api/route/user.py` | ~161 | User settings GET/PUT, Gmail accounts list, connected accounts list |
| `src/api/route/team.py` | ~536 | All 11 team/assignment endpoints, error messages, validation order |
| `src/models/api/user.py` | ~49 | UserSettingResponse, UserGmailAccountResponse, ConnectedAccountResponse |
| `src/models/api/team.py` | ~94 | All request/response models, Pydantic field constraints |
| `src/models/database/user.py` | ~67 | AuthUser, UserGmailAccount, UserSetting SQLAlchemy models |
| `src/models/database/team.py` | ~96 | Team, TeamMember, CampaignMemberAssignment, TeamMemberRole enum |
| `src/models/database/account_type.py` | ~8 | AccountType enum: GMAIL, SMTP |
| `src/repositories/team.py` | ~413 | All repository methods, ValueError raises, access control helpers |
| `webapp/app/api/onboarding/status/route.ts` | ~42 | Status query, defaults, PGRST116 handling |
| `webapp/app/api/onboarding/complete/route.ts` | ~57 | Completion upsert, CSRF, cookie |
| `webapp/app/api/onboarding/walkthrough-complete/route.ts` | ~35 | Walkthrough upsert |
| `webapp/app/onboarding/stores/onboarding-store.ts` | ~70 | ROLE_OPTIONS (5), REFERRAL_OPTIONS (5), OnboardingStep enum |

## Key Findings

### 11 Corrections from Wave 2

1. `cheerful_add_team_member` — "already a member" is 400 (not 409). ValueError from `add_member()` caught → HTTPException(400).
2. `cheerful_add_team_member` — NEW error: "Could not invite user: {message}" (400) from Supabase AuthApiError.
3. `cheerful_get_team` — non-member error is "Not a member of this team" (not "Access denied to team {team_id}").
4. `cheerful_remove_team_member` — member not found is "Member not found" (not "Member not found in team").
5. `cheerful_assign_campaign` — "already assigned" is 400 (not 409). ValueError from `assign()` caught → HTTPException(400).
6. `cheerful_assign_campaign` — ownership error is "Campaign does not belong to this team's owner" (subtle wording difference).
7. `cheerful_list_campaign_assignments` — same 2 error message corrections as #3 and #6.
8. `cheerful_unassign_campaign` — also validates campaign exists + belongs to team owner (Wave 2 missed these checks).
9. `cheerful_list_connected_accounts` — Gmail display_name is set to gmail_email (not null).
10. `cheerful_list_my_campaign_assignments` — user_email is always null (route doesn't look up user email).
11. `cheerful_add_team_member` — no email format validation in Pydantic model (just `str` field).

### Service Route Gaps

ZERO service routes exist for ANY user/team endpoint. All 13 tools need new `/api/service/*` routes. The onboarding status tool additionally needs a completely new backend endpoint (currently webapp-only).

### Repository Insights

- `TeamMemberRepository.add_member()` raises `ValueError("User is already a member of this team")` on IntegrityError (unique constraint `unique_team_member`).
- `CampaignMemberAssignmentRepository.assign()` raises `ValueError("User is already assigned to this campaign")` — checks existence BEFORE flush to avoid rollback issues in bulk operations.
- `CampaignMemberAssignmentRepository.unassign_all_for_owner_campaigns()` is the cascade method — JOINs assignment with campaign to filter by owner, returns count removed.
- `CampaignMemberAssignmentRepository` has additional access control helpers (`can_access_campaign`, `can_access_campaign_with_team_check`, `can_access_thread`, `can_send_via_campaign_assignment`, `can_send_via_campaign_assignment_smtp`) that are used by other domains but not directly by team management endpoints.

### Enums Verified

- **AccountType** (account_type.py): `"gmail"`, `"smtp"`
- **TeamMemberRole** (team.py): `"owner"`, `"member"`
- **Onboarding roles** (onboarding-store.ts): `"brand-agency"`, `"creator-agency"`, `"creator"`, `"sales"`, `"other"`
- **Referral sources** (onboarding-store.ts): `"google"`, `"social-media"`, `"friend"`, `"linkedin"`, `"other"`
