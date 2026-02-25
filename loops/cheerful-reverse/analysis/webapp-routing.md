# Webapp Routing Analysis

**Aspect**: `webapp-routing`
**Source**: `apps/webapp/app/`
**Date**: 2026-02-25

## Overview

The Cheerful webapp is a Next.js 14+ App Router application. Routes are organized into four distinct groups with separate layouts, auth gates, and loading skeletons. The primary interface is an email-client-inspired shell with a vertical icon sidebar.

---

## Layout Hierarchy

```
RootLayout (app/layout.tsx)                         — global providers, fonts, analytics
│
├── (auth-pages) layout.tsx                         — bare layout, no sidebar, back button (commented out)
│   ├── /sign-in
│   ├── /sign-up                                    — immediately redirects to /sign-in (deprecated)
│   ├── /forgot-password
│   ├── /reset-password
│   └── /set-password
│
├── (mail) layout.tsx                               — MailLayoutClient: full sidebar + gradient bg
│   ├── /dashboard
│   ├── /mail
│   ├── /campaigns
│   ├── /campaigns/new
│   ├── /campaigns/[id]
│   ├── /lists
│   ├── /lists/[id]
│   ├── /search
│   ├── /team                                       — not in sidebar nav, accessible via direct URL
│   └── /settings
│
├── /onboarding layout.tsx                          — Suspense wrapper with branded loading spinner
│   ├── /onboarding
│   ├── /onboarding/connect
│   ├── /onboarding/connect-email                   — also accessible post-onboarding (see middleware)
│   ├── /onboarding/describe
│   ├── /onboarding/product
│   ├── /onboarding/role
│   └── /onboarding/referral
│
└── (standalone pages — no special layout)
    ├── /                                            — redirect placeholder (handled by middleware)
    ├── /auth/oauth-popup-callback                  — popup window handler for OAuth flows
    ├── /home                                        — public landing page
    ├── /privacy                                     — privacy policy
    ├── /terms                                       — terms of service
    ├── /design                                      — design system reference (internal)
    ├── /option1                                     — artifact creation / chat prototype
    ├── /shopify                                     — Shopify auth entry point
    └── /test-pages/test-all-events                 — Mixpanel event testing (internal)
```

---

## Root Layout — Provider Stack

**File**: `app/layout.tsx`

All pages render inside this provider hierarchy (outer → inner):

| Provider | Purpose |
|----------|---------|
| `RollbarProvider` | Client-side error tracking and alerting |
| `MixpanelProvider` | Product analytics event tracking |
| `PostHogProvider` | Session recording, feature flags (A/B testing) |
| `GrowthBookProvider` | Feature flag evaluation (GrowthBook SDK) |
| `CSRFProvider` | CSRF token injection for all mutating requests |
| `QueryProvider` | TanStack Query client with global configuration |
| `SessionValidationProvider` | Periodic auth session refresh/validation |
| `ThemeProvider` | Light theme only (forced, no system/dark mode) |
| `DemoModeProvider` + `DemoModeIndicator` | Demo mode flag for sales demos |
| `ChunkLoadErrorHandler` | Handles Next.js chunk load failures (auto-reload) |
| `EnrichmentOverlay` | Global overlay for creator enrichment in-progress UI |
| `Toaster` (sonner) | Toast notification system, top-right position |

Google Tag Manager (`GTM-MVWKLM7N`) is injected via a `<Script>` tag in `<head>`.

Fonts: Inter (`--font-sans`) and DM Sans (`--font-dm-sans`) loaded from Google Fonts.

---

## Middleware — Auth Gates

**File**: `utils/supabase/middleware.ts`

The Supabase middleware runs on every request. It performs:

1. **Session hydration**: Calls `supabase.auth.getUser()` and forwards `x-cheerful-user` and `x-user-logged-in` headers to downstream API handlers.

2. **Protected route enforcement** — routes requiring auth:
   - `/mail`, `/settings`, `/dashboard`, `/campaigns`
   - If unauthenticated → redirect to `/sign-in`

3. **Onboarding route enforcement**:
   - All `/onboarding/*` routes require auth
   - If unauthenticated → redirect to `/sign-in`

4. **Root redirect**: `/` always redirects (to `/sign-in` if logged out)

5. **Post-auth routing** (logged-in user on auth pages or root):
   - Checks `onboarding_completed` cookie first (avoids DB query on repeat visits)
   - Falls back to `user_onboarding` table query
   - **Onboarding not completed** → redirect to `/onboarding`
   - **Onboarding completed** → redirect to `/mail`
   - Exception: `/onboarding/connect-email` is always accessible even post-onboarding (email reconnect flow)

6. **Shopify bypass**: `/shopify` passes through unconditionally.

### Auth Gate Summary

