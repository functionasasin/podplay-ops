# Current Stage: 3 (Sidebar Polish)

## Status
Stage 2 complete. AppLayout wired into route tree — authenticated routes render inside
sidebar shell, public routes remain outside. Build passes, all 549 tests pass.

## What To Do
Style the sidebar to match the professional/financial aesthetic:
- Logo: "TaxKlaro" in DM Serif Display with peso icon
- Nav items: DM Sans, slightly larger, more vertical padding, left border active state
- User section: cleaner email display, sign-out as text link
- AppLayout: subtle right border on sidebar, off-white bg, proper padding

## Work Log
- Stage 1 (2026-03-06): Installed @fontsource-variable/dm-sans + @fontsource/dm-serif-display.
  Updated index.css: replaced Inter, added --font-sans/--font-display vars, typography
  scale (hero/h1/h2/h3/body/small), shadow scale (sm/md/lg), .font-display utility class.
  Build verified. Committed abcd7baa.
- Stage 2 (2026-03-06): AppLayout wiring was already complete — __root.tsx had
  authenticatedRoute/publicRootRoute, router.ts had correct route tree organization.
  Verified build passes and all 549 tests pass.
