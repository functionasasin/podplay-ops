# Current Stage: 2 (AppLayout Wiring)

## Status
Stage 1 complete. Fonts installed and design tokens defined in index.css.

## What To Do
Wire AppLayout into the route tree so all authenticated pages render inside the
sidebar + main content shell. Public routes (/, /auth/*, /onboarding, /share/*,
/invite/*) remain outside AppLayout.

## Work Log
- Stage 1 (2026-03-06): Installed @fontsource-variable/dm-sans + @fontsource/dm-serif-display.
  Updated index.css: replaced Inter, added --font-sans/--font-display vars, typography
  scale (hero/h1/h2/h3/body/small), shadow scale (sm/md/lg), .font-display utility class.
  Build verified. Committed abcd7baa.
