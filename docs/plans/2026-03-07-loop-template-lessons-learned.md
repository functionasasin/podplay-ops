# Loop Template Lessons Learned — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Bake TaxKlaro QA forward loop lessons into brainstorm-ralph skill and stage templates so future loops don't converge prematurely.

**Architecture:** The forward loop PROMPT.md is trivial and stays untouched. All fixes go into the brainstorm-ralph skill (which generates stages) and the current-stage.md template (which shows what verification stages look like).

**Tech Stack:** Markdown skill files, loop templates

---

### Task 1: Add Forward Loop Stage Categories to brainstorm-ralph

**Files:**
- Modify: `~/.claude/skills/brainstorm-ralph/SKILL.md:147-185`

**Step 1: Add a new section after "Forward Loop PROMPT.md: Priority System Design" (line 176)**

Insert a new `### Forward Loop Stage Categories` section at line 178 (before `## Key Principles`):

```markdown
### Forward Loop Stage Categories

Every forward loop brainstorm MUST produce stages in these categories. The categories are ordered — later categories depend on earlier ones completing.

| Category | What It Covers | Stage Count Guidance |
|----------|---------------|---------------------|
| Scaffold | Project skeleton, types, build passing | 1-3 stages |
| Implement | One feature/route/component per stage, max 3 files per stage | 40-80% of total stages |
| Desktop Verify | Playwright navigates each route at 1280x800, asserts real content (not stubs) | 1 stage per route |
| Mobile Verify | Playwright navigates each route at 375x812, asserts no overflow, touch targets | 1 stage per route |
| Flow QA | End-to-end user journeys: auth flow, primary CRUD flow, cross-entity flow | 1 stage per flow |
| Discovery | Open-ended hunt for gaps: orphaned components, schema mismatches, dead routes | 2-3 stages |
| Convergence Gate | Final stage: build passes, tests pass, every route verified in browser | 1 stage |

**Stage count targets:**
- Full-stack app (frontend + backend + DB): **80-150 stages**
- Frontend-only (UI polish, restyling): **30-50 stages**
- Engine/library (no UI): **20-40 stages**

If the brainstorm produces fewer than these targets, the stages are too compressed. Apply the enumeration rule.
```

**Step 2: Verify the edit reads correctly in context**

Read: `~/.claude/skills/brainstorm-ralph/SKILL.md` lines 147-210

**Step 3: Commit**

```bash
git add ~/.claude/skills/brainstorm-ralph/SKILL.md
git commit -m "skill(brainstorm-ralph): add forward loop stage categories with count targets"
```

---

### Task 2: Add Enumeration Rule to brainstorm-ralph

**Files:**
- Modify: `~/.claude/skills/brainstorm-ralph/SKILL.md:178-185` (Key Principles section, now shifted down)

**Step 1: Add three new principles to the Key Principles section**

Append these bullets to the existing Key Principles list:

```markdown
- **Enumerate, don't compress**: Every file = its own stage, max 3 files per stage. "Implement all wizard steps" is wrong — "Implement wizard step 1 (income type selection)" is right. If a component has 5 sub-components, that's 2-3 stages, not 1.
- **Verification is not optional**: Every forward loop with a UI gets Desktop Verify + Mobile Verify + Flow QA stages. No exceptions. A loop that converges without browser verification has NOT converged — it has stalled.
- **Discovery stages find what brainstorms miss**: The last 2-3 stages before the convergence gate are open-ended discovery. The agent reads the router, greps for all DB queries, checks for orphaned components, and adds new stages if gaps are found. Discovery stages can extend the stage list.
```

**Step 2: Commit**

```bash
git add ~/.claude/skills/brainstorm-ralph/SKILL.md
git commit -m "skill(brainstorm-ralph): add enumeration, verification, and discovery principles"
```

---

### Task 3: Add Schema Verification Guidance to brainstorm-ralph

**Files:**
- Modify: `~/.claude/skills/brainstorm-ralph/SKILL.md` (new section after Forward Loop Stage Categories)

**Step 1: Add a "### Forward Loop: Database-Backed Apps" section after Stage Categories**

