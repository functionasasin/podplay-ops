# Current Stage: 2 (AppLayout Wiring)

## Status
Stage 1 complete. Fonts installed (DM Sans Variable + DM Serif Display), design tokens
defined in index.css (typography scale, shadow scale, font utility classes). Build passes.

## What To Do
Wire AppLayout into the route tree so all authenticated pages get the sidebar + main
content structure. Update __root.tsx to create an authenticated layout route that uses
AppLayout. Move computations/*, clients/*, deadlines, settings/* under it. Keep public
routes (/, auth/*, share/*, invite/*, onboarding) outside AppLayout.

## Work Log
- Stage 1: Installed fonts, defined CSS design tokens, verified build ✓
