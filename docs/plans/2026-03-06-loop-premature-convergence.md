# Why Loops Converge Prematurely (and How to Fix It)

**Date**: 2026-03-06
**Status**: Active pattern — apply to all future loop brainstorms

## The Problem

Forward loops consistently "converge" at 20-30 stages while leaving significant work undone. The human operator discovers gaps, brainstorms a new loop, and the cycle repeats. A single app (TaxKlaro) required 4 separate loops + manual intervention to reach a functional state.

## Case Study: TaxKlaro

| Loop | Stages | Produced | Missed |
|------|--------|----------|--------|
| freelance-tax-reverse | ~40 iter | Domain spec + 83 test vectors | No platform spec |
| freelance-tax-platform-reverse | ~30 iter | Platform spec | No code |
| taxklaro-forward | 28 stages | Engine, types, schemas, components, tests (549 passing) | Route pages still stubs, no layout wiring, bare UI |
| taxklaro-ui-forward | 10 stages | (in progress) | TBD |
| Manual fix | — | Wired 15 route pages to actual components | — |

Total effort: ~110+ iterations across 4 loops + manual work. Should have been 1 loop.

## Root Causes

### 1. Brainstorm Scope Compression

The brainstorm step optimizes for "what feels like a reasonable number of stages" (20-30). Real apps have hundreds of discrete units of work. The brainstorm compresses them:

- "Wizard Steps WS-00 → WS-07D" = 1 stage, but actually 11 separate components
- "Routes + Navigation" = 1 stage, but actually 18 route files + auth guard + layout
- "Design System" = 1 stage, but actually fonts + tokens + shadows + responsive + component overrides

Each compressed stage should be 3-10 stages. The taxklaro forward loop should have been 80-100 stages, not 28.

**The fix**: When brainstorming, enumerate every discrete file/component/page that needs to exist. If a stage touches more than 3 files, split it. Target 80-150 stages for a full-stack app, not 20-30. Think "1 million years of dev time" — what would the stage list look like if you had unlimited iterations?

### 2. Convergence Checks Are Introspective, Not Extrospective

Every convergence check was structural: "does the code compile?", "do tests pass?", "does grep find stubs?" None were functional: "does the app actually work?"

The loop never opened a browser. Never navigated to a page. Never checked if a wizard rendered. It grepped for `return null` and missed `return <div>placeholder</div>`.

**The fix**: Every forward loop MUST include end-to-end verification stages that test the app from a user's perspective:
- Navigate to every route with Playwright
- Take screenshots
- Verify actual UI renders (not placeholder text)
- Check console for errors
- Test the primary user flow end-to-end

Convergence criteria must include at least one extrospective check:
```
BAD:  "zero grep hits for placeholder/stub"
GOOD: "Playwright navigates to /computations/new and finds a radio group with 3 options"
```

### 3. Stub-First Architecture Creates Illusion of Progress

The priority system (tests → stubs → implement → fix) creates hundreds of files that look complete but are empty shells. Tests pass because they test compilation, not behavior. The build passes because TypeScript doesn't care about `return null`.

By stage 25, the codebase looked "done" — every file existed, every export resolved, 549 tests passed — but the app was a Potemkin village.

**The fix**: The priority system must include a "smoke test" priority between IMPLEMENT and ADVANCE:
```
Priority 3 — IMPLEMENT (write code)
Priority 3.5 — SMOKE TEST (verify it actually works in the browser)
Priority 4 — FIX (address smoke test failures)
Priority 5 — ADVANCE (move to next stage)
```

### 4. No Self-Discovery of Remaining Work

The stage list is fixed at brainstorm time. If the brainstorm missed something (like "wire route pages to components"), no stage covers it, and the loop has no mechanism to discover the gap.

**The fix**: The final stage should be a **discovery stage** that actively looks for gaps:
```
### Stage N — Gap Discovery

Run these checks and create new stages for anything found:

1. For every route in router.ts, verify the page component imports at least one
   component from src/components/. If not, it's a stub.
2. For every component in src/components/, verify it's imported by at least one
   route or parent component. If not, it's orphaned.
3. Navigate to every route with Playwright. If a page shows only plain text
   (no form fields, no cards, no tables), it's unwired.
4. Run the full app flow: land → auth → create computation → fill wizard → see results.
   If any step fails or shows placeholder content, create a stage to fix it.

If gaps are found: create new stages, update frontier, continue.
If no gaps found: converge.
```

## Principles for Future Loops

### 1. Enumerate, Don't Compress
Every file that needs to exist should be its own stage or part of a stage with ≤3 files. If you're writing a stage called "Implement all wizard steps", stop — that's 17 stages.

### 2. Target 80-150 Stages for Full-Stack Apps
20-30 stages is a design doc, not a build plan. A real app has:
- ~20 stages for engine/backend
- ~30 stages for individual components
- ~20 stages for individual route pages
- ~10 stages for auth, layout, navigation
- ~10 stages for data layer (CRUD, hooks, state)
- ~10 stages for polish (empty states, loading, errors)
- ~5 stages for deployment
- ~5 stages for testing
- ~5 stages for end-to-end verification

### 3. Every Loop Gets a Playwright Verification Stage
No loop converges without a stage that opens the app in a browser and verifies every route renders real content. This is non-negotiable.

### 4. Discovery Stages, Not Just Fixed Stages
The last 3-5 stages should be discovery-based: actively hunt for gaps rather than checking a fixed list. The loop should be able to extend itself when it finds work the brainstorm missed.

### 5. Convergence = User Can Complete Primary Flow
The convergence check for any user-facing app must include: "a user can navigate the primary flow from start to finish and see real, functional UI at every step." Not "tests pass and build succeeds."

## Anti-Patterns to Avoid

| Anti-Pattern | Why It Fails | Do This Instead |
|-------------|-------------|-----------------|
| "Implement all X" as one stage | Agent does 2-3, declares done | One stage per X, or max 3 per stage |
| `grep` for stubs as convergence | Misses non-obvious stubs | Playwright navigation + screenshot |
| Tests pass = done | Tests test stubs, not behavior | Smoke test in browser |
| Fixed stage list only | Brainstorm misses gaps | Discovery stages that extend the list |
| Component-level verification | Components exist but aren't wired | Route-level verification |
| 20-30 stages for a full app | Compressed stages hide work | 80-150 stages with granular decomposition |