```markdown
### Forward Loop: Database-Backed Apps

When the app connects to a database (Supabase, Postgres, etc.), the brainstorm MUST include:

1. **A schema verification stage** early in the implement category — the agent reads the actual DB schema (via CLI, migration files, or dashboard) and verifies every query's column names match. This catches the #1 source of runtime errors: column name mismatches between code and schema (`name` vs `full_name`, `profiles` vs `user_profiles`).

2. **A Supabase/DB query audit stage** in the discovery category — grep all `.from('` or equivalent query calls, cross-reference against the schema, and fix mismatches.

These are non-negotiable for any app with a database. The TaxKlaro forward loop converged with every client query broken because `name` didn't exist (the column was `full_name`). Tests passed because they mocked the DB layer.
```

**Step 2: Commit**

```bash
git add ~/.claude/skills/brainstorm-ralph/SKILL.md
git commit -m "skill(brainstorm-ralph): add database-backed app verification guidance"
```

---

### Task 4: Add Convergence Gate Definition to brainstorm-ralph

**Files:**
- Modify: `~/.claude/skills/brainstorm-ralph/SKILL.md` (update the Forward Loops section intro, around line 147-154)

**Step 1: Replace the current Forward Loops intro paragraph (lines 148-154)**

Replace:
```markdown
The skill primarily scaffolds reverse loops, but the same brainstorming process applies to **forward** loops (stage-based implementation pipelines like `inheritance-ui-forward`, `inheritance-frontend-forward`).

Forward loops differ from reverse loops:
- **Stages instead of aspects**: Work is organized into ordered stages with dependencies, not frontier aspects
- **Priority system instead of waves**: Each iteration reads a frontier file to determine what to do (install, build, fix, polish, done)
- **Registry type**: `type: forward` (excluded from automatic CI schedule — forward loops run locally or via manual dispatch)
```

With:
```markdown
The skill primarily scaffolds reverse loops, but the same brainstorming process applies to **forward** loops (stage-based implementation pipelines like `inheritance-ui-forward`, `inheritance-frontend-forward`).

Forward loops differ from reverse loops:
- **Stages instead of aspects**: Work is organized into ordered stages with dependencies, not frontier aspects
- **Priority system instead of waves**: Each iteration reads a frontier file to determine what to do (install, build, fix, polish, done)
- **Registry type**: `type: forward` (excluded from automatic CI schedule — forward loops run locally or via manual dispatch)

**Convergence definition for forward loops**: A forward loop has NOT converged until:
1. Build passes with zero errors
2. All tests pass
3. Every user-facing route has been navigated by Playwright and shows real content (not stubs, not placeholder divs, not empty states when data exists)
4. At least one end-to-end user flow has been verified in the browser (sign up/in -> primary action -> see result)
5. Discovery stages have run and found no new gaps

"Tests pass" is necessary but NOT sufficient. The TaxKlaro forward loop had 100% test pass rate while every route rendered placeholder divs and every DB query used wrong column names.
```

**Step 2: Commit**

```bash
git add ~/.claude/skills/brainstorm-ralph/SKILL.md
git commit -m "skill(brainstorm-ralph): add convergence gate definition for forward loops"
```

---

### Task 5: Update current-stage.md.example with verification stage example

**Files:**
- Modify: `loops/_template/frontier/current-stage.md.example`

**Step 1: Rewrite the template to show both implementation and verification stage patterns**

Replace entire file with:

```markdown
# Current Stage: 0 (Scaffold + Types)

## Spec Files for This Stage
- `final-mega-spec/engine/data-model.md`
- `final-mega-spec/deployment/infrastructure.md`

## Test Results
(Not yet run -- scaffold stage)

## Work Log
(Empty -- loop hasn't started yet)

## Spec Gaps Found
(None yet -- if the spec is missing something, note it here)

## Browser Verification
(Not applicable until verification stages)

## Schema Mismatches
(Not applicable until DB-connected stages. When wiring to a database, record any column name mismatches found here: `code uses X, schema has Y`)

---

<!-- Example: what a verification stage looks like when the loop reaches it -->
<!-- Delete this comment block before using the template -->
<!--
# Current Stage: 24 (Desktop Verify - Dashboard)

## Route to Verify
- URL: `/dashboard`
- Viewport: 1280x800
- Auth required: yes

## Verification Checklist
- [ ] Navigate to route with Playwright
- [ ] Page renders without console errors
- [ ] Real content visible (not placeholder text, not empty state when data exists)
- [ ] All interactive elements clickable
- [ ] Screenshot saved to `screenshots/desktop-dashboard.png`

## Browser Verification
Pass/Fail: (pending)
Screenshot: (pending)
Console errors: (pending)

## Work Log
(Empty -- loop hasn't started yet)
-->
```

**Step 2: Commit**

```bash
git add loops/_template/frontier/current-stage.md.example
git commit -m "template: add verification stage example to current-stage.md"
```

---

### Task 6: Final review — read all modified files end to end

**Step 1: Read the full brainstorm-ralph SKILL.md**

Read: `~/.claude/skills/brainstorm-ralph/SKILL.md`

Verify:
- Stage categories table is present and readable
- Stage count targets are present (80-150, 30-50, 20-40)
- Enumeration rule is in Key Principles
- Verification rule is in Key Principles
- Discovery rule is in Key Principles
- Database-backed apps section is present
- Convergence gate definition is present
- No duplicate sections, no orphaned text

**Step 2: Read the current-stage.md.example**

Read: `loops/_template/frontier/current-stage.md.example`

Verify:
- Both implementation and verification stage patterns shown
- Browser Verification section present
- Schema Mismatches section present

**Step 3: Verify PROMPT-forward.md.example was NOT modified**

Read: `loops/_template/PROMPT-forward.md.example`

Confirm it's unchanged from the original.
