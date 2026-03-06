# Current Stage: 6 (Results + Detail)

## Status
Stage 5 complete. Wizard at `/computations/new` polished:
- WizardProgressBar: h-3, gradient fill, DM Sans step count — already done
- Step container: shadow-md card with p-8 — already done
- Radio cards (WS00, WS01, WS02, WS06, WS11): Card-based hover+selected state — WS11 updated to match
- Navigation: Removed duplicate WizardNavControls from new.tsx. All steps now use
  variant="outline" h-11 px-5 for Back, h-11 px-6 for Next/Continue.
- WizardReview: sections as shadow-sm cards, font-display section titles — already done
- Section headings: font-display text-2xl — already done across all steps
- Build passes.

## What To Do
Restyle the results view at `/computations/$compId`:
- RecommendationBanner: prominent card with green accent, savings amount in DM Serif Display
- RegimeComparisonTable: clean table with highlighted recommended column, tabular nums
- TaxBreakdownPanel: card sections with clear labels, amounts right-aligned
- PathDetailAccordion: smooth expand/collapse, indented detail rows
- BalancePayableSection: large bottom-line number in DM Serif Display, green/red coloring
- PenaltySummary: amber-bordered warning card
- BirFormRecommendation: subtle info card with form type badge
- Page header: computation title in DM Serif Display, status badge, back navigation

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
