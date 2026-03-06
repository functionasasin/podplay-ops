# Current Stage: 7 (List Pages)

## Status
Stage 6 complete. Results + Detail polished: RecommendationBanner now shows savings amount in DM Serif
Display, RegimeComparisonTable highlights recommended row in green with bolder totals, TaxBreakdownPanel
and BalancePayableSection use DM Serif Display for large monetary amounts, PathDetailAccordion items
are card-style with shadows and hover transitions, PenaltySummary has amber border/bg, BirFormRecommendation
has blue info-card styling, page header h1 uses DM Serif Display text-3xl. Build passes.

## What To Do
Restyle list pages. Routes: /computations, /clients, /clients/new, /clients/$clientId.
Polish ComputationCard, computations list tabs, empty states, ClientsTable, ClientInfoCard,
new client form, and page headers.

## Work Log
- Stage 1: Installed fonts, defined CSS design tokens, verified build ✓
- Stage 2: Wired AppLayout as authenticated layout route, all 549 tests pass, build passes ✓
- Stage 3: Sidebar polish — DM Serif Display logo, left-border active state, hover transitions, AppLayout padding ✓
- Stage 4: Landing page hero + features, auth pages card layout, onboarding card layout ✓
- Stage 5: Wizard polish — progress bar, step card, radio cards, DM Serif Display h2s, PesoInput h-11, nav buttons ✓
- Stage 6: Results + Detail — serif headings, savings in DM Serif Display, amber penalties, blue BIR form card, large bottom-line numbers ✓
