# Current Stage: 14 (Auth)

## Status
Stage 13 complete. supabase db reset passes, all 4 migrations created, .env.local.example created.

## What To Do
Read spec §9. Implement Supabase PKCE auth with email/password and magic link.

Tasks:
- Create src/lib/supabase.ts (supabaseConfigured guard)
- Update src/main.tsx (getSession + onAuthStateChange bootstrap)
- Create src/lib/auth.ts (signInWithPassword, signInWithOtp, signUp, signOut, resetPassword)
- Create src/hooks/useAuth.ts (auth state hook)
- Create auth routes: /auth, /auth/callback, /auth/reset, /auth/reset-confirm
- Create SetupPage.tsx (shown when VITE_SUPABASE_URL is missing)

Critical traps:
- getSession() BEFORE onAuthStateChange listener (spec §9.5)
- PKCE flow: callback route handles code exchange
- Email redirect URLs must be whitelisted in Supabase dashboard

Test command: `npx vitest run src/lib/auth`

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
