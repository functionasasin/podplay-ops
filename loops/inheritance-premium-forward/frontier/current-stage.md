# Current Stage: 2 (TanStack Router + Layout)

## Spec Sections
- No specific spec section — infrastructure stage
- Install TanStack Router, create route tree, restructure App.tsx with layout

## Test Results (updated by loop)
```
14 tests passing (router.test.tsx)
- root layout: sidebar nav links, branding
- index route: dashboard page, sign-in prompt
- /cases/new: wizard container
- /auth: sign-in card
- /share/:token: shared case, no auth required
- /cases/:caseId: case editor with ID
- /clients, /deadlines, /settings: placeholder pages
- layout structure: 5 nav items, correct paths
```

## Work Log
- Stage 1 completed 2026-03-02 (7/7 tests passing)
- Stage 2 setup completed 2026-03-02: installed @tanstack/react-router + devtools, created route tree (9 routes), AppLayout with sidebar, moved wizard to /cases/new
- Stage 2 tests written 2026-03-02: 14 router + layout tests (all passing)
