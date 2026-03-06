# PodPlay Ops Wizard — Infrastructure & Deployment

Complete specification for deploying the PodPlay Ops Wizard to Fly.io with Supabase Cloud.
All config values, environment variables, file contents, and CLI commands are fully enumerated.

---

## Architecture Overview

```
User browser
    │
    ▼
Fly.io (nginx serving static files)
    │  HTTPS (Fly TLS termination)
    ▼
Supabase Cloud (Postgres + Auth + Realtime)
```

- **Frontend**: React 19 + Vite static build, served by nginx on Fly.io
- **Backend**: Supabase Cloud (no custom server; all logic is client-side service functions)
- **Auth**: Supabase Auth with email/password + magic link; PKCE flow; callback at `/auth/callback`
- **Database**: Supabase Postgres with RLS; migrations applied via Supabase CLI
- **Single-user system**: One authenticated user (Chad/ops person); no multi-tenant isolation needed in v1

---

## Repository File Layout (Deployment Artifacts)

```
podplay-ops-wizard/           # React app root
├── Dockerfile
├── fly.toml
├── nginx.conf
├── .env.example
├── .env.local                # NOT committed — local dev only
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── index.html
└── src/
    └── ...                   # App source (see ui-spec/)

supabase/                     # Supabase CLI project
├── config.toml
├── migrations/
│   └── 20260306000000_initial.sql   # Full schema migration (see data-model/migration.sql)
└── seed.sql                  # Seed data (see data-model/seed-data.md)
```

---

## Supabase Cloud Setup

### 1. Create Project

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Create project via dashboard at https://supabase.com/dashboard
# Region: us-east-1 (closest to PodPlay NJ office)
# Plan: Free tier sufficient for single-user ops tool
# Project name: podplay-ops-wizard
# Database password: generate strong password, store in 1Password
```

### 2. Project Settings to Collect

After project creation, collect these values from the Supabase dashboard:

| Setting | Location in Dashboard | Used As |
|---------|----------------------|---------|
| Project URL | Settings → API → Project URL | `VITE_SUPABASE_URL` |
| Anon public key | Settings → API → Project API keys → anon | `VITE_SUPABASE_ANON_KEY` |
| Service role key | Settings → API → Project API keys → service_role | `SUPABASE_SERVICE_ROLE_KEY` (CLI only, never in browser) |
| Database connection string | Settings → Database → Connection string → URI | Local migrations only |
| Project reference | Settings → General → Reference ID | `SUPABASE_PROJECT_ID` |

### 3. Auth Configuration

In Supabase dashboard → Authentication → Settings:

```
Site URL:                 https://podplay-ops-wizard.fly.dev
Redirect URLs (allowed):  https://podplay-ops-wizard.fly.dev/auth/callback
                          http://localhost:5173/auth/callback      ← local dev
Email auth:               Enabled
Password minimum length:  8
Magic link:               Enabled
Auto confirm users:       Disabled (manual confirmation required)
Session expiry:           604800 (7 days)
JWT expiry:               3600 (1 hour)
```

**Email templates** (Auth → Email Templates):

*Magic Link subject*: `Sign in to PodPlay Ops`
*Magic Link body*: default Supabase template (no customization needed)

### 4. Run Migrations

```bash
# Link CLI to Supabase project
supabase link --project-ref <SUPABASE_PROJECT_ID>

# Apply migration (creates all tables, enums, indexes, RLS)
supabase db push

# Seed initial data (hardware catalog, BOM templates, checklist templates, settings)
supabase db reset --db-url <CONNECTION_STRING>   # dev only
# OR for production:
psql <CONNECTION_STRING> < supabase/seed.sql
```

### 5. Create Initial User

```bash
# Via Supabase dashboard → Authentication → Users → Add user
# Email: chad@podplay.com  (or ops team email)
# Password: set strong password, store in 1Password
# Auto confirm: Yes (check the box)
```

---

## Environment Variables

### `.env.example` (committed to repo)

```bash
# Supabase connection
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# App config
VITE_APP_NAME=PodPlay Ops Wizard
VITE_APP_ENV=production
```

### `.env.local` (developer machine only, NOT committed)

```bash
VITE_SUPABASE_URL=https://abcdefghijklmn.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3...
VITE_APP_NAME=PodPlay Ops Wizard
VITE_APP_ENV=development
```

### Fly.io Secrets (never in `.env`, set via CLI)

```bash
flyctl secrets set \
  VITE_SUPABASE_URL="https://abcdefghijklmn.supabase.co" \
  VITE_SUPABASE_ANON_KEY="eyJhbGci..."
