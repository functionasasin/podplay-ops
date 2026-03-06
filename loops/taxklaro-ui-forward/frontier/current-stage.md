# Current Stage: 7 (List Pages)

## Status
Stage 6 complete. Results view at `/computations/$compId` polished:
- RecommendationBanner: green accent card, savings in font-display text-2xl — already done
- RegimeComparisonTable: font-display title, shadow-sm, tabular-nums, green recommended row — already done
- TaxBreakdownPanel: font-display title, shadow-sm, right-aligned amounts — already done
- PathDetailAccordion: shadow-sm + hover:shadow-md, rounded-xl, smooth expand — already done
- BalancePayableSection: font-display text-2xl for big numbers, color-coded — already done
- PenaltySummary: amber-bordered card, font-display title + total amount — already done
- BirFormRecommendation: blue-tinted info card, primary badge — already done
- InstallmentSection: upgraded to shadow-sm Card, font-display text-xl title
- PercentageTaxSummary: upgraded to shadow-sm Card, font-display text-xl title
- ManualReviewFlags: upgraded to yellow-tinted card with font-display title
- Page header ($compId.tsx): status Badge added (green for complete, secondary otherwise)
- ResultsView: space-y-6 for more breathing room
- Build passes.

## What To Do
Restyle list pages at `/computations`, `/clients`, `/clients/new`, `/clients/$clientId`:
- ComputationCard: shadow-sm, hover shadow-md transition, serif title, clean metadata layout
- Computations list: proper grid gap, tabs styled with underline variant
- Empty states: illustration or large icon, helpful copy, clear CTA
- ClientsTable: clean borders, hover row highlight, proper cell padding
- Client detail: ClientInfoCard with sections, serif name heading
- New client form: same form styling as auth (full-width inputs, proper spacing)
- Page headers: DM Serif Display h1, action buttons right-aligned

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
