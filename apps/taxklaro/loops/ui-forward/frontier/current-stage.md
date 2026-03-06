# Current Stage: 8 (Utility Pages)

## Status
Stage 7 complete. List pages polished: ComputationCard uses DM Serif Display title with shadow-sm/hover:shadow-md,
ComputationCardSkeleton matches new card sizing, computations list uses serif h1 + line-variant tabs + polished
empty states with icon circles. ClientsTable has clean uppercase headers, proper padding, hover transitions.
ClientInfoCard has serif h2 name + section rows with labels. New client form wrapped in shadow-md card with h-11
inputs. Client detail page uses serif h1 for client name + polished back nav. Build passes.

## What To Do
Restyle utility pages. Routes: /deadlines, /settings, /settings/team, /share/$token, /computations/$compId/quarterly.
Polish deadline cards with date prominence, settings section cards with serif headings, team members table,
share view header, quarterly breakdown table.

## Work Log
- Stage 1: Installed fonts, defined CSS design tokens, verified build ✓
- Stage 2: Wired AppLayout as authenticated layout route, all 549 tests pass, build passes ✓
- Stage 3: Sidebar polish — DM Serif Display logo, left-border active state, hover transitions, AppLayout padding ✓
- Stage 4: Landing page hero + features, auth pages card layout, onboarding card layout ✓
- Stage 5: Wizard polish — progress bar, step card, radio cards, DM Serif Display h2s, PesoInput h-11, nav buttons ✓
- Stage 6: Results + Detail — serif headings, savings in DM Serif Display, amber penalties, blue BIR form card, large bottom-line numbers ✓
- Stage 7: List pages — serif h1s, shadow cards, line tabs, polished empty states, ClientsTable polish, ClientInfoCard sections ✓