| Route | Unauthenticated | Authenticated + Onboarding Incomplete | Authenticated + Onboarding Complete |
|-------|----------------|--------------------------------------|-------------------------------------|
| `/` | → `/sign-in` | → `/onboarding` | → `/mail` |
| `/sign-in` | show page | → `/onboarding` | → `/mail` |
| `/mail`, `/dashboard`, `/campaigns`, `/settings` | → `/sign-in` | allowed | allowed |
| `/onboarding/*` | → `/sign-in` | allowed | → `/mail` (except `/connect-email`) |
| `/onboarding/connect-email` | → `/sign-in` | allowed | allowed |

---

## Navigation Structure — AppSidebar

**File**: `components/app-sidebar.tsx`

A narrow icon sidebar (66px wide) rendered only in the `(mail)` layout group. Hidden on mobile (`hidden md:block`).

### Primary Navigation

| Icon | Label | Route | Active Detection |
|------|-------|-------|-----------------|
| Mail | Mail | `/mail?view=pending` | `pathname.startsWith("/mail")` |
| Search | Search | `/search` | `pathname.startsWith("/search")` |
| ListTodo | Lists | `/lists` | `pathname.startsWith("/lists")` |
| Megaphone | Campaigns | `/campaigns` | `pathname.startsWith("/campaigns")` |
| LayoutDashboard | Dashboard | `/dashboard` | `pathname.startsWith("/dashboard")` |

Active state: gradient ring (purple→orange→yellow) via `background: "linear-gradient(135deg, #B04ADC, #FF7247, #F3B246)"`.

### Notification Dots

Two notification types appear on nav icons:
- **Amber/warning dot** (12px): Issues needing attention (e.g., Campaigns with Google Sheets access problems — `campaignWarnings` from `useNotificationsStore`)
- **Red dot** (8px): Standard new-activity notifications — only shown if no warning dot present

Search icon becomes animated (spinning conic gradient ring) when a search is in progress (`isSearching` from `useSearchStore`).

### Bottom Controls

| Control | Route / Action |
|---------|---------------|
| `SidebarSetupIndicator` | Opens `SetupChecklistModal` — shows until setup complete |
| Help / HelpCircle icon | `/dashboard?startWalkthrough=true` |
| User avatar | `/settings` — ring highlight when active |

### Setup Checklist Logic

The sidebar tracks two setup tasks:
1. **Connect email** — checks `checkUserCredentials()` server action
2. **Create a campaign** — checks `useCampaigns()` query (length > 0)

When both complete, `completeSetupChecklist` mutation fires once (guarded by `useRef`). The indicator hides once `onboardingStatus.setupChecklistCompleted === true`.

### Visual Shell

**File**: `app/(mail)/mail-layout-client.tsx`

The `(mail)` layout renders as:
```
div.flex.h-screen.bg-[#f6f6f6]                — full-screen gray container
  GradientBackground                           — decorative animated gradient
  AppSidebar                                   — 66px icon nav (desktop only)
  main.flex-1                                  — page content area, p-5 pl-0
    {children}                                 — page component
```

Accounts (connected Gmail inboxes) are pre-hydrated from `localStorage` (`CHEERFUL_ACCOUNTS` key) to avoid layout shift.

Loading skeleton: two rounded white panels (sidebar + content area) matching the actual layout dimensions.

---

## Route Map

### Public / Auth Routes

| Path | Component | Purpose |
|------|-----------|---------|
| `/sign-in` | `UnifiedAuthForm` | Combined sign-in/sign-up with email+password and Google OAuth. Two-column layout (form left, hero visual right). |
| `/sign-up` | redirect | Deprecated — redirects to `/sign-in` |
| `/forgot-password` | `ForgotPasswordForm` | Email-based password reset initiation |
| `/reset-password` | `ResetPasswordForm` | Token-based password reset completion |
| `/set-password` | `SetPasswordForm` | First-time password set (e.g., after invite) |
| `/auth/oauth-popup-callback` | `OAuthPopupCallbackContent` | Receives OAuth result in a popup window, sends `postMessage` to parent, then closes. Used for Google email connection during onboarding and settings. |

### Onboarding Flow

Ordered sequence — each step navigates forward via router.push:

| Step # | Path | Component | Purpose |
|--------|------|-----------|---------|
| 1 | `/onboarding` | `WelcomeStep` | Brand intro with animated illustration (man+dashboard → girl+megaphone). "Next" → `/onboarding/connect` |
| 2 | `/onboarding/connect` | `ConnectStep` | "All in one place" — showcases integrations (Sheets, Shopify, Docusign). Animated `ConnectedIcons`. "Next" → `/onboarding/describe` |
| 3 | `/onboarding/describe` | `DescribeStep` | Brand description input — what the company does. "Next" → `/onboarding/product` |
| 4 | `/onboarding/product` | `ProductStep` | Product details input — what product/service to promote. "Next" → `/onboarding/role` |
| 5 | `/onboarding/role` | `RoleStep` | Role selection (Brand Agency, Creator Agency, Creator, Sales, Other). Saved to `onboarding-store`. "Next" → `/onboarding/referral` |
| 6 | `/onboarding/referral` | `ReferralStep` | Referral source selection (Google, Social Media, Friend/Colleague, LinkedIn, Other). "Next" → submits via `useCompleteOnboarding` → `/dashboard?startWalkthrough=true` |
| — | `/onboarding/connect-email` | `ConnectEmailStep` | Email provider connection (Google OAuth popup flow). Also accessible post-onboarding for reconnection. |

