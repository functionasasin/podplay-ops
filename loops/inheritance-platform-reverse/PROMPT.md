# Inheritance Platform Layer — Reverse Ralph Loop

You are an analysis agent in a ralph loop. Each time you run, you do ONE unit of work, then exit.

You are running in `--print` mode. You MUST output text describing what you are doing. If you only make tool calls without outputting text, your output is lost and the loop operator cannot see progress. Always:
1. Start by printing which aspect you detected and what you're about to do
2. Print progress as you work
3. End with a summary of what you did and whether you committed

## Your Goal

Audit the inheritance calculator app's platform layer against three sources — the live codebase, the premium spec, and the documented failure log — then produce a comprehensive platform layer spec that covers every gap, stub, UX dead end, and design modernization opportunity.

The output is a single spec document at `docs/plans/inheritance-platform-spec.md` with exact component specs, exact route tables, exact auth flows, and per-component design modernization guidance. The design direction is: **keep the Navy + Gold palette, modernize everything else** — think Linear/Vercel dashboard meets professional legal tool.

## Your Working Directory

You are running from `loops/inheritance-platform-reverse/`. All paths below are relative to this directory.

## Source Material

### Primary Sources (read these in Wave 1)

1. **Live codebase**: `loops/inheritance-frontend-forward/app/src/` — every route, component, hook, lib, and config file
2. **Premium spec**: `docs/plans/inheritance-premium-spec.md` — what was specified for premium features (auth, CRM, PDF, tax, multi-seat)
3. **Failure frontier (forward)**: `loops/inheritance-frontend-forward/frontier/analysis-log.md` — 5 documented failures from first manual run
4. **Failure frontier (reverse)**: `loops/inheritance-frontend-reverse/frontier/aspects.md` — 3 documented spec failures (children for representation, auth flow absent, duplicate migration)
5. **Current CSS/design**: `loops/inheritance-frontend-forward/app/src/index.css` — current palette and design tokens

### Reference Material (fetch in Wave 1)

Modern SaaS dashboards for design inspiration (Navy+Gold modernized):
- Linear.app — sidebar nav, command palette, transitions
- Vercel dashboard — clean cards, status indicators, deployment flow
- Cal.com — scheduling UI, onboarding wizard, settings pages

## What To Do This Iteration

1. **Read the frontier**: Open `frontier/aspects.md`
2. **Find the first unchecked `- [ ]` aspect** in dependency order (Wave 1 before Wave 2, etc.)
   - If ALL aspects are checked `- [x]`: write convergence summary to `status/converged.txt` and exit
3. **Analyze that ONE aspect** using the method described for its wave
4. **Write findings** to `analysis/{aspect-name}.md`
5. **Update the frontier**:
   - Mark the aspect as `- [x]`
   - Update Statistics (increment Analyzed, decrement Pending, update Convergence %)
   - If you discovered new aspects, add them to the appropriate Wave
   - Add a row to `frontier/analysis-log.md`
6. **If this is a synthesis aspect (Wave 4)**, also append to or update the spec document at `docs/plans/inheritance-platform-spec.md`
7. **Commit**: `git add -A && git commit -m "loop(inheritance-platform-reverse): {aspect-name}"`
8. **Exit**

## Analysis Methods By Wave

### Wave 1: Source Acquisition
**Goal**: Read and catalog all source material so subsequent waves can reference it without re-reading everything.

For codebase aspects:
- Read every file in the specified directory
- Catalog: file path, what it does, what it exports, any stubs/placeholders/gaps found
- Note anything that looks broken, incomplete, or inconsistent

For reference site aspects:
- Use web search to find screenshots/descriptions of the site's dashboard UI
- Note specific patterns worth adopting: nav style, card design, loading states, transitions, color usage
- Focus on patterns that work with a Navy + Gold palette

For spec/failure aspects:
- Read the document and extract every actionable item
- Separate into: things already built, things partially built, things not built at all

### Wave 2: User Journey Audit
**Goal**: Walk every user journey end-to-end through the actual codebase, documenting every gap.

For each journey:
1. Start at the entry point (URL/route)
2. Read the route component and every component it renders
3. Trace every user action (click button → what handler fires → what API call → what happens)
4. Document: Does this work? Is the UI complete? Are there dead ends? Missing error states? Loading states? Empty states?
5. Rate each journey: WORKING / PARTIAL / BROKEN / MISSING

### Wave 3: Design Modernization Audit
**Goal**: Review every component against modern SaaS standards and propose specific modernizations.

