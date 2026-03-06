# Current Stage: 4 (Landing + Auth Pages)

## Status
Stage 3 complete. Sidebar already polished from prior run — DM Serif Display logo with
peso sign, left-border active state, nav items at 0.9375rem with vertical padding,
hover transitions, clean user section. AppLayout has proper desktop border, off-white bg,
p-4 sm:p-6 md:p-8 main content padding. Build passes.

## What To Do
Restyle the landing page and auth routes:
- `/`: Hero with DM Serif Display headline, feature grid (3 columns), CTA button, trust copy, footer
- `/auth`: Centered card with warm shadow, DM Serif Display logo above form, full-width primary button
- `/auth/reset`, `/auth/reset-confirm`: Same centered card pattern
- `/onboarding`: Clean centered card, welcoming DM Serif Display heading

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
