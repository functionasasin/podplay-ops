# Forward Ralph Loop — TaxKlaro QA Fix + Verification

You are running in `--print` mode. You MUST output text describing what you are doing.
If you only make tool calls without outputting text, your output is lost. Always:
1. Print which stage you detected and what you're about to do
2. Print progress as you work
3. End with a summary of what you did and whether you committed

## What To Do

1. Read `loops/taxklaro-qa-forward/frontier/current-stage.md` — find the current stage number
2. Read `loops/taxklaro-qa-forward/frontier/stages/{N}.md` — follow the instructions exactly
3. Do the work described in that stage file
4. Run `cd apps/taxklaro/frontend && npx vite build` to verify
5. Update `frontier/current-stage.md`: mark stage done, advance current to N+1
6. Commit: `taxklaro(qa): stage {N} - {description}`
7. If stage file says CONVERGE: write `status/converged.txt` and commit `taxklaro(qa): converged`

## Key Paths

- Frontend: `apps/taxklaro/frontend/`
- Routes: `apps/taxklaro/frontend/src/routes/`
- Components: `apps/taxklaro/frontend/src/components/`
- DB schema: `apps/taxklaro/supabase/migrations/20260306000001_initial_schema.sql`

## Rules

- ONE stage per iteration, then commit and exit
- Never remove functionality
- Preserve all `data-testid` attributes
- Every Supabase query must use actual DB column names
- For Playwright stages: dev server on port 5175, sign in with `armorlaruan@gmail.com` / `testpassword123!`