For each component group:
1. Read the current component code
2. Identify: raw unstyled elements, missing animations/transitions, missing loading states, dated patterns
3. Propose specific modernization: what to change, what CSS/component to use, what the result should look like
4. All proposals MUST preserve the Navy (#1e3a5f) + Gold (#c5a44e) palette
5. Mobile/responsive: verify breakpoints exist and work, propose fixes for any that don't

### Wave 4: Synthesis
**Goal**: Assemble all findings into the platform layer spec.

The spec at `docs/plans/inheritance-platform-spec.md` must contain:

```
§1  Overview (what this spec covers, what sources it's based on)
§2  Route Table (every route: path, component, auth requirement, status: working/broken/missing)
§3  Authentication Flow
    §3.1  Sign-up (email/password form, fields, validation, confirmation flow)
    §3.2  Sign-in (form, error states, redirect after auth)
    §3.3  Session Management (token persistence, refresh, expiry handling)
    §3.4  Sign-out (cleanup, redirect)
    §3.5  Password Reset (if applicable)
§4  Environment Configuration
    §4.1  Required env vars (name, purpose, example value)
    §4.2  .env.local.example (exact contents)
    §4.3  Graceful missing-var handling (no crash, show setup instructions)
§5  Database Migrations
    §5.1  Migration inventory (what exists, what's broken)
    §5.2  Idempotency rules
    §5.3  Setup instructions for fresh project
§6  Navigation
    §6.1  Sidebar (desktop: items, icons, active states, auth-aware sections)
    §6.2  Mobile header + nav (responsive behavior)
    §6.3  Auth-aware rendering (what unauth users see vs auth users)
§7  Landing Page
    §7.1  Unauthenticated view (product description, sign-in/sign-up CTA, value proposition)
    §7.2  Authenticated view (dashboard: recent cases, quick actions, deadline summary)
§8  User Journey Fixes (per-journey gap list with exact fix spec)
§9  Design Modernization
    §9.1  Design tokens update (any palette/typography/spacing refinements)
    §9.2  Per-component modernization specs (current state → target state)
    §9.3  Animation/transition standards (what transitions to add, duration, easing)
    §9.4  Loading states (skeleton patterns, spinner placement)
    §9.5  Empty states (illustration + CTA pattern for each empty view)
    §9.6  Mobile/responsive audit (breakpoint fixes, touch targets, mobile-specific layouts)
§10 Onboarding Flow (first-time user experience after sign-up: org creation, first case prompt)
Appendix A: Complete File Inventory (every file in src/ with status)
Appendix B: Known Failures (from frontier docs, with fix status)
```

**DEPENDENCY ORDER within Wave 4** (strict):
1. `spec-draft` — Assemble all findings. Every section fully written.
2. `placeholder-validation` — **HARD GATE.** Scan spec for banned patterns (TODO, TBD, empty sections). MUST return PASS.
3. `completeness-audit` — Verify every gap found in Wave 2 has an exact fix in the spec. Per-gap PASS/FAIL.
4. `spec-review` — Final review: could a developer fix every platform issue and modernize every component from this spec alone?

## Rules

- Do ONE aspect per run, then exit.
- Check dependencies before starting an aspect (Wave 2 needs Wave 1 source catalog).
- Write findings in markdown with specific file paths, line numbers, and code references.
- Discover new aspects and add them to the frontier as you find them.
- Keep analysis files focused. One aspect = one file.
- The spec is the artifact. Everything else is scaffolding.
- **Design direction**: Navy (#1e3a5f) + Gold (#c5a44e) palette stays. Everything else modernizes: better spacing, transitions, loading states, card patterns, empty states.
- **No vague recommendations.** Every finding must have an exact fix: which file, what change, what the result should look like.

## HARD CONSTRAINT: Zero Placeholders in Final Spec

### Banned Patterns (literal matches, case-insensitive)

**Marker words**: `TODO`, `TBD`, `FIXME`, `XXX`, `HACK`, `PLACEHOLDER`, `STUB`

**Deferral phrases**: "to be defined", "to be determined", "will be specified later", "needs further research", "details TBD", "see later", "coming soon"

**Empty structures**: Sections with only a heading and no content, table rows with empty cells, code blocks with only comments

### What "Implementation-Ready" Means

Every fix/modernization in the spec must have:
- **Exact file path**: Which file to modify
- **Exact change**: What to add/remove/replace
- **Exact result**: What the component should look like/behave after the fix
- **Exact error handling**: What happens when things go wrong

## Commit Convention

```
loop(inheritance-platform-reverse): {aspect-name}
```
