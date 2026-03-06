# Current Stage: 13 (Supabase + Migrations)

## Status
Stage 12 complete. 42 tests pass for all results components + format utilities.

## What To Do
Read spec §10. Initialize Supabase and create all database migrations.

Tasks:
- Run `supabase init` in apps/taxklaro/frontend/
- Create supabase/migrations/001_initial_schema.sql (8 tables, 5 enums, triggers)
- Create supabase/migrations/002_rls_policies.sql (32 RLS policies)
- Create supabase/migrations/003_rpc_functions.sql (6 RPCs with explicit GRANTs)
- Create supabase/migrations/004_storage.sql (firm-logos bucket)
- Create .env.local.example

Critical traps:
- p_token parameters MUST be UUID not TEXT
- GRANT EXECUTE ON FUNCTION ... TO anon for public RPCs
- SET search_path = public on all SECURITY DEFINER functions
- ENABLE ROW LEVEL SECURITY explicit on every table
- UNIQUE constraint on computation_deadlines(computation_id, milestone_key)

Test command: `npx supabase db reset`

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
