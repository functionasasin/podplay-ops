# Current Stage: 15 (Routes + Navigation)

## Status
Stage 14 complete. All 17 auth tests pass. src/lib/auth.ts fully implemented.

## What To Do
Read spec §11, §12. Implement TanStack Router with 18 routes and auth-aware layout.

Tasks:
- Create src/router.ts (createRouter with context)
- Create all 18 route files from spec §11.2 (route table)
- Implement beforeLoad auth guard pattern from spec §11.3
- Create AppLayout.tsx from spec §12.1 (sidebar desktop + drawer mobile)
- Create SidebarContent.tsx from spec §12.2 (auth-aware nav items)

Critical traps:
- Public routes (/, /auth/*, /share/$token) must NOT have auth guard
- Route file naming must follow TanStack Router file conventions exactly
- RouterContext type must include `auth: { user: User | null }`

Test command: `npx vitest run src/routes/`

## Work Log
- 2026-03-06: Stage 1 complete — cargo check passes, advancing to stage 2
- 2026-03-06: Stage 2 complete — all types + rates implemented, cargo check passes
- 2026-03-06: Stage 3 complete — full pipeline (37 tests pass), advancing to stage 4
- 2026-03-06: Stage 4 complete — wasm-pack build succeeds, engine/pkg/ produced, advancing to stage 5
- 2026-03-06: Stage 5 complete — frontend scaffold created, vitest passes (0 tests), vite build succeeds
- 2026-03-06: Stage 6 complete — TypeScript types fully implemented, tsc --noEmit passes with zero errors
- 2026-03-06: Stage 7 complete — Zod schemas implemented, 77 tests pass
- 2026-03-06: Stage 8 complete — design system set up, vite build produces 33.82 kB CSS
- 2026-03-06: Stage 9 complete — 36 tests pass for wizard routing + hooks, advancing to stage 10
- 2026-03-06: Stage 10 complete — 80 tests pass for wizard steps WS-00 through WS-07D, advancing to stage 11
- 2026-03-06: Stage 11 complete — 128 tests pass for wizard steps WS-08 through WS-13 + REVIEW, advancing to stage 12
- 2026-03-06: Stage 12 complete — 42 tests pass for results components + format utilities, advancing to stage 13
- 2026-03-06: Stage 13 complete — supabase db reset passes, all 4 migrations match spec §10, .env.local.example created, advancing to stage 14
- 2026-03-06: Stage 14 complete — 17 auth tests pass, advancing to stage 15
