# Current Stage: 5 (Wizard Polish)

## Status
Stage 4 complete. Landing page has hero + 3-column feature grid + trust copy + footer (copyright).
Auth pages: DM Serif Display h2 card titles, shadow-lg card, logo above form, full-width button,
text link secondary actions. Reset + reset-confirm: same card pattern, DM Serif Display h2.
Onboarding: card with logo above, DM Serif Display h2 heading in OnboardingForm. Build passes.

## What To Do
Restyle the wizard at `/computations/new`:
- Progress bar: h-3, rounded, subtle gradient fill, step count in DM Sans
- Step container: card with shadow-md, p-8
- Radio cards: border + shadow on hover, selected state primary border + light blue bg
- Form fields: proper label spacing (mb-1.5), h-11 inputs, focus ring in primary
- PesoInput: peso prefix styled with muted foreground
- Navigation: Back=outline, Next=primary, proper spacing
- WizardReview: sections as cards, serif section titles
- Section headings within steps: DM Serif Display h2

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
