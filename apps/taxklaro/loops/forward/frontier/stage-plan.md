# Stage Plan — TaxKlaro Full-Stack Build

| Stage | Name | Spec Sections | Depends On | Status |
|-------|------|---------------|------------|--------|
| 1 | Engine Scaffold | §3.1, §3.2 | — | pending |
| 2 | Engine Types + Rates | §3.3, §3.4 | 1 | blocked |
| 3 | Engine Pipeline | §3.5, §3.6, §3.7 | 2 | blocked |
| 4 | Engine WASM Build | §3.8 | 3 | blocked |
| 5 | Frontend Scaffold + WASM Bridge | §2, §4, §7.1 | 4 | blocked |
| 6 | TypeScript Types | §5 | 5 | blocked |
| 7 | Zod Schemas | §6 | 6 | blocked |
| 8 | Design System | §8.1, §8.2, §8.3 | 5 | blocked |
| 9 | Wizard State + Step Routing | §7.2, §7.3, §7.4 | 6, 7 | blocked |
| 10 | Wizard Steps WS-01 → WS-09 | §7.7 | 8, 9 | blocked |
| 11 | Wizard Steps WS-10 → WS-17 | §7.7 | 10 | blocked |
| 12 | Results View + Compute | §7.4, §14 (results) | 9 | blocked |
| 13 | Supabase + Migrations | §10 | 5 | blocked |
| 14 | Auth | §9 | 13 | blocked |
| 15 | Routes + Navigation | §11, §12 | 8, 14 | blocked |
| 16 | Org Model + Computations CRUD | §13, §7.5 | 14 | blocked |
| 17 | Sharing + Auto-save | §7.6, §7.4 | 16 | blocked |
| 18 | Component Wiring | §14 | 10-17 | blocked |
| 19 | Empty States + Toasts + Loading | §8.4, §8.5 | 18 | blocked |
| 20 | Monitoring | §17 | 5 | blocked |
| 21 | Deployment Config | §16.1–§16.4 | 4 | blocked |
| 22 | CI/CD Workflows | §16.5, §16.6 | 21 | blocked |
| 23 | Unit Tests (full suite) | §15.1 | 18 | blocked |
| 24 | E2E Tests | §15.2 | 18 | blocked |
| 25 | Integration Sweep | — | all | blocked |
