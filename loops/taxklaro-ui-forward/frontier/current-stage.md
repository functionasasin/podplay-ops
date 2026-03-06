# Current Stage: 9 (Responsive + Spacing Audit)

## Status
Stage 8 complete. Utility pages polished:
- Deadlines: already polished from prior work (font-display h1/h2, shadow-sm cards, urgency colors, grid layout)
- Settings: already polished (section cards with shadow-sm, font-display headings, h-11 inputs)
- Team: already polished (InviteMemberForm card, MembersTable/PendingInvitationsTable with shadow-sm)
- Share view: fixed skeleton cards (rounded-xl bg-card shadow-sm, removed flat border)
- Quarterly: QuarterlyBreakdownView fully restyled — font-display h2, shadow-sm hover:shadow-md cards, font-display amounts
- Build passes.

## What To Do
Responsive + spacing audit across all routes:
- Audit every route at 3 breakpoints: mobile (375px), tablet (768px), desktop (1280px)
- Consistent padding: page content p-4 (mobile) / p-6 (tablet) / p-8 (desktop)
- Touch targets: all interactive elements >= 44px height on mobile
- Form inputs: full-width on mobile, max-w constraints on desktop
- Cards: single column on mobile, grid on tablet+
- Tables: horizontal scroll wrapper on mobile
- Typography: hero text scales down on mobile (3rem -> 2rem)
- Sidebar: drawer works smoothly, hamburger properly positioned
- Run `npx vitest run` — no test regressions

## Work Log
- Stage 1 (2026-03-06): Installed @fontsource-variable/dm-sans + @fontsource/dm-serif-display.
  Updated index.css: replaced Inter, added --font-sans/--font-display vars, typography
  scale (hero/h1/h2/h3/body/small), shadow scale (sm/md/lg), .font-display utility class.
  Build verified. Committed abcd7baa.
- Stage 2 (2026-03-06): AppLayout wiring was already complete — __root.tsx had
  authenticatedRoute/publicRootRoute, router.ts had correct route tree organization.
  Verified build passes and all 549 tests pass.
- Stage 3 (2026-03-06): Sidebar + AppLayout already polished from prior loop run.
  DM Serif Display logo, left-border active state, proper padding, hover transitions.
  Verified build passes.
- Stage 4 (2026-03-06): Landing page footer added (copyright line). Auth/reset/reset-confirm
  h1 headings updated from text-xl font-semibold to font-display (DM Serif Display, --text-h2).
  Onboarding already polished. Build passes.
- Stage 5 (2026-03-06): Wizard polish. Removed duplicate WizardNavControls rendering from new.tsx.
  Updated all 13 wizard steps: Back buttons → variant="outline" h-11 px-5, Continue → h-11 px-6.
  WS11RegimeElection radio options refactored to Card-based pattern (matching WS00/WS01/WS06).
  Build passes.
- Stage 6 (2026-03-06): Results view polish. InstallmentSection + PercentageTaxSummary upgraded
  to shadow-sm cards with font-display titles. ManualReviewFlags given yellow-tinted card styling
  and font-display title. $compId.tsx page header now shows status Badge (green for complete).
  ResultsView spacing increased to space-y-6. Build passes.
- Stage 7 (2026-03-06): List pages polish. ComputationCardSkeleton: removed flat border.
  ClientRowSkeleton: fixed invalid <tr>-in-div HTML, refactored to div-based skeleton.
  ClientsTable loading state: wrapped in rounded-xl bg-card shadow-sm card.
  ClientInfoCard: replaced redundant name h2 with "Client Information" section label.
  Build passes.
- Stage 8 (2026-03-06): Utility pages polish. QuarterlyBreakdownView: font-display h2,
  shadow-sm hover:shadow-md cards, font-display amounts with tabular-nums.
  share/$token.tsx: skeleton cards upgraded from flat border to shadow-sm rounded-xl.
  All other utility pages were already polished. Build passes.