**State Management**: `onboarding-store.ts` (Zustand + localStorage persist, key `onboarding-storage`). Stores `selectedRole`, `selectedReferral`, `referralOtherText`. Reset on `useCompleteOnboarding` success.

**Completion**: `useCompleteOnboarding` mutation POSTs role + referral to backend, receives response, sets `onboarding_completed` status. Middleware then writes `onboarding_completed` cookie to skip future DB queries.

### Main App Routes (Mail Group — require auth)

| Path | Component | Purpose |
|------|-----------|---------|
| `/mail` | `MailClientWrapper` | Core email client — thread list + thread detail pane. Default view: `?view=pending`. Separate mobile layout (`isMobile={true}`). |
| `/dashboard` | `DashboardPage` | Analytics overview with 4 metric cards (total creators, response rate, emails sent, opt-in rate), active campaigns table, follow-up stats, pipeline cards (gifting/paid), recent opt-ins. First visit shows `WelcomeModal` → `WalkthroughModal`. |
| `/campaigns` | `CampaignsClient` | Campaign list with search/filter. Cards show name, type, status, creator count. |
| `/campaigns/new` | `NewCampaignClient` | 7-step campaign creation wizard. Accepts `?draft=<id>` to resume a draft. Left sidebar shows step progress. |
| `/campaigns/[id]` | `CampaignDetailClient` | Campaign detail — creator list with status, thread links, manual actions, settings. |
| `/lists` | `ListsClient` | Creator lists (saved searches/segments). Shows list cards with creator count. |
| `/lists/[id]` | `ListDetailClient` | List detail — table of creators with social handles, enrichment status, bulk actions. |
| `/search` | `SearchPageClient` | AI-powered creator discovery. Animated search icon in sidebar during active search. |
| `/team` | `TeamPage` | Team management. Two-panel: team selector sidebar + team detail (members, campaign assignments). Owner sees campaign assignment section; members see their own assignments. Not in primary sidebar nav. |
| `/settings` | `SettingsPage` | Two tabs: `email` (connected accounts, email signatures) and `team`. PostHog session recording paused while on this page. |

### Special / Internal Routes

| Path | Purpose |
|------|---------|
| `/home` | Public landing page |
| `/privacy` | Privacy policy |
| `/terms` | Terms of service |
| `/design` | Internal design system reference page |
| `/option1` | Prototype: artifact creation / AI chat interface |
| `/shopify` | Shopify app installation entry (handles OAuth, bypasses middleware auth) |
| `/test-pages/test-all-events` | Internal: fires all Mixpanel events for validation |

---

## Loading State Strategy

All major `(mail)` routes use the `Suspense` + skeleton pattern:

```
page.tsx
  Suspense fallback={<SkeletonComponent />}
    ClientComponent (actual page content)
```

Skeleton components mirror the real layout's card/grid structure using `animate-pulse` placeholder elements. This prevents layout shift on initial load.

The `(mail)` layout itself has a skeleton (`MailLayoutSkeleton`) showing the 66px sidebar panel + content area as gray rounded rectangles.

---

## Key Observations

1. **Route groups as concern separators**: `(auth-pages)` and `(mail)` are Next.js route groups (parentheses don't affect URL). This cleanly separates auth UI, app UI, and their respective layouts.

2. **Middleware is the true auth gate**: Client components don't perform redirects — all auth routing logic is centralized in `utils/supabase/middleware.ts`. Cookie-first optimization avoids DB queries on repeat visits.

3. **`/team` is a hidden page**: It's not in the sidebar `navItems` array but is accessible at `/team`. The team management functionality reachable from `/settings` (TeamSettingsContent) may be a newer entry point.

4. **Mobile responsiveness**: The `(mail)` layout hides the sidebar on mobile (`hidden md:block`). The mail page renders a separate `isMobile={true}` layout. Other pages use responsive Tailwind classes but aren't specifically mobile-optimized.

5. **Onboarding as linear funnel**: Each onboarding page is a separate URL (no SPA wizard), allowing browser back navigation. The Zustand store persists selections across navigations.

6. **`/onboarding/connect-email` special treatment**: The only onboarding route accessible to already-onboarded users. Used for re-connecting email (e.g., after token expiry). Middleware explicitly exempts this path from the "redirect completed users away from onboarding" rule.

7. **PostHog session recording paused on `/settings`**: Privacy consideration — settings contains email addresses and other PII. Recording stops on mount and resumes on unmount.

8. **GrowthBook + PostHog dual feature flag systems**: Two separate feature flag providers suggest a migration in progress. GrowthBook for server-side and experiment flags, PostHog for lightweight client-side toggles.