```

> The `VITE_` prefix is required by Vite to expose variables to the browser bundle.
> These are injected at **build time** (not runtime), so they must be set before `flyctl deploy`.
> Fly.io build args inject them: see `[build.args]` in `fly.toml`.

---

## `vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    TanStackRouterVite(),
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-tanstack': ['@tanstack/react-router', '@tanstack/react-query'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-select', '@radix-ui/react-tabs'],
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true,
  },
})
```

---

## `Dockerfile`

Multi-stage build: Node.js build stage → nginx serve stage.

```dockerfile
# ============================================================
# Stage 1: Build
# ============================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci --frozen-lockfile

# Copy source
COPY . .

# Inject Supabase env at build time (passed as --build-arg from fly.toml)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_APP_NAME="PodPlay Ops Wizard"
ARG VITE_APP_ENV="production"

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_APP_ENV=$VITE_APP_ENV

# Build React app
RUN npm run build

# ============================================================
# Stage 2: Serve with nginx
# ============================================================
FROM nginx:1.27-alpine AS production

# Remove default nginx content
RUN rm -rf /usr/share/nginx/html/*

# Copy static build output
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# nginx runs on port 8080 (non-root friendly on Fly.io)
EXPOSE 8080

# Health check: GET /health → 200
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:8080/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

---

## `nginx.conf`

SPA routing (all non-asset paths → `index.html`), gzip compression, security headers.

```nginx
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /tmp/nginx.pid;

events {
  worker_connections 1024;
}

http {
  include       /etc/nginx/mime.types;
  default_type  application/octet-stream;

  # Temp paths writable by non-root user
  client_body_temp_path /tmp/client_temp;
  proxy_temp_path       /tmp/proxy_temp_path;
  fastcgi_temp_path     /tmp/fastcgi_temp;
  uwsgi_temp_path       /tmp/uwsgi_temp;
  scgi_temp_path        /tmp/scgi_temp;

  log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                  '$status $body_bytes_sent "$http_referer" '
                  '"$http_user_agent"';
  access_log /var/log/nginx/access.log main;

  sendfile on;
  tcp_nopush on;
  tcp_nodelay on;
  keepalive_timeout 65;

  # Gzip compression
  gzip on;
  gzip_vary on;
  gzip_min_length 1024;
  gzip_proxied any;
  gzip_comp_level 6;
  gzip_types
    text/plain
    text/css
    text/javascript
    application/javascript
    application/json
    application/xml
    image/svg+xml
    font/woff2;

  server {
    listen 8080;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' https://*.supabase.co wss://*.supabase.co; font-src 'self' data:;" always;

    # Health check endpoint (no HTML — returns 200 with plain text)
    location = /health {
      access_log off;
      add_header Content-Type text/plain;
      return 200 'ok';
    }

    # Static assets — long cache (content-hashed filenames from Vite build)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp)$ {
      expires 1y;
      add_header Cache-Control "public, immutable";
      try_files $uri =404;
    }

    # index.html — no cache (must always revalidate to pick up new deploys)
    location = /index.html {
      expires -1;
      add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # SPA catch-all — all routes serve index.html
    location / {
      try_files $uri $uri/ /index.html;
    }
  }
}
```

---

## `fly.toml`

```toml
# fly.toml — PodPlay Ops Wizard
# App name: podplay-ops-wizard
# Region: ewr (Newark, NJ — closest to PodPlay office)

app = "podplay-ops-wizard"
primary_region = "ewr"

[build]
  # Pass Fly secrets as build-time args so Vite can inject them
  [build.args]
    VITE_SUPABASE_URL     = ""   # overridden by flyctl secrets
    VITE_SUPABASE_ANON_KEY = ""  # overridden by flyctl secrets
    VITE_APP_ENV          = "production"
    VITE_APP_NAME         = "PodPlay Ops Wizard"

[http_service]
  internal_port = 8080
  force_https   = true
  auto_stop_machines  = true
  auto_start_machines = true
  min_machines_running = 0

  [http_service.concurrency]
    type       = "requests"
    hard_limit = 200
    soft_limit = 150

[[vm]]
  size   = "shared-cpu-1x"
  memory = "256mb"

[checks]
  [checks.health]
    grace_period = "10s"
    interval     = "30s"
    method       = "GET"
    path         = "/health"
    port         = 8080
    timeout      = "5s"
    type         = "http"
```

> **Note on build args and secrets**: Fly.io passes secrets into the build context when `[build.args]` keys are declared. The values in `fly.toml` are intentionally empty strings — actual values come from `flyctl secrets set` and override them at build time.

---

## `package.json` (key fields)

```json
{
  "name": "podplay-ops-wizard",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "typecheck": "tsc -b --noEmit",
    "lint": "eslint src --ext .ts,.tsx --report-unused-disable-directives --max-warnings 0"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.9.0",
    "@radix-ui/react-alert-dialog": "^1.1.1",
    "@radix-ui/react-checkbox": "^1.1.1",
    "@radix-ui/react-dialog": "^1.1.1",
    "@radix-ui/react-dropdown-menu": "^2.1.1",
    "@radix-ui/react-label": "^2.1.0",
    "@radix-ui/react-popover": "^1.1.1",
    "@radix-ui/react-radio-group": "^1.2.0",
    "@radix-ui/react-select": "^2.1.1",
    "@radix-ui/react-separator": "^1.1.0",
    "@radix-ui/react-sheet": "^1.1.1",
    "@radix-ui/react-slot": "^1.1.0",
    "@radix-ui/react-switch": "^1.1.0",
    "@radix-ui/react-tabs": "^1.1.0",
    "@radix-ui/react-toast": "^1.2.1",
    "@radix-ui/react-tooltip": "^1.1.2",
    "@supabase/supabase-js": "^2.45.0",
    "@tanstack/react-query": "^5.56.0",
    "@tanstack/react-router": "^1.58.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "date-fns": "^3.6.0",
    "lucide-react": "^0.446.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-hook-form": "^7.53.0",
    "recharts": "^2.12.7",
    "tailwind-merge": "^2.5.2",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@tanstack/router-plugin": "^1.58.0",
    "@tanstack/react-query-devtools": "^5.56.0",
    "@tanstack/router-devtools": "^1.58.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.20",
    "eslint": "^9.11.1",
    "eslint-plugin-react-hooks": "^5.1.0-rc.0",
    "postcss": "^8.4.47",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.5.3",
    "vite": "^5.4.8"
  }
}
```

---

## `tsconfig.json`

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

## `tsconfig.app.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

## `tsconfig.node.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "noEmit": true
  },
  "include": ["vite.config.ts"]
}
```

---

## `src/lib/supabase.ts` — Supabase Client

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check .env.local')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'podplay-ops-auth',
  },
})
```

---

## Supabase CLI Config — `supabase/config.toml`

```toml
project_id = "podplay-ops-wizard"

[api]
enabled = true
port = 54321
schemas = ["public", "graphql_public"]
extra_search_path = ["public", "extensions"]
max_rows = 1000

[db]
port = 54322
shadow_port = 54320
major_version = 15

[studio]
enabled = true
port = 54323
api_url = "http://127.0.0.1"

[inbucket]
enabled = true
port = 54324
smtp_port = 54325
pop3_port = 54326

[storage]
enabled = true
file_size_limit = "50MiB"

[auth]
enabled = true
port = 54321
site_url = "http://localhost:5173"
additional_redirect_urls = ["http://localhost:5173/auth/callback"]
jwt_expiry = 3600
enable_refresh_token_rotation = true
refresh_token_reuse_interval = 10
enable_signup = true
enable_anonymous_sign_ins = false

[auth.email]
enable_signup = true
double_confirm_changes = false
enable_confirmations = false   # local dev: disable email confirmation

[auth.sms]
enable_signup = false
```

---

## Fly.io Deployment Commands

### First Deploy

```bash
# 1. Install flyctl
curl -L https://fly.io/install.sh | sh

# 2. Authenticate
flyctl auth login

# 3. Create the app (first time only)
flyctl apps create podplay-ops-wizard --org personal

# 4. Set secrets (injected as build args at deploy time)
flyctl secrets set \
  VITE_SUPABASE_URL="https://abcdefghijklmn.supabase.co" \
  VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  --app podplay-ops-wizard

# 5. Deploy
flyctl deploy --app podplay-ops-wizard

# 6. Open in browser
flyctl open --app podplay-ops-wizard
```

### Subsequent Deploys

```bash
# From repo root after any code change:
flyctl deploy --app podplay-ops-wizard

# Check deploy status
flyctl status --app podplay-ops-wizard

# View logs
flyctl logs --app podplay-ops-wizard
```

### Rollback

```bash
# List recent releases
flyctl releases --app podplay-ops-wizard

# Rollback to previous release
flyctl deploy --image registry.fly.io/podplay-ops-wizard:<previous-version>
```

---

## Local Development Setup

```bash
# 1. Clone repo
git clone <repo-url>
cd podplay-ops-wizard

# 2. Install dependencies
npm install

# 3. Create local env file
cp .env.example .env.local
# Edit .env.local with actual Supabase URL and anon key

# 4. Start Supabase locally (optional — can use cloud project directly)
supabase start

# 5. Apply migrations locally
supabase db push

# 6. Seed local database
psql $(supabase db url) < supabase/seed.sql

# 7. Start dev server
npm run dev
# → http://localhost:5173
```

---

## Supabase RLS Policy Summary

All tables use RLS. Single-user v1 uses a simple authenticated-user policy:

```sql
-- Pattern applied to all tables (example: projects)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can do everything"
  ON projects FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

This permits any authenticated Supabase user to read/write all rows.
Future multi-tenant version would replace `USING (true)` with `USING (org_id = auth.jwt() ->> 'org_id')`.

**Tables with RLS enabled** (all 15 tables from schema.md):
1. `projects`
2. `project_bom_items`
3. `hardware_catalog`
4. `bom_templates`
5. `inventory`
6. `inventory_movements`
7. `purchase_orders`
8. `purchase_order_items`
9. `deployment_checklist_items`
10. `checklist_templates`
11. `invoices`
12. `expenses`
13. `monthly_opex_snapshots`
14. `settings`
15. `team_contacts`
16. `replay_signs`
17. `cc_terminals`
18. `troubleshooting_entries`

**Tables without RLS** (read-only seed tables, no user writes):
- None — all tables have RLS enabled even if the policy is permissive.

---

## Domain / TLS

- **Primary URL**: `https://podplay-ops-wizard.fly.dev` (auto-provisioned by Fly.io)
- **TLS**: Fly.io auto-provisions Let's Encrypt cert; no manual configuration
- **Custom domain** (optional, future): Point `ops.podplay.com` CNAME to `podplay-ops-wizard.fly.dev`, then run `flyctl certs add ops.podplay.com`

---

## Supabase Auth Callback Flow

1. User clicks "Sign in with magic link" on `/login` page
2. Supabase sends email with link: `https://podplay-ops-wizard.fly.dev/auth/callback?code=...`
3. Browser navigates to `/auth/callback`
4. `auth/callback.tsx` route calls `supabase.auth.exchangeCodeForSession(code)`
5. Session stored in localStorage under key `podplay-ops-auth`
6. Router redirects to `/projects`

**`src/routes/auth/callback.tsx`**:
```typescript
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export const Route = createFileRoute('/auth/callback')({
  component: AuthCallback,
})

function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const { searchParams } = new URL(window.location.href)
    const code = searchParams.get('code')
    if (!code) {
      navigate({ to: '/login' })
      return
    }
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) navigate({ to: '/login' })
      else navigate({ to: '/projects' })
    })
  }, [navigate])

  return (
    <div className="flex h-screen items-center justify-center">
      <p className="text-muted-foreground">Signing you in…</p>
    </div>
  )
}
```

---

## `src/routes/login.tsx`

```typescript
import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'

export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) throw redirect({ to: '/projects' })
  },
  component: LoginPage,
})

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)

  async function handleEmailPassword(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      toast({ title: 'Sign in failed', description: error.message, variant: 'destructive' })
    }
    // On success, onAuthStateChange in __root.tsx fires → router redirect to /projects
  }

  async function handleMagicLink() {
    if (!email) {
      toast({ title: 'Enter your email first', variant: 'destructive' })
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    setLoading(false)
    if (error) {
      toast({ title: 'Failed to send magic link', description: error.message, variant: 'destructive' })
    } else {
      setMagicLinkSent(true)
    }
  }

  if (magicLinkSent) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="max-w-sm text-center space-y-2">
          <h1 className="text-xl font-semibold">Check your email</h1>
          <p className="text-muted-foreground">Magic link sent to {email}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold">PodPlay Ops</h1>
          <p className="text-sm text-muted-foreground">Sign in to continue</p>
        </div>
        <form onSubmit={handleEmailPassword} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="chad@podplay.com"
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
        <div className="relative">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or</span>
          </div>
        </div>
        <Button variant="outline" className="w-full" onClick={handleMagicLink} disabled={loading}>
          Send magic link
        </Button>
      </div>
    </div>
  )
}
```

---

## CI/CD (Optional — GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Fly.io

on:
  push:
    branches: [main]

jobs:
  deploy:
    name: Deploy
    runs-on: ubuntu-latest
    concurrency: deploy-group

    steps:
      - uses: actions/checkout@v4

      - uses: superfly/flyctl-actions/setup-flyctl@master

      - name: Deploy to Fly.io
        run: flyctl deploy --remote-only
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

**Required GitHub secrets**:
- `FLY_API_TOKEN`: generate with `flyctl tokens create deploy -x 999999h`

Supabase connection env vars are already stored as Fly secrets and do not need to be in GitHub secrets — they are read by the Fly build environment automatically.

---

## Machine Sizing Rationale

| Spec | Value | Reason |
|------|-------|--------|
| CPU | shared-cpu-1x | Static file serving; nginx is trivially light |
| Memory | 256mb | nginx uses ~20MB; 256MB is headroom for health checks and worker processes |
| Instances | 0 min (auto-stop) | Single internal user; auto-stop saves cost when not in use |
| Region | ewr (Newark) | PodPlay office is in NJ; lowest latency |

Auto-stop means the machine stops after ~5 minutes of inactivity and cold-starts on next request (~1–2 seconds). Acceptable for internal tool. To eliminate cold starts, set `min_machines_running = 1` in `fly.toml`.

---

## Supabase Tier Rationale

| Concern | Decision |
|---------|----------|
| Plan | Free tier (Pro is $25/month — not needed for single-user tool) |
| Database size | Free tier gives 500MB; MRP data is <10MB |
| Auth users | Free tier: unlimited auth users (1 needed) |
| API calls | Free tier: 500K requests/month; well within single-user usage |
| Backups | Free tier: daily backups, 7-day retention |

Upgrade to Pro tier if: concurrent API calls from future multi-user access exceed free tier limits, or if project data grows beyond 500MB.

---

## Upgrade Path: Multi-Tenant

When PodPlay wants to support multiple ops staff or orgs:

1. Add `org_id UUID NOT NULL REFERENCES orgs(id)` to all tables
2. Add `org_id` claim to JWT via Supabase Edge Function (auth hook)
3. Replace RLS `USING (true)` with `USING (org_id = (auth.jwt() ->> 'org_id')::uuid)`
4. Add org selector on login page
5. Fly.io machine count stays at 1 (still single-tenant for Fly; all data isolation is at DB level)
