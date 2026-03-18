# PodPlay Ops

Internal operations dashboard for managing PodPlay venue installations end-to-end — from customer intake through procurement, deployment, and financial close.

## What it does

PodPlay Ops tracks every installation project through a multi-stage wizard workflow:

- **Intake** — Customer info, venue config, service tier, ISP, installer selection
- **Procurement** — BOM generation, inventory check, purchase orders, packing lists
- **Deployment** — 16-phase checklist covering network rack, cameras, replay service, Apple devices, and physical install
- **Financials** — Invoicing, expenses, cost analysis, P&L, go-live, recurring fees

Plus cross-project dashboards for inventory management, revenue pipeline, cost analysis, and HER (Hardware Efficiency Ratio) tracking.

## Tech stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Routing:** TanStack Router (file-based)
- **Backend:** Supabase (Postgres + Auth + RLS)
- **Hosting:** Fly.io (Docker + Nginx)

## Development

```bash
npm install
npm run dev
```

Requires a Supabase project. Set these env vars (or use `.env.local`):

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Local Supabase

```bash
npx supabase start
npx supabase db reset   # runs all migrations + seeds
```

### Tests

```bash
npm test
```

## Deploy

```bash
fly deploy
```

Build args for Supabase credentials are configured in `fly.toml`.
