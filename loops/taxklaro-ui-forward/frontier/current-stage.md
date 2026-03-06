# Current Stage: 8 (Utility Pages)

## Status
Stage 7 complete. List pages polished:
- ComputationCard: shadow-sm + hover:shadow-md, font-display title, clean metadata — already done
- Computations list: font-display h1, tabs with line variant, empty states with icons/copy/CTA — already done
- ClientsTable: shadow-sm card wrapper, hover row highlight, clean table styling — already done
- ClientInfoCard: shadow-sm card, replaced redundant name h2 with "Client Information" section label
- ClientRowSkeleton: fixed invalid HTML (was rendering <tr> inside <div>); refactored to div-based skeleton
- ClientsTable loading: now wraps skeletons in rounded-xl bg-card shadow-sm card
- ComputationCardSkeleton: removed flat border-border/40 (shadows only, no flat borders)
- clients/new: rounded-xl bg-card shadow-md form card, h-11 inputs — already done
- $clientId: font-display h1 for client name — already done
- Build passes.

## What To Do
Restyle utility pages at `/deadlines`, `/settings`, `/settings/team`, `/share/$token`, `/computations/$compId/quarterly`:
- Deadlines: card grid with date prominence, status indicators, color-coded urgency
- Settings: section cards with clear headings (DM Serif Display), form fields consistent with rest of app
- Team: members table polished, invite form in a card, pending invitations styled
- Share view: read-only results with "Shared via TaxKlaro" header
- Quarterly: breakdown table matching results view styling

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
