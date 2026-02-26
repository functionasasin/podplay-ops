# Spec: Frontend Architecture — Cheerful Webapp

**Synthesized from:** `webapp-routing`, `webapp-campaign-wizard`, `webapp-mail-inbox`, `webapp-state-stores`, `user-journeys`
**Sources:**
- `apps/webapp/app/`
- `apps/webapp/stores/`
- `apps/webapp/hooks/`
- `apps/webapp/components/`

---

## Overview & Philosophy

The Cheerful webapp is a **Next.js 14+ App Router** application styled as an email client. It manages the full lifecycle of influencer outreach campaigns — from campaign creation through creator discovery, email sequencing, inbox triage, and performance tracking.

The frontend is designed around three core operator workflows:
1. **Campaign creation**: A multi-step wizard that guides users through complex configuration with AI assistance at each step.
2. **Inbox management**: An email-client-style interface for processing inbound creator responses at scale (60+ Gmail accounts, dozens of campaigns).
3. **Creator discovery**: An AI-powered search interface for finding new creators to add to campaigns.

**Key architectural choices:**
- **Server state vs. client state are strictly separated**: TanStack Query owns all data from the API; Zustand stores own UI-only state and cross-session preferences.
- **Route groups as concern separators**: `(auth-pages)` and `(mail)` are Next.js route groups (parentheses don't affect URLs) that cleanly separate auth UI, app UI, and their layouts.
- **Middleware is the single auth gate**: All routing logic lives in `utils/supabase/middleware.ts`; client components never redirect.
- **Skeleton-first loading**: All major routes use `Suspense` + skeleton pattern to prevent layout shift on initial load.

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | Next.js 14+ (App Router) | Routing, SSR, API routes |
| UI Library | React 18, TypeScript | Component model |
| Styling | Tailwind CSS, shadcn/ui | Design system |
| Server state | TanStack Query v5 | API data fetching, caching, mutation |
| Client state | Zustand | UI state, cross-session preferences |
| Rich text editor | Tiptap (ProseMirror) | Email compose/reply editor |
| Analytics | Mixpanel, PostHog, GrowthBook, GTM | Event tracking, session recording, feature flags |
| Auth | Supabase Auth (client SDK) | Session management |
| Error tracking | Rollbar | Client-side error capture |

---

## Provider Stack (Root Layout)

**File**: `app/layout.tsx`

All pages render inside this provider hierarchy (outer → inner):

| Provider | Purpose |
|----------|---------|
| `RollbarProvider` | Client-side error tracking |
| `MixpanelProvider` | Product analytics event tracking |
| `PostHogProvider` | Session recording, feature flags (A/B testing) |
| `GrowthBookProvider` | Feature flag evaluation |
| `CSRFProvider` | CSRF token injection for all mutating requests |
| `QueryProvider` | TanStack Query client with global configuration |
| `SessionValidationProvider` | Periodic auth session refresh/validation |
| `ThemeProvider` | Light theme (forced, no dark mode) |
| `DemoModeProvider` + `DemoModeIndicator` | Demo mode flag for sales demos |
| `ChunkLoadErrorHandler` | Handles Next.js chunk load failures with auto-reload |
| `EnrichmentOverlay` | Global overlay for in-progress creator enrichment |
| `Toaster` (sonner) | Toast notification system, top-right position |

Google Tag Manager (`GTM-MVWKLM7N`) is injected via `<Script>` in `<head>`.

**Fonts**: Inter (`--font-sans`) and DM Sans (`--font-dm-sans`) from Google Fonts.

---

## Layout Hierarchy

```
RootLayout (app/layout.tsx)                       — global providers, fonts, analytics
│
├── (auth-pages) layout.tsx                       — bare layout, no sidebar
│   ├── /sign-in
│   ├── /sign-up                                  — immediately redirects to /sign-in (deprecated)
│   ├── /forgot-password
│   ├── /reset-password
│   └── /set-password
│
├── (mail) layout.tsx → MailLayoutClient          — full sidebar + gradient background
│   ├── AppSidebar (66px icon rail, desktop only)
│   └── main.flex-1 (page content area)
│       ├── /dashboard
│       ├── /mail
│       ├── /campaigns
│       ├── /campaigns/new
│       ├── /campaigns/[id]
│       ├── /lists
│       ├── /lists/[id]
│       ├── /search
│       ├── /team
│       └── /settings
│
├── /onboarding layout.tsx                        — Suspense wrapper with branded spinner
│   ├── /onboarding
│   ├── /onboarding/connect
│   ├── /onboarding/connect-email
│   ├── /onboarding/describe
│   ├── /onboarding/product
│   ├── /onboarding/role
│   └── /onboarding/referral
│
└── (standalone — no special layout)
    ├── /                                         — redirect placeholder (middleware-handled)
    ├── /auth/oauth-popup-callback               — OAuth popup result handler
    ├── /home                                    — public landing page
    ├── /privacy / /terms                        — legal pages
    ├── /design                                  — internal design system reference
    └── /shopify                                 — Shopify app installation entry
```

The `(mail)` layout renders as:
```
div.flex.h-screen.bg-[#f6f6f6]
  GradientBackground              — decorative animated gradient
  AppSidebar                      — 66px icon nav (desktop only, hidden on mobile)
  main.flex-1                     — page content, p-5 pl-0
    {children}
```

Accounts (connected Gmail inboxes) are pre-hydrated from `localStorage` (`CHEERFUL_ACCOUNTS` key) to avoid layout shift.

---

## Middleware — Auth Gate

**File**: `utils/supabase/middleware.ts`

Runs on every request. Responsibilities:

1. **Session hydration**: `supabase.auth.getUser()` → forwards `x-cheerful-user` and `x-user-logged-in` headers.
2. **Protected route enforcement**: `/mail`, `/settings`, `/dashboard`, `/campaigns` → redirect to `/sign-in` if unauthenticated.
3. **Onboarding enforcement**: All `/onboarding/*` require auth → redirect to `/sign-in` if unauthenticated.
4. **Root redirect**: `/` always redirects.
5. **Post-auth routing** (logged-in on auth pages or root):
   - Check `onboarding_completed` cookie (avoids DB query on repeat visits)
   - Fallback: query `user_onboarding` table
   - Not completed → `/onboarding`; Completed → `/mail`
   - Exception: `/onboarding/connect-email` always accessible post-onboarding (email reconnect)
6. **Shopify bypass**: `/shopify` passes through unconditionally.

### Auth Gate Matrix

| Route | Unauthenticated | Auth + Onboarding Incomplete | Auth + Onboarding Complete |
|-------|----------------|------------------------------|---------------------------|
| `/` | → `/sign-in` | → `/onboarding` | → `/mail` |
| `/sign-in` | show page | → `/onboarding` | → `/mail` |
| `/mail`, `/dashboard`, `/campaigns`, `/settings` | → `/sign-in` | allowed | allowed |
| `/onboarding/*` | → `/sign-in` | allowed | → `/mail` (except `/connect-email`) |
| `/onboarding/connect-email` | → `/sign-in` | allowed | allowed |

---

## Route Map

### Auth Routes (no sidebar)

| Path | Component | Purpose |
|------|-----------|---------|
| `/sign-in` | `UnifiedAuthForm` | Email+password + Google OAuth. Two-column: form (left), hero visual (right). |
| `/forgot-password` | `ForgotPasswordForm` | Email-based password reset initiation. |
| `/reset-password` | `ResetPasswordForm` | Token-based password reset completion. |
| `/set-password` | `SetPasswordForm` | First-time password set (after invite). |
| `/auth/oauth-popup-callback` | `OAuthPopupCallbackContent` | Receives OAuth result in popup window, sends `postMessage` to parent, closes. Used for Gmail connection. |

### Onboarding Routes

Ordered linear funnel — each step navigates forward via `router.push`:

| Step | Path | Component | Purpose |
|------|------|-----------|---------|
| 1 | `/onboarding` | `WelcomeStep` | Brand intro with animated illustration. |
| 2 | `/onboarding/connect` | `ConnectStep` | "All in one place" — showcases integrations with animated `ConnectedIcons`. |
| 3 | `/onboarding/describe` | `DescribeStep` | Brand description input — what the company does. |
| 4 | `/onboarding/product` | `ProductStep` | Product details input — what to promote. |
| 5 | `/onboarding/role` | `RoleStep` | Role selection (Brand Agency, Creator Agency, Creator, Sales, Other). |
| 6 | `/onboarding/referral` | `ReferralStep` | Referral source. "Next" → `useCompleteOnboarding` → `/dashboard?startWalkthrough=true`. |
| — | `/onboarding/connect-email` | `ConnectEmailStep` | Gmail OAuth popup flow. Also accessible post-onboarding for reconnection. |

**State**: `onboarding-store.ts` (Zustand + localStorage persist, key `onboarding-storage`). Stores `selectedRole`, `selectedReferral`, `referralOtherText`. Reset on `useCompleteOnboarding` success.

**Completion**: `useCompleteOnboarding` POSTs role + referral → backend sets `onboarding_completed` → middleware writes cookie to skip future DB queries.

### Main App Routes (require auth)

| Path | Component | Purpose |
|------|-----------|---------|
| `/mail` | `MailClientWrapper` | Core email client — thread list + thread detail. Default view: `?view=pending`. Separate mobile layout (`isMobile={true}`). |
| `/dashboard` | `DashboardPage` | Analytics overview: 4 metric cards (total creators, response rate, emails sent, opt-in rate), active campaigns table, follow-up stats, pipeline cards (gifting/paid), recent opt-ins. First visit shows `WelcomeModal` → `WalkthroughModal`. |
| `/campaigns` | `CampaignsClient` | Campaign list with search/filter. Cards show name, type, status, creator count. |
| `/campaigns/new` | `NewCampaignClient` | 7-step campaign creation wizard. Accepts `?draft=<id>` to resume a draft. |
| `/campaigns/[id]` | `CampaignDetailClient` | Campaign detail — creator list with status, thread links, manual actions, settings. |
| `/lists` | `ListsClient` | Creator lists (saved searches/segments). Shows list cards with creator count. |
| `/lists/[id]` | `ListDetailClient` | List detail — creator table with social handles, enrichment status, bulk actions. |
| `/search` | `SearchPageClient` | AI-powered creator discovery. Sidebar search icon animates during active search. |
| `/team` | `TeamPage` | Team management: team selector sidebar + team detail (members, campaign assignments). Not in primary nav. |
| `/settings` | `SettingsPage` | Two tabs: `email` (connected accounts, signatures) and `team`. PostHog recording paused on this page. |

### Loading State Strategy

All major `(mail)` routes use the `Suspense` + skeleton pattern:

```tsx
// page.tsx pattern
<Suspense fallback={<SkeletonComponent />}>
  <ClientComponent />    {/* actual page content */}
</Suspense>
```

Skeleton components mirror the real layout's card/grid structure using `animate-pulse` placeholder elements.

---

## Navigation Structure — AppSidebar

**File**: `components/app-sidebar.tsx`

A narrow icon sidebar (66px wide) rendered only in the `(mail)` layout group. Hidden on mobile (`hidden md:block`).

### Primary Nav Items

| Icon | Label | Route | Active Detection |
|------|-------|-------|-----------------|
| Mail | Mail | `/mail?view=pending` | `pathname.startsWith("/mail")` |
| Search | Search | `/search` | `pathname.startsWith("/search")` |
| ListTodo | Lists | `/lists` | `pathname.startsWith("/lists")` |
| Megaphone | Campaigns | `/campaigns` | `pathname.startsWith("/campaigns")` |
| LayoutDashboard | Dashboard | `/dashboard` | `pathname.startsWith("/dashboard")` |

Active state: gradient ring (purple→orange→yellow) via CSS `linear-gradient(135deg, #B04ADC, #FF7247, #F3B246)`.

### Notification System

Two notification types on nav icons:
- **Amber/warning dot** (12px): Issues needing attention (e.g., Campaigns with Google Sheets access problems — `campaignWarnings` from `useNotificationsStore`)
- **Red dot** (8px): Standard new-activity notifications — shown only if no warning dot present

Search icon shows animated spinning conic gradient ring when `isSearching` is true (`useSearchStore`).

### Bottom Controls

| Control | Action |
|---------|--------|
| `SidebarSetupIndicator` | Opens `SetupChecklistModal` — visible until both setup tasks complete |
| Help icon | `/dashboard?startWalkthrough=true` |
| User avatar | `/settings` — ring highlight when active |

### Setup Checklist Logic

The sidebar tracks two setup tasks:
1. **Connect email** — checks `checkUserCredentials()` server action
2. **Create a campaign** — checks `useCampaigns()` query (length > 0)

When both complete, `completeSetupChecklist` mutation fires once (guarded by `useRef`). Indicator hides once `onboardingStatus.setupChecklistCompleted === true`.

---

## Campaign Wizard — Complete Specification

### Architecture

**Entry point**: `/campaigns/new` → `NewCampaignClient` (`apps/webapp/app/(mail)/campaigns/new/new-campaign-client.tsx`)

The wizard uses:
- **Zustand store** (`campaign-wizard-store.ts`) for all form state
- **Per-step hooks** in `apps/webapp/app/(mail)/campaigns/new/hooks/` for API calls and side effects
- **Pure presentational components** in `components/campaigns/new-campaign/` organized by step
- **Draft system** (`use-draft-load.ts` + `use-draft-save.ts`) for persisting in-progress campaigns

### Wizard UI Shell

```
NewCampaignClient
├── TopBanner (campaign name, step counter, X to exit)
├── StepSidebar (steps 1–7 with completion indicators)
│   └── StepItem (gradient ring if active/completed/visited)
├── [Step Content Area]
│   └── [varies by step — see below]
├── ActionFooter (Back | Next | Launch buttons)
├── OfferColumnsDialog (paid CSV column mapping)
├── InvalidTagsDialog (merge tag validation warnings)
└── RulesLoader (AI rules generation progress overlay)
```

### Step State Machine

Steps are numbered `0–7` and `'3b'` (string) for a paid-campaign-only intermediate step. Step `9` is a "returned from edit" target.

```
step 0  → Campaign Creation Landing (user type selection)
step 1  → Campaign Details (name, type, email accounts)
step 2  → Product Information [advertiser/salesperson] OR Creator Info [creator]
step 3  → Creators (CSV / search / import)
step '3b' → [paid only] Paid intermediate step
step 4  → Email Sequence (initial + follow-ups + opt-in/out + signature)
step 5  → Goals & FAQs [seeding/sales] OR Deliverables [paid]
step 6  → Integrations (Google Sheets / Shopify / Slack)
step 7  → Review & Launch
step 9  → Return target after editing from Review
success → Campaign launched success screen
```

#### Navigation Rules (`campaign-wizard-store.ts:401–436`)

```
goToNextStep():
  step 3 + paid campaign → step '3b'
  step '3b' → step 4
  otherwise → currentStep + 1

goToPreviousStep():
  step '3b' → step 3
  step 4 + paid campaign → step '3b'
  step 2 + (creator | salesperson) → step 0  [skip back to landing]
  otherwise → currentStep - 1

goToStepForEdit(step):
  set currentStep = step, editingFromConfirmation = true

returnFromEdit():
  set currentStep = 9, editingFromConfirmation = false
```

#### User Type → Step Configuration (`campaign-wizard-store.ts:448–457`)

| User Type | Total Steps | Can Skip Type |
|-----------|-------------|---------------|
| `creator` | 3 | true |
| `salesperson` | 9 | true |
| `advertiser` | 10 | false |

Creator campaigns show only steps 1, 2 (creator info), and 7 (review). Steps 3, 4, 5, 6 are hidden.

### Step-by-Step Specification

#### Step 0: Campaign Creation Landing

**Component**: `step-1/campaign-creation-landing.tsx`

User selects their persona: Advertiser, Creator, or Salesperson. Determines step flow configuration for entire wizard.

---

#### Step 1: Campaign Details

**Components**: `step-1/campaign-information.tsx` + `step-1/email-setup.tsx`

**Campaign Information fields**:

| Field | Type | Validation |
|-------|------|------------|
| Campaign Name | text input | Required (non-empty) |
| Campaign Type | card selector | Required — `seeding` / `paid` / `sales` / `creator` |

**Campaign Type Cards**:
- **Seeding/Gifting** — Send free products for organic content (no payment)
- **Paid Promotion** — Pay creators for guaranteed deliverables
- **Other** → reveals sub-types (animated `AnimatePresence`):
  - **Salesperson** — Outreach to prospects, book sales calls; stored as `'sales'`
  - **Creator** — Manage incoming brand deals (reversed flow); stored as `'creator'`

**Email Setup fields**:

| Field | Type | Notes |
|-------|------|-------|
| Communication Preference | radio cards | `'cheerful'` (recommended) or `'external'` |
| Email Accounts | searchable checkbox multi-select | From connected Gmail accounts |

When `'external'` is selected: Cheerful handles replies only; "Add Follow-Up" button hidden in step 4.

Email suggestions fetched from `POST /api/suggest-campaign-emails` on campaign name change (debounced, queued if fetch in-flight).

**Completion**: Campaign name + valid type + at least one email account.

---

#### Step 2: Product Information (Advertiser/Salesperson)

**Components**: `step-2/product-details.tsx`, `step-2/campaign-brief-upload.tsx`

Multiple product cards supported. Each `ProductCard`:

```typescript
interface ProductCard {
  id: string              // crypto.randomUUID()
  source: 'new' | 'existing'
  inputMethod: 'ai' | 'manual'
  url: string             // Scraping source URL
  name: string
  description: string
  lastScrapedUrl?: string // Cache key — avoids re-scraping
  existingProductId: string | null
  searchQuery: string
}
```

**New product**: Optional URL → auto-scrape via `POST /products/scrape` (Firecrawl). Result fills name + description. OR manual entry.

**Existing product**: Search team's existing products, select one (highlighted with gradient border).

**Brief upload**: PDF upload → `use-brief-creator-search.ts` extracts context → background creator search.

**Completion**: New product: name + description both non-empty. Existing: `existingProductId` set.

---

#### Step 2 (Creator Flow): Creator Info

**Component**: `step-2-creator/creator-info-step.tsx`

For creator-type campaigns. Fields (all optional): Media Kit Link, Audience Demographics, Rate Information. Used by LLM to generate context-aware FAQs and auto-responses.

---

#### Step 3: Creators

**Component**: `step-6/creators.tsx` (note: folder numbering is a historical artifact)

Three tabs:

**1. Upload CSV**:
- Accepts `.csv`, parsed client-side via `use-csv-parser.ts`
- Validates email column presence and format
- Custom columns become merge-tag variables (`{{column_name}}` in emails)
- Social profile validation: rows without `@handle` fields trigger `SocialValidationError` warnings
- Paid campaigns: `PaidOfferEntryDialog` for per-creator offer amounts

**2. Search** (embedded creator discovery):
- `EmbeddedSearchInput` → query + platform selector
- `EmbeddedSearchLoading` → skeleton while Apify/YouTube search runs
- `EmbeddedSearchResults` → results with Add/Remove
- `AddedCreatorsSummary` → confirmation before proceeding
- Added creators without emails use `SEARCH_PLACEHOLDER_EMAIL_PREFIX` sentinel email; enriched post-launch

**3. Import from Lists**: Pull from saved creator lists.

**Brief creator search mode**: If campaign brief uploaded in step 2, `use-brief-creator-search.ts` runs in background. `briefCreatorSearchCompleted = true` satisfies step 3 requirement.

**Completion**: At least one creator with valid email in `parsedCsvData` OR at least one search-added creator with email, with zero `socialValidationErrors`. OR `briefCreatorSearchCompleted === true`.

---

#### Step 3b: Paid Campaigns Intermediate (Paid Only)

Exists between Creators (3) and Email Sequence (4) specifically for paid campaigns. Captures deal-specific information before email composition.

---

#### Step 4: Email Sequence

**Component**: `step-4/email-outreach.tsx`

Three tabs:

**1. Email Sequence** (`step-4/email-sequence.tsx`):
- Initial email: subject line + HTML body
- Follow-up N: body only (no subject) + configurable wait days (1–30)
- "Add Follow-Up" button (hidden when `communicationPreference === 'external'`)
- AI generation available for all content fields

**2. Opt-In/Opt-Out** (`step-4/opt-in-opt-out.tsx`):
- Toggle to include opt-in/opt-out response handling
- Opt-In body (sent when creator responds positively)
- Opt-Out body (sent when creator declines)
- Tab selection triggers AI content generation if not yet generated

**3. Signature** (`step-4/signature-editor.tsx`):
- Toggle: enable/disable signature appending
- Rich textarea for signature content
- AI "Rewrite Signature" with action prompt

**Email Content Editor** (`step-4/email-content-editor.tsx`) — shared for all email fields:
- Subject line (hidden for follow-ups and opt-in/out) with AI rewrite button
- HTML body textarea with `{{merge_tag}}` validation
- CC Emails multi-input
- AI actions dropdown: rewrite, shorten, formalize, etc.
- Merge tag validation: warns if `{{tag}}` has no matching CSV column
- Preview/Test modal: renders email with CSV sample data substituted

**Completion**: Initial email has non-empty subject AND non-empty body.

---

#### Step 5: Goals & FAQs / Deliverables

**Seeding / Sales Campaigns**:
- `CampaignGoal`: `campaignGoal` textarea (LLM context for generating replies)
- `FAQs`: Q&A pairs, auto-generated by AI on step navigation, editable with add/edit/delete/ignore (soft-delete)
- FAQ storage format: `CampaignRule` with `text: "question|||answer"`, split on display

**Paid Campaigns**:
- `ExpectedDeliverables` textarea: what creator must produce
- `DealStructure` textarea: how creator will be compensated
- `FAQs`: same system
- At submit time, `expectedDeliverables + dealStructure` concatenated into `campaign_goal`

**Completion**: Must visit step. Seeding/sales: `campaignGoal` non-empty. Paid: both fields non-empty.

---

#### Step 6: Integrations

**Component**: `step-5/integrations.tsx`

**Google Sheets** (optional):
- Toggle → `GoogleSheetsModal`
- Input URL → backend verifies access + fetches tab list
- Select tab for data writing
- AI-generated tracking rules (natural language for what data to capture)
- Rules editable; regenerate button available
- If closed without completing → auto-disabled

**Shopify** (optional):
- Toggle → `ShopifyModal`
- GoAffPro Token (API token for affiliate/discount integration; validated via backend)
- Discount config: enable toggle, type (percentage/fixed_amount), value, currency, formatting instructions
- Order tracking: enable toggle, product selection, variant selection
- If closed without valid token → auto-disabled

**Slack** (optional):
- Simple text input for Slack Channel ID
- Campaign notifications sent to this channel
- Seeding campaigns only

**Completion**: Must visit step. If Google Sheets enabled: URL verified + tab selected + ≥1 tracking rule. If Shopify enabled: GoAffPro token verified.

---

#### Step 7: Review & Launch

**Components**: `step-7/review-launch.tsx` + `step-7/campaign-settings.tsx`

Two-column layout: summary (left) + settings panel (right).

**Review Launch sections (with edit shortcuts)**:

| Section | Edit Action |
|---------|-------------|
| Campaign Name | Inline edit |
| Connected Emails | Add/remove inline |
| Goal | `goToStepForEdit(5)` |
| Rules | Inline edit |
| FAQs | Inline edit |
| Integrations | `goToStepForEdit(6)` |
| Email Content | `goToStepForEdit(4)` |
| Follow-Up Settings | Inline toggle/edit |
| Automation Level | `manual` / `semi-automated` radio |
| Lookalike Suggestions | Toggle |
| Sample Emails (Opt-In/Out) | View opt-in/out email bodies |

**Automation Levels** (`step-7/sections/automation-level-section.tsx`):
- **Manual** — All replies drafted for human review before sending
- **Semi-automated** — Simple opt-in replies sent automatically; replies with questions drafted for review

**Launch Button**: Disabled until `missingRequirements.length === 0`. Calls `submitCampaign()` → `POST /api/campaigns/launch`.

---

### Wizard State — Complete Schema

**File**: `stores/campaign-wizard-store.ts`

```typescript
CampaignWizardState {
  // Navigation
  currentStep: number | '3b'
  selectedUserType: 'advertiser' | 'creator' | 'salesperson' | null
  selectedCampaignType: 'seeding' | 'paid' | 'sales' | 'creator' | null
  editingFromConfirmation: boolean
  isSubmitting: boolean
  submitError: string | null

  // Products
  products: ProductCard[]
  expandedProductId: string | null

  // Campaign Content
  campaignName: string
  campaignGoal: string
  campaignRules: CampaignRule[]         // Default: 3 seeding rules pre-populated
  campaignFaqs: CampaignRule[]          // Format: "question|||answer" in text field
  campaignImage: File | null
  sampleEmailOptIn: string
  sampleEmailOptOut: string
  expectedDeliverables: string
  dealStructure: string
  mediaKitLink: string                  // Creator campaigns only
  demographicsInfo: string              // Creator campaigns only
  rateInfo: string                      // Creator campaigns only
  isGeneratingCampaignSettings: boolean

  // Integrations
  integrationSettings: { googleSheets: boolean; shopify: boolean }
  googleSheetUrl: string
  selectedSheetTab: string | null
  trackingRules: TrackingRule[]
  goaffproToken: string
  goaffproTokenStatus: 'idle'|'verifying'|'valid'|'invalid'
  shopifyDiscountEnabled: boolean
  shopifyDiscountType: 'percentage' | 'fixed_amount'
  shopifyDiscountValue: number          // Default: 10
  shopifyDiscountCurrency: string       // Default: 'USD'
  shopifyDiscountFormattingInstructions: string
  shopifyOrdersEnabled: boolean
  shopifyProducts: ShopifyProduct[]
  shopifyProductId: string | null
  shopifySelectedVariations: ShopifyVariation[]

  // Email
  emailProvider: 'cheerful' | 'external'
  selectedAccounts: string[]
  subjectLine: string
  emailBody: string
  ccEmails: string[]
  followUpTemplates: FollowUpTemplate[]
  csvFile: File | null
  parsedCsvData: CsvData[]
  csvHeaders: string[]
  isGeneratingEmailContent: boolean
  cachedEmailContent: { subject: string; body: string } | null
  suggestedEmails: string[]
  isFetchingSuggestions: boolean

  // Signature
  emailSignature: string
  emailSignatureEnabled: boolean
  isRewritingSignature: boolean
}
```

**Default rules pre-populated** (`campaign-wizard-store.ts:305–309`):
1. "Product gifting - no payment required"
2. "Creator provides shipping address"
3. "Confirmation email sent after shipping"

### Wizard Selector Hooks (Performance)

Domain-scoped selector hooks using `useShallow` prevent unnecessary re-renders:

| Hook | Domain |
|------|--------|
| `useWizardNavigation()` | Step + type + navigation actions |
| `useProductState()` | Product cards |
| `useCampaignContentState()` | Name, goal, rules, FAQs |
| `useIntegrationState()` | Google Sheets, Shopify, GoAffPro |
| `useEmailState()` | Email + signature + CSV |
| `useRuleEditingState()` | Inline rule/tracking edit session |

### Campaign Submission

**File**: `use-campaign-submit.ts`

`POST /api/campaigns/launch` receives multipart FormData:
- `campaign_data`: JSON-stringified `CampaignLaunchRequest`
- `csv_file`: optional CSV file

**Key field transformations**:

| Frontend | Backend Field | Notes |
|----------|---------------|-------|
| `campaignName` | `campaign_name` | |
| `selectedType: 'seeding'` | `campaign_type: 'seeding'` | |
| `communicationPreference: 'external'` | `is_external: true` | creator type also sets `is_external: true` |
| `campaignGoal` | `campaign_goal` | For paid: deliverables + deal structure concatenated |
| `faqs[]` | `campaign_faqs[]` | `{question, answer}` format |
| `optInEmail.body + optOutEmail.body` | `sample_emails` | Only when `includeOptInOptOut = true` |
| `parsedCsvData[]` | `recipients[]` | Rows without valid `@email` filtered out |
| `followUpTemplates[]` | `follow_up_templates[]` | Filtered to non-empty body |
| `integrationSettings.shopify` | `integrations` | Full `ShopifyIntegration` object |
| `automationLevel` | `automation_level` | Default: `'manual'` |
| `emailSignature` | `email_signature` | Backend creates signature record atomically |
| `slackChannelId` | `slack_channel_id` | Only for seeding campaigns |

Creators without emails (email doesn't contain `@`) are filtered from `recipients`. The count stored in `has_creators_pending_enrichment` flag triggers async enrichment workflow on backend.

### AI-Assisted Features in Wizard

| Feature | Trigger | API Call |
|---------|---------|----------|
| Product scraping | URL input → blur | `POST /products/scrape` (Firecrawl) |
| Email account suggestions | Campaign name change (debounced) | `POST /api/suggest-campaign-emails` |
| Initial email generation | Step 4 navigation | Backend AI endpoint |
| Opt-in/opt-out generation | Tab selection | Backend AI endpoint |
| Signature rewrite | "Rewrite with AI" button | Backend AI endpoint |
| Subject/body rewrite | Dropdown action | Backend AI endpoint |
| Goal + FAQ generation | Step 5 navigation | Backend AI endpoint |
| Tracking rules generation | Google Sheets configured | Backend AI endpoint |
| Brief-based creator search | Campaign brief uploaded | Backend Apify search workflow |

### Validation Matrix

| Step | Seeding | Paid | Sales | Creator |
|------|---------|------|-------|---------|
| 1 | name + type + email | same | same | type + email (no name req) |
| 2 | product name + desc | same | same | visited (all optional) |
| 3 | creators > 0 + no social errors | same | same | hidden (auto-complete) |
| 4 | initial email valid (subject + body) | same | hidden | hidden |
| 5 | goal non-empty | deliverables + deal structure | goal | hidden |
| 6 | visited (+ integration config if enabled) | same | same | hidden |
| 7 | visited | same | same | visited |

### Draft System

- **Loading** (`use-draft-load.ts`): On mount, if `?draft=<id>` param present, fetches draft from backend and populates wizard store
- **Saving** (`use-draft-save.ts`): Auto-saves wizard state as draft at key transitions (step changes)
- **Draft campaigns**: Surfaced in campaigns list with "Draft" badge
- **Launch**: `draft_campaign_id` sent so backend promotes draft → active campaign

---

## Mail Inbox — Complete Specification

### Architecture

**Entry point**: `/mail` → `MailClientWrapper` → `MailClient` → `mail.tsx`

```
MailClientWrapper (server — auth/bootstrap check)
  └── MailClient (client — main state initialization)
       └── mail.tsx (layout: resizable split panels)
            ├── Top: TopAccountFilter + CampaignFilter + ViewTabs
            ├── Left: mail-list.tsx (thread list)
            └── Right: mail-display.tsx (thread detail + compose)
```

### Three-Panel Layout

```
┌────────────────────────────────────────────────────────┐
│ Top Bar: Account Selector | Campaign Filter | View Tabs  │
├──────────────┬─────────────────────────────────────────┤
│ Thread List  │ Thread Detail (mail-display.tsx)         │
│ (mail-list)  │                                         │
│              │  ┌─ Message 1 (collapsed) ────────────┐ │
│ Status badge │  ├─ Message 2 (expanded) ─────────────┤ │
│ Flag icons   │  │  Full HTML body + quoted content    │ │
│              │  └────────────────────────────────────┘ │
│              │                                         │
│              │  ┌─ Reply Compose Box ─────────────────┐│
│              │  │  TipTap Editor | Cheerify | Schedule ││
│              │  └─────────────────────────────────────┘│
└──────────────┴─────────────────────────────────────────┘
```

Panels are resizable via `react-resizable-panels`. Layout widths persisted to `localStorage` via `mail-store.ts`.

### Thread List Views

| Tab | Content | Filter Logic |
|-----|---------|--------------|
| Pending | Threads needing attention | Non-sent, non-hidden |
| Sent | Outgoing messages | `direction=sent` |
| Ignored | Hidden/archived threads | `is_hidden=true` |
| Drafts | Unsent drafts | `status=WAITING_FOR_DRAFT_REVIEW` |
| Creators | Campaign creator data table | Separate view |

### Thread Item Display

Each thread item shows:
- Subject line (truncated)
- Sender name and email
- Last message timestamp (relative: "2 hours ago")
- Campaign image (loaded via `use-campaign-images.ts`)
- Status badge: `DRAFT`, `WAITING_FOR_REVIEW`, etc.
- Flag icons: `wants_paid` (amber), `has_question` (blue), `has_issue` (red)
- Unread indicator dot

### Thread Status Badge System

| Badge | Meaning |
|-------|---------|
| `WAITING_FOR_DRAFT_REVIEW` | AI draft generated, awaiting human approval before send |
| `DRAFT` | Manual draft in progress |
| `SENT` | Message sent (Sent tab) |
| `IGNORED` | Thread hidden by operator |

### Thread Flag System

Flags detected by AI analysis of email content:

| Flag | Icon | Color | Signal |
|------|------|-------|--------|
| `wants_paid` | 💰 | Amber | Creator mentioned payment/rates |
| `has_question` | ❓ | Blue | Email contains a question |
| `has_issue` | ⚠️ | Red | Problem or complaint detected |

### Thread Filtering

- **By campaign**: Multi-select campaign filter chips
- **By account**: Top account filter dropdown
- **By status**: View tabs
- **By search**: Client-side text search (400ms debounce, limited to 50 threads per account)
- **Uncategorized toggle**: Include threads not assigned to any campaign

### Thread Detail — Message Rendering

**File**: `mail-display.tsx` (120KB+)

Message rendering (`message-content.tsx`):
- **HTML emails**: `dangerouslySetInnerHTML` with DOMPurify sanitization
- **Plain text**: `whitespace-pre-wrap` preservation
- **Links**: Force-opened in new tab
- **Images**: `max-width: 100%`

**Quoted content detection** (auto-collapsed):
```
"On [date], [person] wrote:"
"---- Original Message ----"
Lines starting with ">"
Outlook-style headers
Gmail quoted reply wrappers (blockquote with class)
```

**Message expand/collapse**: Latest message auto-expanded on thread open; `use-message-expansion.ts` tracks expanded IDs in a `Set`.

### Reply Composer

**Recipient calculation** (`use-reply-recipients.ts`, ~380 lines):
1. Detect which Gmail account the thread belongs to (the "self")
2. **Simple reply**: `TO = conversation partner` (last sender if not self)
3. **Reply-all**: `TO = last sender + all original TO/CC` minus self
4. Parse `"Name <email>"` format with fallback to raw email
5. User can override TO/CC via inline editing

**Rich Text Editor** (`tiptap-email-editor.tsx`, ~500 lines):
- Built on Tiptap (ProseMirror)
- Extensions: Bold, Italic, Underline, Link, Image, Font Family, MergeTagHighlight
- Merge tags highlighted in editor (e.g., `{first_name}`)
- Angle bracket conversion: `<Name>` → `{name}` on paste
- HTML paste normalization
- Signature appended below reply content
- Draft auto-saved to `mail-draft-store.ts` on every keystroke (debounced)

**Draft persistence** (`mail-draft-store.ts`): Keyed by `threadId`. 7-day auto-expiry. Survives navigation and page refresh.

### AI Email Improvement — "Cheerify"

**File**: `use-cheerify.ts`

| Action | Effect |
|--------|--------|
| `shorten` | Make email shorter |
| `expand` | Make email longer |
| `friendly` | Friendlier tone |
| `professional` | More formal |
| `casual` | More casual |
| `custom:[feedback]` | Custom instruction from user |

Implementation: `POST /api/improve-email-content-stream-send-textbox` → SSE stream → real-time token updates. Undo restores previous draft text. Operations tracked for rule suggestion system.

### Rule Suggestion System

**File**: `use-rule-suggestions.ts` (~350 lines)

After operator edits a draft:
1. System detects diff between original draft and final text
2. `POST /api/rules-suggestion` with original, edited text, and Cheerify actions used
3. Backend generates 1–3 rule suggestions
4. Rules shown as dismissable toast notifications
5. Accepted rules saved to user profile for future auto-application

### Email Scheduling

**File**: `use-email-schedule.ts`

- Date/time picker via `custom-datetime-picker.tsx`
- `POST /api/threads/{threadId}/schedule`
- Scheduled emails displayed with countdown
- Cancel schedule option available

### Email Send Flow

**File**: `use-email-send.ts` (~400 lines)

**Send sequence**:
1. Build recipient list (TO/CC)
2. Construct `In-Reply-To` header from last message ID
3. Construct `References` header from all thread message IDs
4. Convert attachments to base64 data URIs
5. Call `POST /api/send-email` (owner) or `POST /api/emails/send` (team member)
6. Delete draft from `mail-draft-store.ts`
7. Trigger rule suggestion generation (async, fire-and-forget)
8. Silent background refresh of thread list
9. Cancel scheduled emails if manual send occurs

**Owner vs. team member paths**: Owner uses `/api/send-email` (Next.js route → Gmail API directly) and updates thread state + labels. Team member uses backend API with service role, skipping label/state updates (backend handles those).

### Bulk Edit System

**File**: `use-bulk-edit.ts`

After editing and sending a draft:
1. `POST /api/classify-edit` (Next.js → Claude) — determines if edit is generalizable
2. If AI says `shouldOffer=true`: floating action bar shows count of affected drafts in same campaign
3. User can apply same edit to all: `POST /api/bulk-draft-edit` → Temporal workflow rewrites N drafts
4. After 5-second workflow grace period, invalidates `mailKeys.all` to refresh thread list

### Thread Operations

| Operation | API Endpoint | Effect |
|-----------|-------------|--------|
| Hide | `PATCH /api/threads/{id}/hide` | Moves to "Ignored" tab; auto-selects next thread |
| Unhide | `PATCH /api/threads/{id}/unhide` | Returns to Pending |
| Bulk hide | `PATCH` multiple | Confirmation dialog for bulk destructive action |
| Schedule | `POST /api/threads/{id}/schedule` | Shows countdown in thread detail |

### Demo Email Onboarding

When no connected accounts or no real threads:
- `demo-email-display.tsx` — Simulated thread with animated gradient border
- `demo-email-list-item.tsx` — Demo thread in list
- `connect-email-overlay.tsx` — CTA to connect Gmail account
- Dismissal tracked per user (`isDemoEmailDismissed` in `mail-store.ts`)

### Real-Time Update Strategy

Cheerful does **not** use WebSockets. Instead:
1. **Silent refresh**: After any mutation (send, hide, schedule), `refetch()` called with `silentRefreshCount` to suppress loading skeleton
2. **Polling**: Long-running operations (AI draft generation, enrichment) polled via `use-enrichment-polling.ts`
3. **React Query automatic refetch**: Window focus, account switch, campaign filter change

### Performance Optimizations

| Optimization | Implementation |
|-------------|----------------|
| Batch account fetching | Single API request with all account IDs → 61 accounts = 2 requests instead of 122 |
| Thread deduplication | Creator in multiple campaigns → deduplicate by `gmail_thread_id`, keep first |
| Client-side search | 50-thread limit, 400ms debounce, avoids server-side search on every keystroke |
| Silent refresh | Background refetch suppresses loading skeleton |
| Draft auto-expiry | 7-day TTL prevents localStorage bloat |
| Message lazy expansion | Full HTML body only rendered when expanded |
| Stale time | Thread lists: 30s fresh; counts: 60s fresh |

---

## State Management Architecture

### Complete State Inventory

```
Zustand (session memory — no persist)
├── Campaign wizard form          → useCampaignWizardStore
├── Campaign list modal           → useCampaignUIStore
├── Creator enrichment flow       → useEnrichmentStore
├── Sidebar notification badges   → useNotificationsStore
├── Mail view/tab/selection       → useMailStore (partial persist)
├── Email settings modal          → useEmailSettingsStore
└── Creator search results        → useSearchStore

Zustand + localStorage persist
├── Mail layout preferences       → useMailStore (layout, filters)
├── Reply drafts per thread       → useMailDraftStore (7d expiry)
├── Selected Gmail account        → useAccountStore
├── Campaign in-progress draft    → useCampaignDraftStore
├── Email generation preferences  → useCampaignPreferencesStore
└── Onboarding selections         → useOnboardingStore

TanStack Query (server state)
├── Thread lists (pending/sent/ignored)  → usePendingMails, useSentMails, useIgnoredMails
├── Thread counts                        → useMailCounts
├── Gmail accounts                       → useGmailAccounts
├── Mail bootstrap check                 → useMailBootstrap
├── Campaigns list / detail              → Orval-generated hooks
└── Creators list                        → Orval-generated hooks

URL state (Next.js searchParams)
├── ?account=email@domain.com    → selected Gmail account
├── ?view=pending                → active mail view
└── query params on search page  → platform, mode
```

### Store Schemas

#### `useMailStore` — Mail Inbox State

**File**: `app/(mail)/mail/stores/mail-store.ts`
**Persisted key**: `'mail-storage'`

```typescript
// Persisted:
layout: number[]                  // Panel widths
isCollapsed: boolean
isMailListCollapsed: boolean      // Mobile: list panel collapse
selectedCampaigns: string[]       // Active campaign filters
knownCampaignIds: string[]        // For detecting new campaigns
includeUncategorized: boolean
lastUserId: string                // Detects impersonation changes

// NOT persisted (ephemeral):
selectedMailId: string | null
lastSelectionTime: number         // Anti-flicker timestamp
activeView: 'pending' | 'sent' | 'ignored' | 'drafts' | 'creators'
selectedAccounts: string[]
isDemoEmailDismissed: boolean
emailSearchQuery: string
draftingThreadIds: Set<string>    // Threads awaiting AI draft
```

**Session isolation**: `checkAndResetForUser(userId)` clears campaign filters if `lastUserId` differs — handles admin impersonation.

#### `useMailDraftStore` — Draft Persistence

**File**: `app/(mail)/mail/stores/mail-draft-store.ts`
**Persisted key**: `'mail-draft-storage'`

```typescript
drafts: Record<threadId, {
  text: string          // HTML content from TipTap
  isReplyAll: boolean
  lastUpdated: number   // Unix ms, 7-day TTL
}>
```

#### `useEnrichmentStore` — Creator Email Enrichment

**File**: `stores/enrichment-store.ts`

State machine:
```
closed → expanded (user selects creators without emails)
expanded → minimized (user minimizes while enrichment runs)
minimized/expanded → closed (user confirms or cancels)
```

Polling architecture: `startPolling()` runs **outside React** as a plain async function using `set`/`get` directly (avoids stale closures). Polls `GET /api/v1/enrich-creators/{workflow_id}/status` every 2s, max 180 attempts (6 minutes).

#### `useSearchStore` — Creator Discovery

**File**: `app/(mail)/search/stores/search-store.ts`

Key state groups:
- **Search params**: `query`, `selectedPlatform`, `searchMode`
- **Results**: `creators`, `youtubeChannels`
- **Pagination**: `currentPage`, `totalResults`, `hasMore`, `pageCache: Map<number, []>`
- **Filters**: `followersFilter`, `engagementFilter`
- **Selection**: `selectedIds: Set<string>`, `viewingCreatorId`

Platform/mode switching resets pagination, selection, filters, and cache.

Store-to-store communication: `setCreators()` calls `useNotificationsStore.getState().showNotification('/search')` directly (non-React pattern) to badge the sidebar nav icon.

### Persistence Rationale

| Store | Persisted? | Rationale |
|-------|------------|-----------|
| Campaign wizard | No | Contains `File` objects (non-serializable); form submitted in one session |
| Mail drafts | Yes, 7 days | Prevent loss of typed replies when switching threads |
| Mail layout | Yes | User preference; should survive refresh |
| Campaign filters | Yes | Users expect filter selections to persist between sessions |
| Email preferences | Yes | Once set, tone/style shouldn't be re-set per campaign |
| Search results | No | Stale results are confusing; always re-fetch |
| Enrichment state | No | Workflow tied to specific creators; not recoverable from localStorage |
| Onboarding | Yes | Allow user to navigate away and resume |

### Inter-Store Dependencies

- `useSearchStore` → calls `useNotificationsStore.getState()` directly (non-React pattern)
- `useEnrichmentStore` → calls backend API directly (polling loop outside React)
- `useCampaignWizardStore.fetchEmailSuggestions` → calls `/api/suggest-campaign-emails` directly (async action embedded in store)
- `useMailBootstrap` → reads `useGmailAccounts` query cache via `getQueryClient()`

---

## Key Custom Hooks

### `useAuthCache`

**File**: `hooks/use-auth-cache.ts`

Initializes Supabase auth once and caches in component state. Prevents mail inbox from making redundant `getSession()`/`getUser()` calls in every query. TanStack Query hooks are gated on `isInitialized === true` to prevent race conditions.

### `useMailBootstrap`

**File**: `app/(mail)/mail/hooks/use-mail-bootstrap.ts`

Checks whether the user has Gmail credentials configured before rendering the inbox. Uses a custom `CredentialsNotReadyError` with retry-up-to-3-times (500ms delay) to handle the race condition where credentials were just created during onboarding.

Fallback chain:
1. Try server action `getMailBootstrap()`
2. If no credentials: check React Query cache for gmail accounts
3. If cache miss: query Supabase directly
4. If still nothing: throw `CredentialsNotReadyError` → retry

### `useMailQueries`

**File**: `app/(mail)/mail/hooks/use-mail-queries.ts`

Core TanStack Query hooks for thread data. Query key factory:
```typescript
mailKeys = {
  pending: (accountId, campaignIds?, search?) => [...],
  sent: (accountId, campaignIds?, search?) => [...],
  ignored: (accountId, campaignIds?, search?, includeUncategorized?) => [...],
  counts: (accountId) => [...],
  thread: (threadId) => [...],
}
```

On `401` responses: refresh Supabase session and retry once before throwing.

---

## Webapp API Endpoints (consumed by frontend)

All routes are Next.js API routes in `apps/webapp/app/api/` that proxy to the FastAPI backend.

### Mail Inbox

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/threads/list` | Fetch threads (pending/sent/ignored/drafts) |
| GET | `/api/threads/counts` | Count threads per status |
| GET | `/api/threads/{threadId}` | Fetch single thread detail |
| PATCH | `/api/threads/{threadId}/hide` | Hide thread |
| PATCH | `/api/threads/{threadId}/unhide` | Unhide thread |
| POST | `/api/send-email` | Send reply (owner path) |
| POST | `/api/threads/{threadId}/schedule` | Schedule email send |
| POST | `/api/improve-email-content-stream-send-textbox` | Cheerify (SSE stream) |
| POST | `/api/rules-suggestion` | Generate rule suggestions from edit diff |
| POST | `/api/classify-edit` | Classify draft edit for bulk apply |
| POST | `/api/bulk-draft-edit` | Apply edit instruction to multiple drafts |

### Campaign Wizard

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/campaigns/launch` | Launch campaign (multipart FormData) |
| POST | `/api/suggest-campaign-emails` | AI-suggest email accounts for campaign |
| POST | `/products/scrape` | Scrape product info from URL |

### Email Signatures

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/email-signatures` | List signatures |
| POST | `/api/email-signatures` | Create signature |
| PUT | `/api/email-signatures/{id}` | Update signature |
| DELETE | `/api/email-signatures/{id}` | Delete signature |

### Accounts / Auth

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/accounts` | List Gmail accounts |
| GET | `/auth/oauth-popup-callback` | OAuth popup result handler |

---

## Design System Notes

### Visual Theme

- **Color palette**: Purple-to-orange-to-yellow gradient as brand accent (`#B04ADC → #FF7247 → #F3B246`)
- **Background**: Light gray `#f6f6f6` for app shell; white cards inside
- **Active states**: Gradient ring on sidebar nav items
- **Notification dots**: Amber (12px) for warnings, red (8px) for standard alerts
- **Typography**: Inter for UI, DM Sans for display
- **Forced light mode**: `ThemeProvider` forces light theme — no dark mode support

### Component Library

Built on **shadcn/ui** (Radix UI + Tailwind) for:
- Dialogs, Sheets, Popovers, Tooltips, Dropdown menus
- Form controls: Input, Select, Checkbox, Switch, Textarea, RadioGroup
- Data display: Table, Badge, Avatar, Card
- Navigation: Tabs, Breadcrumb

Custom components extend shadcn primitives:
- `TipTapEmailEditor` — Rich text email composition
- `ResizablePanelGroup` — Mail inbox split layout
- `GradientBackground` — Animated decorative gradient
- `SidebarSetupIndicator` — Onboarding progress chip

### Responsive Design

- Sidebar hidden on mobile (`hidden md:block`)
- Mail page renders separate `isMobile={true}` layout
- Other pages use responsive Tailwind classes but are not fully mobile-optimized
- The application is primarily designed for desktop use

---

## Key Design Decisions and Trade-offs

1. **Zustand over Redux/Context**: Simple boilerplate, no provider nesting required for non-React (polling) store updates. Direct `getState()` calls work outside React lifecycle.

2. **Orval for API client generation**: Backend OpenAPI schema → auto-generated typed hooks. Reduces manual API contract maintenance.

3. **FAQ encoding as `"question|||answer"`**: FAQs are packed into `CampaignRule.text` using a `|||` delimiter to avoid a separate type. Pragmatic shortcut with splitting at display time.

4. **Creator email sentinel**: Search-added creators without confirmed emails use `SEARCH_PLACEHOLDER_EMAIL_PREFIX` sentinel so they appear in the list but are filtered from `recipients[]` at submit time. Backend enriches them post-launch.

5. **External provider mode**: When `communicationPreference === 'external'`, step 4 partially hides follow-up controls and sends `is_external: true` to backend — Cheerful tracks replies only.

6. **Folder numbering ≠ step numbering**: Wizard component folders (`step-1/` through `step-7/`) don't directly map to wizard step numbers (e.g., `step-6/` contains Creators = wizard step 3). Historical artifact from iterative development.

7. **PostHog session recording paused on `/settings`**: Privacy protection — settings page contains PII (email addresses, connected accounts). Recording stops on mount and resumes on unmount.

8. **Dual feature flag systems (GrowthBook + PostHog)**: Two separate providers suggest a migration in progress. GrowthBook for server-side/experiment flags, PostHog for lightweight client-side toggles.

9. **`/team` hidden from sidebar**: Team management is accessible at `/team` directly, but not listed in the sidebar nav. Newer entry point via `/settings` (TeamSettingsContent) may be the intended canonical access path.

10. **Silent refresh over WebSockets**: The inbox uses polling + manual refetch rather than WebSockets, trading real-time freshness for simpler infrastructure. `silentRefreshCount` prevents loading skeletons during background refreshes.
