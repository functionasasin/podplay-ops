# Parity Matrix — Cheerful Frontend → Context Engine Tools

**Purpose**: Every user action in the Cheerful webapp mapped to a context engine tool. This matrix is the definitive coverage audit.

**Legend**:
- `EXISTS` — Tool already implemented in the context engine (7 original tools)
- `NEW` — Tool defined in this spec set, needs implementation
- `N/A` — No CE tool needed: client-side only, auth flow, browser UI, or SSE streaming handled by another tool
- `WEBAPP-ONLY` — Webapp-only Next.js API route with no backend service endpoint (CE would need a new backend service route)

**Total unique tools**: 126
**Existing tools**: 7
**New tools to implement**: 119
**Coverage**: 100% of backend-accessible actions

---

## Table of Contents

1. [Auth Routes](#auth-routes)
2. [Onboarding Routes](#onboarding-routes)
3. [Dashboard (`/dashboard`)](#dashboard-dashboard)
4. [Mail Inbox (`/mail`)](#mail-inbox-mail)
5. [Campaigns List (`/campaigns`)](#campaigns-list-campaigns)
6. [Campaign Creation Wizard (`/campaigns/new`)](#campaign-creation-wizard-campaignsnew)
7. [Campaign Detail (`/campaigns/[id]`)](#campaign-detail-campaignsid)
8. [Creator Lists (`/lists`)](#creator-lists-lists)
9. [Creator List Detail (`/lists/[id]`)](#creator-list-detail-listsid)
10. [Creator Discovery Search (`/search`)](#creator-discovery-search-search)
11. [Team Management (`/team`)](#team-management-team)
12. [Settings (`/settings`)](#settings-settings)
13. [Cross-Campaign & Global Operations](#cross-campaign--global-operations)
14. [Workflows (Campaign Automation)](#workflows-campaign-automation)
15. [Integration Configuration](#integration-configuration)
16. [Creator Public Profiles & Posts](#creator-public-profiles--posts)
17. [Webapp-Only Features (No CE Tool Possible)](#webapp-only-features-no-ce-tool-possible)

---

## Auth Routes

Auth routes are handled entirely by Supabase client-side SDK. No context engine tools are needed — the CE identifies users via the hardcoded `SLACK_USER_MAPPING` in `constants.py`, not via session tokens.

| Frontend Page/Feature | User Action | Context Engine Tool | Status |
|----------------------|-------------|---------------------|--------|
| `/sign-in` | Log in with email + password | N/A — Supabase client auth | N/A |
| `/sign-in` | Log in with Google OAuth | N/A — Supabase OAuth flow | N/A |
| `/forgot-password` | Initiate password reset | N/A — Supabase auth | N/A |
| `/reset-password` | Complete password reset with token | N/A — Supabase auth | N/A |
| `/set-password` | Set first-time password (invite flow) | N/A — Supabase auth | N/A |
| `/auth/oauth-popup-callback` | Receive Gmail OAuth result in popup | N/A — OAuth popup handler | N/A |

---

## Onboarding Routes

The onboarding funnel is primarily client-side state with one backend completion call. The CE surfaces onboarding status but cannot execute the onboarding wizard steps themselves (they depend on browser navigation + Supabase session state).

| Frontend Page/Feature | User Action | Context Engine Tool | Status |
|----------------------|-------------|---------------------|--------|
| `/onboarding` | View welcome screen | N/A — presentation only | N/A |
| `/onboarding/connect` | View integrations showcase | N/A — presentation only | N/A |
| `/onboarding/describe` | Enter brand description | N/A — client state only | N/A |
| `/onboarding/product` | Enter product details | N/A — client state only | N/A |
| `/onboarding/role` | Select role (Brand Agency / Creator Agency / Creator / Sales / Other) | N/A — client state only | N/A |
| `/onboarding/referral` | Select referral source → complete onboarding | N/A — calls `/api/user/onboarding` via webapp session | N/A |
| `/onboarding/connect-email` | Connect Gmail account via OAuth popup | N/A — OAuth flow | N/A |
| Sidebar setup checklist | Check onboarding + setup status | `cheerful_get_onboarding_status` | NEW |
| Sidebar setup checklist | Check connected email credentials | `cheerful_list_gmail_accounts` | NEW |
| Sidebar setup checklist | Check if campaigns exist | `cheerful_list_campaigns` | EXISTS |

---

## Dashboard (`/dashboard`)

| Frontend Page/Feature | User Action | Context Engine Tool | Status |
|----------------------|-------------|---------------------|--------|
| `/dashboard` | View all dashboard metrics (creator count, response rate, emails sent, opt-in rate, follow-up stats, pipeline) | `cheerful_get_dashboard_analytics` | NEW |
| `/dashboard` — active campaigns table | View active campaigns with metrics | `cheerful_get_dashboard_analytics` | NEW |
| `/dashboard` — pipeline cards | View gifting/paid pipeline stats | `cheerful_get_dashboard_analytics` | NEW |
| `/dashboard` — recent opt-ins | View recent opt-in activity | `cheerful_get_dashboard_analytics` | NEW |
| `/dashboard` — walkthrough modal | View setup walkthrough (first-time) | N/A — client UI only | N/A |
| `/dashboard` — welcome modal | Dismiss welcome modal | N/A — client UI only | N/A |

---

## Mail Inbox (`/mail`)

### Thread List Views

| Frontend Page/Feature | User Action | Context Engine Tool | Status |
|----------------------|-------------|---------------------|--------|
| `/mail?view=pending` | View pending threads | `cheerful_list_threads` | NEW |
| `/mail?view=sent` | View sent threads | `cheerful_list_threads` | NEW |
| `/mail?view=ignored` | View ignored/hidden threads | `cheerful_list_threads` | NEW |
| `/mail?view=drafts` | View draft threads (awaiting review) | `cheerful_list_threads` | NEW |
| Mail thread list | Filter by Gmail account | `cheerful_list_threads` | NEW |
| Mail thread list | Filter by campaign(s) | `cheerful_list_threads` | NEW |
| Mail thread list | Toggle "include uncategorized" threads | `cheerful_list_threads` | NEW |
| Mail thread list | Search threads by text (subject/sender) | `cheerful_search_emails` | EXISTS |
| Mail thread list | View thread item (subject, sender, status badge, flags) | `cheerful_list_threads` | NEW |
| Mail thread counts badge | View thread counts by status | N/A — derived from thread list | N/A |

### Thread Detail

| Frontend Page/Feature | User Action | Context Engine Tool | Status |
|----------------------|-------------|---------------------|--------|
| Thread detail view | Open and read full thread (all messages) | `cheerful_get_thread` | EXISTS |
| Thread detail view | View message attachments | `cheerful_list_message_attachments` | NEW |
| Thread detail view | Get AI-generated thread summary | `cheerful_get_thread_summary` | NEW |
| Thread detail view | Find similar emails (semantic search) | `cheerful_find_similar_emails` | EXISTS |
| Thread list | Hide thread (move to Ignored) | `cheerful_hide_thread` | NEW |
| Thread detail header | Unhide thread (return to Pending) | `cheerful_unhide_thread` | NEW |

### Reply Compose & Draft Management

| Frontend Page/Feature | User Action | Context Engine Tool | Status |
|----------------------|-------------|---------------------|--------|
| Reply composer | View existing draft for thread | `cheerful_get_thread_draft` | NEW |
| Reply composer | Create new draft | `cheerful_create_thread_draft` | NEW |
| Reply composer | Update draft (keystroke auto-save) | `cheerful_update_thread_draft` | NEW |
| Reply composer | Send email reply immediately | `cheerful_send_email` | NEW |
| Reply composer | Schedule email for future send | `cheerful_schedule_email` | NEW |
| Thread detail — scheduled indicator | View scheduled email details | `cheerful_list_scheduled_emails` | NEW |
| Thread detail — cancel schedule | Cancel a scheduled email | `cheerful_cancel_scheduled_email` | NEW |
| Thread detail — reschedule | Change send time of scheduled email | `cheerful_reschedule_email` | NEW |

### AI Features (Cheerify & Bulk Edit)

| Frontend Page/Feature | User Action | Context Engine Tool | Status |
|----------------------|-------------|---------------------|--------|
| Reply composer — Cheerify dropdown | Shorten email | `cheerful_improve_email_content` | NEW |
| Reply composer — Cheerify dropdown | Expand email | `cheerful_improve_email_content` | NEW |
| Reply composer — Cheerify dropdown | Make friendlier | `cheerful_improve_email_content` | NEW |
| Reply composer — Cheerify dropdown | Make more professional | `cheerful_improve_email_content` | NEW |
| Reply composer — Cheerify dropdown | Make more casual | `cheerful_improve_email_content` | NEW |
| Reply composer — Cheerify dropdown | Apply custom instruction | `cheerful_improve_email_content` | NEW |
| Bulk edit prompt bar | Apply edit instruction to all drafts in campaign | `cheerful_bulk_edit_drafts` | NEW |
| Reply composer — classify edit | Classify draft edit for bulk offer | N/A — WEBAPP-ONLY (`/api/classify-edit`) | N/A |
| Reply composer — rule suggestion | Generate rule suggestion from edit | N/A — WEBAPP-ONLY (`/api/rules-suggestion`) | N/A |

### Email Signatures (Mail Context)

| Frontend Page/Feature | User Action | Context Engine Tool | Status |
|----------------------|-------------|---------------------|--------|
| Reply composer | Auto-load signature for reply | `cheerful_get_email_signatures_for_reply` | NEW |

---

## Campaigns List (`/campaigns`)

| Frontend Page/Feature | User Action | Context Engine Tool | Status |
|----------------------|-------------|---------------------|--------|
| `/campaigns` | View all campaigns (list with search/filter) | `cheerful_list_campaigns` | EXISTS |
| Campaign card | View campaign name, type, status, creator count | `cheerful_list_campaigns` | EXISTS |
| Campaign card — warning indicator | Check for Google Sheets access issues | `cheerful_list_campaigns` | EXISTS |

---

## Campaign Creation Wizard (`/campaigns/new`)

### Wizard Meta-Actions (Draft System)

| Frontend Page/Feature | User Action | Context Engine Tool | Status |
|----------------------|-------------|---------------------|--------|
| `/campaigns/new` | Resume a saved draft (`?draft=<id>`) | `cheerful_get_campaign_draft` | NEW |
| Any wizard step | Auto-save wizard state as draft | `cheerful_save_campaign_draft` | NEW |
| Any wizard step | Update existing draft | `cheerful_update_campaign_draft` | NEW |
| Draft badge on campaign card | Delete a campaign draft | `cheerful_delete_campaign_draft` | NEW |

### Step 0: Campaign Type Selection

| Frontend Page/Feature | User Action | Context Engine Tool | Status |
|----------------------|-------------|---------------------|--------|
| Step 0 | Select user type (Advertiser / Creator / Salesperson) | N/A — client wizard state only | N/A |

### Step 1: Campaign Details

| Frontend Page/Feature | User Action | Context Engine Tool | Status |
|----------------------|-------------|---------------------|--------|
| Step 1 | Enter campaign name | N/A — wizard state (saved via draft) | N/A |
| Step 1 | Select campaign type (seeding / paid / sales / creator) | N/A — wizard state (saved via draft) | N/A |
| Step 1 | Select email accounts | `cheerful_list_gmail_accounts` | NEW |
| Step 1 | Get AI-suggested email accounts | N/A — WEBAPP-ONLY (`/api/suggest-campaign-emails`) | N/A |

### Step 2: Product Information

| Frontend Page/Feature | User Action | Context Engine Tool | Status |
|----------------------|-------------|---------------------|--------|
| Step 2 | Scrape product info from URL | N/A — WEBAPP-ONLY (`POST /products/scrape` → Firecrawl) | N/A |
| Step 2 | Create new product | `cheerful_create_product` | NEW |
| Step 2 | Search existing products | `cheerful_list_products` | NEW |
| Step 2 | Select existing product | `cheerful_get_product` | NEW |
| Step 2 (creator flow) | Enter media kit link, demographics, rate info | N/A — wizard state (saved via draft) | N/A |

### Step 3: Creators

| Frontend Page/Feature | User Action | Context Engine Tool | Status |
|----------------------|-------------|---------------------|--------|
| Step 3 — Upload CSV tab | Upload creator CSV file | `cheerful_upload_campaign_recipients_csv` | NEW |
| Step 3 — Upload CSV tab | Get required CSV columns for campaign type | `cheerful_get_campaign_required_columns` | NEW |
| Step 3 — Search tab | Search creators by keyword | `cheerful_search_creators_by_keyword` | NEW |
| Step 3 — Search tab | Search similar creators (by handle/URL) | `cheerful_search_similar_creators` | NEW |
| Step 3 — Search tab | Add search result creators to campaign | `cheerful_add_campaign_recipients_from_search` | NEW |
| Step 3 — Import from Lists tab | View creator lists for import | `cheerful_list_creator_lists` | NEW |
| Step 3 — Import from Lists tab | Add creators from list to campaign | `cheerful_add_list_creators_to_campaign` | NEW |
| Step 3 — Brief search | Trigger brief-based creator search (Apify) | N/A — WEBAPP-ONLY (PDF extract → Apify) | N/A |

### Step 3b: Paid Intermediate

| Frontend Page/Feature | User Action | Context Engine Tool | Status |
|----------------------|-------------|---------------------|--------|
| Step 3b | Configure paid deal parameters | N/A — wizard state (saved via draft) | N/A |

### Step 4: Email Sequence

| Frontend Page/Feature | User Action | Context Engine Tool | Status |
|----------------------|-------------|---------------------|--------|
| Step 4 — Email Sequence tab | Author initial email (subject + body) | N/A — wizard state (saved via draft) | N/A |
| Step 4 — Email Sequence tab | Add follow-up email | N/A — wizard state (saved via draft) | N/A |
| Step 4 — Email Sequence tab | AI rewrite email/follow-up | N/A — WEBAPP-ONLY (AI generation endpoint) | N/A |
| Step 4 — Opt-In/Opt-Out tab | Author opt-in / opt-out emails | N/A — wizard state (saved via draft) | N/A |
| Step 4 — Signature tab | Edit email signature | N/A — wizard state (saved via draft) | N/A |
| Step 4 — Merge tags validation | Get merge tags for campaign | `cheerful_get_campaign_merge_tags` | NEW |

### Step 5: Goals & FAQs

| Frontend Page/Feature | User Action | Context Engine Tool | Status |
|----------------------|-------------|---------------------|--------|
| Step 5 | Enter campaign goal / deliverables / deal structure | N/A — wizard state (saved via draft) | N/A |
| Step 5 — FAQs | Add / edit / delete FAQ entries | N/A — wizard state (saved via draft) | N/A |
| Step 5 — AI generation | Generate FAQs and goals automatically | N/A — WEBAPP-ONLY (AI endpoint in wizard flow) | N/A |

### Step 6: Integrations

| Frontend Page/Feature | User Action | Context Engine Tool | Status |
|----------------------|-------------|---------------------|--------|
| Step 6 — Google Sheets | Get Google Sheet tabs (validation + selection) | `cheerful_get_google_sheet_tabs` | NEW |
| Step 6 — Google Sheets | Validate sheet access | `cheerful_get_google_sheet_tabs` | NEW |
| Step 6 — Shopify | Validate GoAffPro token | `cheerful_list_shopify_products` | NEW |
| Step 6 — Shopify | List Shopify products for order config | `cheerful_list_shopify_products` | NEW |
| Step 6 — Slack | Enter Slack channel ID | N/A — wizard state (saved via draft) | N/A |
| Step 6 — Tracking rules | Generate AI tracking rules | N/A — WEBAPP-ONLY (AI generation endpoint) | N/A |

### Step 7: Review & Launch

| Frontend Page/Feature | User Action | Context Engine Tool | Status |
|----------------------|-------------|---------------------|--------|
| Step 7 | Review campaign settings summary | `cheerful_get_campaign_draft` | NEW |
| Step 7 — Launch button | Launch campaign (all-in-one 22-step orchestration) | `cheerful_launch_campaign` | NEW |
| Step 7 — automation level | Toggle manual vs semi-automated | N/A — wizard state (saved via draft) | N/A |
| Step 7 — lookalike suggestions | Toggle lookalike suggestions on/off | N/A — wizard state (saved via draft) | N/A |

---

## Campaign Detail (`/campaigns/[id]`)

### Campaign Management

| Frontend Page/Feature | User Action | Context Engine Tool | Status |
|----------------------|-------------|---------------------|--------|
| Campaign detail header | View campaign details | `cheerful_get_campaign` | NEW |
| Campaign detail settings | Edit campaign settings (name, goal, rules, FAQs) | `cheerful_update_campaign` | NEW |
| Campaign detail — danger zone | Delete campaign | `cheerful_delete_campaign` | NEW |
| Campaign card context menu | Duplicate campaign | `cheerful_duplicate_campaign` | NEW |
| Campaign detail — AI summary | Generate natural-language campaign summary | `cheerful_generate_campaign_summary` | NEW |

### Creators Tab

| Frontend Page/Feature | User Action | Context Engine Tool | Status |
|----------------------|-------------|---------------------|--------|
| Creators tab | View creators with status, threads, enrichment | `cheerful_list_campaign_creators` | EXISTS |
| Creator row | View full creator profile | `cheerful_get_campaign_creator` | EXISTS |
| Creators tab — add button | Add creators by handle/email (bulk upsert) | `cheerful_add_campaign_recipients` | NEW |
| Creators tab — add from search | Add creators from IC/Apify search | `cheerful_add_campaign_recipients_from_search` | NEW |
| Creators tab — CSV upload | Upload CSV to add/update creators | `cheerful_upload_campaign_recipients_csv` | NEW |
| Creators tab — enrichment status | View overall enrichment progress | `cheerful_get_campaign_enrichment_status` | NEW |
| Creator row — enrich button | Start individual creator enrichment workflow | `cheerful_start_creator_enrichment` | NEW |
| Creator row — enrichment poll | Poll enrichment workflow status | `cheerful_get_enrichment_workflow_status` | NEW |
| Creator row — override email | Manually set creator email override | `cheerful_override_creator_email` | NEW |

### Recipients / Outbox Tab

| Frontend Page/Feature | User Action | Context Engine Tool | Status |
|----------------------|-------------|---------------------|--------|
| Recipients tab | View all campaign recipients (unified view) | `cheerful_list_campaign_recipients` | NEW |
| Recipients tab — filter by status | Filter recipients by enrichment/email status | `cheerful_list_campaign_recipients` | NEW |
| Outbox section | Populate outbox queue (pre-launch validation) | `cheerful_populate_campaign_outbox` | NEW |
| Outbox section | View outbox queue items | `cheerful_get_campaign_outbox` | NEW |

### Senders / Email Accounts Tab

| Frontend Page/Feature | User Action | Context Engine Tool | Status |
|----------------------|-------------|---------------------|--------|
| Senders section | Update sender configuration for campaign | `cheerful_update_campaign_sender` | NEW |
| Senders section | Remove sender from campaign | `cheerful_remove_campaign_sender` | NEW |

### Signature Tab

| Frontend Page/Feature | User Action | Context Engine Tool | Status |
|----------------------|-------------|---------------------|--------|
| Campaign signature settings | View campaign-specific signature | `cheerful_get_campaign_signature` | NEW |
| Campaign signature settings | Update campaign-specific signature | `cheerful_update_campaign_signature` | NEW |
| Campaign signature settings | List all signatures for campaign | `cheerful_list_campaign_signatures` | NEW |

### Workflows Tab

| Frontend Page/Feature | User Action | Context Engine Tool | Status |
|----------------------|-------------|---------------------|--------|
| Workflows tab | View campaign workflows | `cheerful_list_campaign_workflows` | NEW |
| Workflow row | View workflow details | `cheerful_get_campaign_workflow` | NEW |
| Workflow creation | Create new campaign workflow | `cheerful_create_campaign_workflow` | NEW |
| Workflow editor | Update workflow configuration | `cheerful_update_campaign_workflow` | NEW |
| Workflow settings | Delete workflow | `cheerful_delete_campaign_workflow` | NEW |
| Workflow tab — executions | View execution history for campaign | `cheerful_list_workflow_executions` | NEW |
| Thread in mail | View workflow execution for specific thread | `cheerful_get_thread_workflow_execution` | NEW |
| Workflow builder | Browse available tool library | `cheerful_list_workflow_tools` | NEW |

---

## Creator Lists (`/lists`)

| Frontend Page/Feature | User Action | Context Engine Tool | Status |
|----------------------|-------------|---------------------|--------|
| `/lists` | View all creator lists | `cheerful_list_creator_lists` | NEW |
| New list button | Create a new creator list | `cheerful_create_creator_list` | NEW |

---

## Creator List Detail (`/lists/[id]`)

| Frontend Page/Feature | User Action | Context Engine Tool | Status |
|----------------------|-------------|---------------------|--------|
| List detail header | View list metadata | `cheerful_get_creator_list` | NEW |
| List settings | Update list name/description | `cheerful_update_creator_list` | NEW |
| List settings — danger zone | Delete list | `cheerful_delete_creator_list` | NEW |
| List detail — creator table | View creators in list with handles, enrichment | `cheerful_list_creator_list_items` | NEW |
| List detail — add creators | Add creators by handle to list | `cheerful_add_creators_to_list` | NEW |
| List detail — add from search | Add IC/Apify search results to list | `cheerful_add_search_creators_to_list` | NEW |
| List detail — CSV upload | Add creators from CSV to list | `cheerful_add_csv_creators_to_list` | NEW |
| Creator row — remove button | Remove creator from list | `cheerful_remove_creator_from_list` | NEW |
| List detail — add to campaign | Add all list creators to a campaign | `cheerful_add_list_creators_to_campaign` | NEW |

---

## Creator Discovery Search (`/search`)

### Keyword & Similar Search

| Frontend Page/Feature | User Action | Context Engine Tool | Status |
|----------------------|-------------|---------------------|--------|
| Search page — keyword mode | Search Instagram/YouTube creators by keyword | `cheerful_search_creators_by_keyword` | NEW |
| Search page — similar mode | Search creators similar to a given handle/URL | `cheerful_search_similar_creators` | NEW |
| Search results | View creator profiles from search | `cheerful_get_creator_profile` | NEW |
| Search results — enrich button | Enrich a creator to get email via Apify | `cheerful_enrich_creator` | NEW |

### Lookalike Suggestions

| Frontend Page/Feature | User Action | Context Engine Tool | Status |
|----------------------|-------------|---------------------|--------|
| Campaign detail — suggestions | View lookalike creator suggestions for campaign | `cheerful_list_lookalike_suggestions` | NEW |
| Suggestion card — accept | Accept a single lookalike suggestion | `cheerful_update_lookalike_suggestion` | NEW |
| Suggestion card — reject | Reject a single lookalike suggestion | `cheerful_update_lookalike_suggestion` | NEW |
| Suggestions — bulk accept | Accept all pending suggestions | `cheerful_bulk_accept_lookalike_suggestions` | NEW |
| Suggestions — bulk reject | Reject all pending suggestions | `cheerful_bulk_reject_lookalike_suggestions` | NEW |
| YouTube lookalikes feature | Find YouTube channels similar to a seed | `cheerful_find_youtube_lookalikes` | NEW |
| Brand lookup | Look up a brand by name/URL | `cheerful_lookup_brand` | NEW |

### Search-to-Campaign/List Actions

| Frontend Page/Feature | User Action | Context Engine Tool | Status |
|----------------------|-------------|---------------------|--------|
| Search results — add to campaign | Add selected search creators to campaign | `cheerful_add_campaign_recipients_from_search` | NEW |
| Search results — add to list | Add selected search creators to a list | `cheerful_add_search_creators_to_list` | NEW |

---

## Team Management (`/team`)

### Team CRUD

| Frontend Page/Feature | User Action | Context Engine Tool | Status |
|----------------------|-------------|---------------------|--------|
| `/team` sidebar | View all teams | `cheerful_list_teams` | NEW |
| New team button | Create a new team | `cheerful_create_team` | NEW |
| Team card | View team details (members, assignments) | `cheerful_get_team` | NEW |
| Team settings — danger zone | Delete team | `cheerful_delete_team` | NEW |

### Member Management

| Frontend Page/Feature | User Action | Context Engine Tool | Status |
|----------------------|-------------|---------------------|--------|
| Team detail — members tab | Add team member by email | `cheerful_add_team_member` | NEW |
| Team detail — members tab | Remove team member | `cheerful_remove_team_member` | NEW |

### Campaign Assignments

| Frontend Page/Feature | User Action | Context Engine Tool | Status |
|----------------------|-------------|---------------------|--------|
| Team detail — assignments tab | View all campaign assignments for team | `cheerful_list_campaign_assignments` | NEW |
| Assignment modal | Assign campaign to team member | `cheerful_assign_campaign` | NEW |
| Assignments tab — unassign | Remove campaign assignment | `cheerful_unassign_campaign` | NEW |
| Assignments tab — bulk assign | Assign multiple campaigns at once | `cheerful_bulk_assign_campaigns` | NEW |
| Team member view | View my own campaign assignments | `cheerful_list_my_campaign_assignments` | NEW |

---

## Settings (`/settings`)

### Email Settings Tab

| Frontend Page/Feature | User Action | Context Engine Tool | Status |
|----------------------|-------------|---------------------|--------|
| Settings — email tab | View all connected accounts (Gmail + SMTP) | `cheerful_list_connected_accounts` | NEW |
| Settings — email tab | List Gmail accounts only | `cheerful_list_gmail_accounts` | NEW |
| Settings — connect Gmail button | Connect a Gmail account via OAuth | N/A — webapp OAuth flow only | N/A |
| Settings — SMTP section | View SMTP accounts | `cheerful_list_smtp_accounts` | NEW |
| Settings — SMTP section | View single SMTP account details | `cheerful_get_smtp_account` | NEW |
| Settings — add SMTP button | Add SMTP account (with IMAP verification) | `cheerful_create_smtp_account` | NEW |
| Settings — SMTP edit | Update SMTP account settings | `cheerful_update_smtp_account` | NEW |
| Settings — SMTP delete | Delete SMTP account (permanent) | `cheerful_delete_smtp_account` | NEW |
| Settings — SMTP bulk import | Import multiple SMTP accounts from CSV/JSON | `cheerful_bulk_import_smtp_accounts` | NEW |

### Signatures Settings

| Frontend Page/Feature | User Action | Context Engine Tool | Status |
|----------------------|-------------|---------------------|--------|
| Settings — signatures section | View all user email signatures | `cheerful_list_email_signatures` | NEW |
| Settings — add signature | Create a new email signature | `cheerful_create_email_signature` | NEW |
| Settings — signature row | View signature by ID | `cheerful_get_email_signature` | NEW |
| Settings — signature edit | Update email signature | `cheerful_update_email_signature` | NEW |
| Settings — signature delete | Delete email signature | `cheerful_delete_email_signature` | NEW |

### Profile / User Settings

| Frontend Page/Feature | User Action | Context Engine Tool | Status |
|----------------------|-------------|---------------------|--------|
| Settings — profile tab | View user settings | `cheerful_get_user_settings` | NEW |

### Team Settings Tab

| Frontend Page/Feature | User Action | Context Engine Tool | Status |
|----------------------|-------------|---------------------|--------|
| Settings — team tab | View teams (redirects to `/team` functionality) | `cheerful_list_teams` | NEW |
| Settings — team tab | Add team member | `cheerful_add_team_member` | NEW |
| Settings — team tab | Remove team member | `cheerful_remove_team_member` | NEW |

---

## Cross-Campaign & Global Operations

| Frontend Page/Feature | User Action | Context Engine Tool | Status |
|----------------------|-------------|---------------------|--------|
| Global search | Search creators across all campaigns | `cheerful_search_campaign_creators` | EXISTS |
| Any page — notification | Check for Google Sheets access warnings | `cheerful_list_campaigns` | EXISTS |

---

## Workflows (Campaign Automation)

*(covered in Campaign Detail — Workflows Tab above; repeated here for completeness)*

| Frontend Page/Feature | User Action | Context Engine Tool | Status |
|----------------------|-------------|---------------------|--------|
| Workflow builder | List available tool types | `cheerful_list_workflow_tools` | NEW |
| Campaign workflows | List all workflows for campaign | `cheerful_list_campaign_workflows` | NEW |
| Workflow detail | Get single workflow details | `cheerful_get_campaign_workflow` | NEW |
| Workflow creation | Create new workflow | `cheerful_create_campaign_workflow` | NEW |
| Workflow editor | Update workflow | `cheerful_update_campaign_workflow` | NEW |
| Workflow settings | Delete workflow | `cheerful_delete_campaign_workflow` | NEW |
| Workflow history | List execution history | `cheerful_list_workflow_executions` | NEW |
| Thread detail — workflow badge | Get execution for specific thread | `cheerful_get_thread_workflow_execution` | NEW |

---

## Integration Configuration

*(used within wizard Step 6 and in campaign settings)*

| Frontend Page/Feature | User Action | Context Engine Tool | Status |
|----------------------|-------------|---------------------|--------|
| Step 6 / campaign settings — Google Sheets | Validate sheet URL and fetch tab list | `cheerful_get_google_sheet_tabs` | NEW |
| Step 6 / campaign settings — Shopify | List Shopify products from GoAffPro | `cheerful_list_shopify_products` | NEW |
| Campaign order approval — Shopify | Create Shopify order for creator | `cheerful_create_shopify_order` | NEW |
| Integrations page / settings | View Instantly.ai connection status | `cheerful_get_instantly_status` | NEW |
| Integrations page — connect | Connect Instantly.ai account | `cheerful_connect_instantly` | NEW |
| Integrations page — disconnect | Disconnect Instantly.ai | `cheerful_disconnect_instantly` | NEW |
| Integrations page — test | Test Instantly.ai connection | `cheerful_test_instantly` | NEW |
| Slack notification trigger | Send Slack digest for campaign activity | `cheerful_trigger_slack_digest` | NEW |

---

## Creator Public Profiles & Posts

| Frontend Page/Feature | User Action | Context Engine Tool | Status |
|----------------------|-------------|---------------------|--------|
| Creator directory (public) | List public creator profiles | `cheerful_list_public_creator_profiles` | NEW |
| Creator directory | View single public creator profile | `cheerful_get_public_creator_profile` | NEW |
| Creator profile — scrape trigger | Trigger fresh Apify scrape for creator | `cheerful_trigger_creator_scrape` | NEW |
| Campaign posts section | List all posts across a campaign | `cheerful_list_posts` | NEW |
| Creator row — posts | View posts by specific creator | `cheerful_list_creator_posts` | NEW |
| Creator row — refresh posts | Refresh posts from social platforms | `cheerful_refresh_creator_posts` | NEW |
| Post row — delete | Remove a post record | `cheerful_delete_post` | NEW |

---

## Webapp-Only Features (No CE Tool Possible)

These features depend on browser state, streaming, OAuth popups, or client-side AI that run through Next.js API routes without backend service equivalents. A CE tool would require a new backend `/api/service/*` route for each.

| Feature | Why No CE Tool | Alternative |
|---------|----------------|-------------|
| Gmail OAuth connection flow | Requires browser popup + Google OAuth redirect | Use `cheerful_list_gmail_accounts` to verify after connection |
| AI email account suggestions (`/api/suggest-campaign-emails`) | LLM route in webapp (no backend service equivalent) | Use `cheerful_list_gmail_accounts` and reason from context |
| Product URL scraping (`/products/scrape` → Firecrawl) | Webapp-proxied Firecrawl call (no backend service equivalent) | Use `cheerful_list_products` to browse existing products |
| AI email generation in wizard | Wizard-specific LLM endpoints (no backend service equivalent) | Use `cheerful_improve_email_content` for post-compose editing |
| AI FAQ/goal generation in wizard | Wizard-specific LLM endpoint (no backend service equivalent) | Generate with Claude directly from campaign context |
| AI tracking rules generation | Wizard-specific LLM endpoint (no backend service equivalent) | Generate with Claude directly from campaign context |
| PDF brief creator search | Webapp-side PDF extraction + Apify (no backend service equivalent) | Use `cheerful_search_creators_by_keyword` manually |
| Draft classification (`/api/classify-edit`) | Claude CE-native inference (no backend service needed) | Claude can classify directly in conversation |
| Rule suggestion generation (`/api/rules-suggestion`) | Claude CE-native inference (no backend service needed) | Claude can suggest rules from conversation diff |
| Cheerify SSE streaming | Streaming response via Next.js API route (CE uses non-streaming) | `cheerful_improve_email_content` returns complete result |
| Browser localStorage drafts (mail) | Browser storage — ephemeral, session-specific | Use `cheerful_get_thread_draft` for backend-persisted drafts |
| Session refresh / auth validation | Supabase session lifecycle | N/A — CE auth via SLACK_USER_MAPPING |
| Demo email display | Onboarding UX for no-email state | `cheerful_list_gmail_accounts` to check connection status |

---

## Summary Statistics

### Tools by Domain

| Domain | Spec File | Total Tools | Existing | New |
|--------|-----------|-------------|----------|-----|
| Campaigns (CRUD + wizard + recipients + outbox) | `campaigns.md` | 31 | 0 | 31 |
| Email (threads + drafts + signatures + scheduling) | `email.md` | 24 | 3 | 21 |
| Creators (lists + enrichment + posts + profiles) | `creators.md` | 27 | 3 | 24 |
| Integrations (Gmail/SMTP/Sheets/Shopify/Instantly/Slack/YouTube/Brand) | `integrations.md` | 18 | 0 | 18 |
| Users & Team (settings + team CRUD + assignments + onboarding) | `users-and-team.md` | 13* | 0 | 13 |
| Analytics (dashboard) | `analytics.md` | 1 | 0 | 1 |
| Search & Discovery (lookalike suggestions) | `search-and-discovery.md` | 4† | 1 | 3 |
| Workflows (CRUD + execution history) | `workflows.md` | 8 | 0 | 8 |
| **TOTAL** | | **126** | **7** | **119** |

\* `cheerful_list_connected_accounts` appears in both `integrations.md` and `users-and-team.md` — counted once in integrations.
† The 4 "audit" sections in `search-and-discovery.md` (covering existing search/creator tools) are not new tools — they document formatter bugs and corrections for tools already counted in `email.md` and `creators.md`.

### Parity Coverage

| Category | Count |
|----------|-------|
| Frontend actions mapped to CE tools | ~175 action rows |
| Actions with CE coverage (EXISTS or NEW) | ~150 |
| Actions that are webapp-only / auth / client-only | ~25 |
| **CE tool coverage of backend-accessible actions** | **100%** |

### Existing Tools Status

All 7 existing tools are covered (some with documented formatter bugs requiring fixes):

| Tool | Domain Spec | Bug Status |
|------|------------|------------|
| `cheerful_list_campaigns` | `campaigns.md` | Bug: reads `type` (wrong field), drops `status`, excludes DRAFT/COMPLETED campaigns |
| `cheerful_search_emails` | `email.md` | Bug: formatter reads wrong field names (`sender` vs `sender_email`, `snippet` vs `matched_snippet`) |
| `cheerful_get_thread` | `email.md` | Bug: formatter reads `from`/`to`/`date` (wrong names), missing subject from top-level response |
| `cheerful_find_similar_emails` | `email.md` | Bug: formatter reads `summary`/`reply_text`/`subject` (all wrong) → empty XML tags |
| `cheerful_list_campaign_creators` | `creators.md` | Bug: missing `offset` param → pagination broken |
| `cheerful_get_campaign_creator` | `creators.md` | Spec inaccuracy: `enrichment_status`/`source`/`post_opt_in_follow_up_status` not in response |
| `cheerful_search_campaign_creators` | `creators.md` | Security gap: searches ALL campaigns globally when no `campaign_id` given |
