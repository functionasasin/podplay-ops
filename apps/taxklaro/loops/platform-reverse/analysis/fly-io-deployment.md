# Fly.io Deployment — TaxKlaro

## Overview

TaxKlaro deploys as a static SPA via Docker on Fly.io. The frontend is a pure client-side React + WASM app served by nginx. VITE_* env vars are baked at Docker build time as build args (not runtime env vars — they are embedded in the JS bundle).

**Reference**: `apps/inheritance/frontend/Dockerfile` + `fly.toml`

---

## Dockerfile

Multi-stage build: Node 20 (build) → nginx:alpine (serve).

```dockerfile
# syntax=docker/dockerfile:1

# ---- Build stage ----
FROM node:20-alpine AS build

WORKDIR /app

# Declare build-time env vars (baked into JS bundle by Vite)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_APP_URL
ARG VITE_SENTRY_DSN

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_APP_URL=$VITE_APP_URL
ENV VITE_SENTRY_DSN=$VITE_SENTRY_DSN

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source (includes pre-built WASM pkg/ from engine)
COPY . .

# Build production bundle
RUN npm run build
# npm run build = tsc -b && vite build
# Outputs: dist/ directory

# ---- Serve stage ----
FROM nginx:alpine

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
```

## nginx.conf

Required for TanStack Router client-side routing — all unknown paths must return `index.html`.

```nginx
server {
    listen 8080;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # SPA routing: serve index.html for all non-file routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets aggressively
    location ~* \.(js|css|wasm|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # WASM MIME type (required for WASM streaming compilation)
    types {
        application/wasm wasm;
    }

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/javascript application/wasm;
    gzip_min_length 1024;
}
```

**Critical**: The `application/wasm wasm` MIME type declaration is required. Without it, browsers will refuse to perform streaming WASM compilation (they get `application/octet-stream` which blocks instantiateStreaming).

---

## fly.toml

```toml
app = "taxklaro"
primary_region = "sin"

[build]
  # Build args passed via: fly deploy --build-arg VITE_SUPABASE_URL=...
  # Or set as Fly.io secrets and passed at deploy time

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = "stop"
  auto_start_machines = true
  min_machines_running = 0
  processes = ["app"]

[[vm]]
  memory = "512mb"
  cpu_kind = "shared"
  cpus = 1
```

**Note on memory**: 512MB is sufficient for a static file server. The inheritance app uses 1GB — that may be from earlier experimentation. 512MB is the correct size for nginx serving static files.

---

## Build Args vs Fly Secrets

VITE_* vars are build args, not runtime secrets. They are embedded in the JavaScript bundle at build time by Vite. This is intentional — they are public (ANON key is safe to expose; it has RLS protecting the database).

### Setting Build Args in Fly.io

Option 1 — Pass at deploy time:
```sh
fly deploy \
  --build-arg VITE_SUPABASE_URL=https://xxxx.supabase.co \
  --build-arg VITE_SUPABASE_ANON_KEY=eyJ... \
  --build-arg VITE_APP_URL=https://taxklaro.ph
```

Option 2 — Use Fly build secrets (preferred for CI):
```sh
fly secrets set \
  VITE_SUPABASE_URL=https://xxxx.supabase.co \
  VITE_SUPABASE_ANON_KEY=eyJ... \
  VITE_APP_URL=https://taxklaro.ph
```

Then in fly.toml (Fly automatically passes secrets as build args if they start with VITE_):
```toml
[build]
  [build.args]
    VITE_SUPABASE_URL = ""    # overridden by fly secrets
    VITE_SUPABASE_ANON_KEY = ""
    VITE_APP_URL = ""
```

---

## Project Structure Assumption

The Dockerfile expects the WASM package to be pre-built and present at `pkg/` before Docker runs. The forward loop must ensure:

1. Rust engine is compiled to WASM: `wasm-pack build --target web --out-dir ../frontend/pkg`
2. `pkg/` is NOT in `.gitignore` for deployment (or is built in the Docker build stage)

### Option A: Build WASM in Docker (preferred for clean builds)

Add Rust toolchain to the build stage:

```dockerfile
FROM node:20-alpine AS build

# Install Rust + wasm-pack
RUN apk add --no-cache curl build-base && \
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y && \
    source $HOME/.cargo/env && \
    cargo install wasm-pack

WORKDIR /app

# Build Rust engine first
COPY engine/ ./engine/
RUN cd engine && $HOME/.cargo/bin/wasm-pack build --target web --out-dir ../frontend/pkg

# Then build frontend
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_APP_URL
ARG VITE_SENTRY_DSN

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_APP_URL=$VITE_APP_URL
ENV VITE_SENTRY_DSN=$VITE_SENTRY_DSN

COPY frontend/package.json frontend/package-lock.json ./frontend/
RUN cd frontend && npm ci

COPY frontend/ ./frontend/
RUN cd frontend && npm run build
```

### Option B: Commit pre-built pkg/ (simpler, used by inheritance app)

The inheritance app commits the pre-built `pkg/` to the repository. This works but means the WASM binary is in git. For TaxKlaro, use Option A for cleaner CI.

**Decision for forward loop**: Use Option A (build WASM in Docker). The Dockerfile in the spec uses a monorepo layout where `engine/` and `frontend/` are siblings.

---

## Supabase Project Setup

Before first deploy, create the Supabase project:

```sh
# 1. Create project at supabase.com/dashboard
#    Project name: taxklaro
#    Region: Southeast Asia (Singapore)
#    Database password: <strong-password>

# 2. Get credentials from Project Settings > API
#    Project URL: https://xxxx.supabase.co
#    Anon key: eyJ...

# 3. Run migrations
supabase link --project-ref xxxx
supabase db push
# Or: supabase migration up

# 4. Set auth redirect URLs in Supabase Dashboard > Authentication > URL Configuration:
#    Site URL: https://taxklaro.ph
#    Redirect URLs:
#      https://taxklaro.ph/auth/callback
#      https://taxklaro.ph/auth/reset-confirm
#      http://localhost:5173/auth/callback    (for local dev)
#      http://localhost:5173/auth/reset-confirm  (for local dev)
```

---

## Domain Configuration

Domain: `taxklaro.ph` via Cloudflare DNS.

```sh
# Add custom domain to Fly.io app
fly certs add taxklaro.ph
fly certs add www.taxklaro.ph

# Get Fly.io IP
fly ips list

# In Cloudflare DNS:
# A record: taxklaro.ph -> <fly-io-ipv4>
# AAAA record: taxklaro.ph -> <fly-io-ipv6>
# CNAME: www.taxklaro.ph -> taxklaro.ph (or A/AAAA pointing same)
# Proxy: Orange cloud (proxied) - for DDoS protection + caching
```

---

## First Deploy

```sh
# From monorepo root
cd apps/taxklaro

# Authenticate
fly auth login

# Create app (first time only)
fly launch \
  --name taxklaro \
  --region sin \
  --no-deploy

# Set build secrets
fly secrets set \
  VITE_SUPABASE_URL=https://xxxx.supabase.co \
  VITE_SUPABASE_ANON_KEY=eyJ... \
  VITE_APP_URL=https://taxklaro.ph

# Deploy
fly deploy
```

---

## Local Development

```sh
# Start local Supabase
supabase start

# Create .env.local from example
cp .env.local.example .env.local
# Edit: VITE_SUPABASE_URL=http://localhost:54321
#       VITE_SUPABASE_ANON_KEY=<local-anon-key from supabase start output>
#       VITE_APP_URL=http://localhost:5173

# Build WASM (from monorepo root)
cd engine && wasm-pack build --target web --out-dir ../frontend/pkg && cd ..

# Start frontend
cd frontend && npm run dev
```

---

## Repository Structure

```
apps/taxklaro/
├── engine/                   # Rust WASM engine
│   ├── Cargo.toml
│   └── src/
│       ├── lib.rs
│       ├── wasm.rs           # #[wasm_bindgen] exports
│       ├── pipeline.rs       # Computation pipeline
│       ├── types.rs          # All domain types
│       └── ...
├── frontend/                 # React + Vite frontend
│   ├── Dockerfile
│   ├── fly.toml
│   ├── nginx.conf
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── .env.local.example
│   ├── pkg/                  # wasm-pack output (generated, committed or .gitignored)
│   ├── supabase/
│   │   ├── config.toml
│   │   └── migrations/
│   │       ├── 001_initial_schema.sql
│   │       ├── 002_rls_policies.sql
│   │       ├── 003_rpc_functions.sql
│   │       └── 004_storage.sql
│   └── src/
│       ├── main.tsx
│       ├── routes/
│       ├── components/
│       ├── hooks/
│       ├── lib/
│       ├── types/
│       └── wasm/
└── README.md
```

---

## Production Checklist

Before first production deploy:

- [ ] Supabase project created in Singapore region
- [ ] All 4 migration files applied (`supabase db push`)
- [ ] Auth redirect URLs set in Supabase dashboard
- [ ] `fly secrets set` with all 3 VITE_* vars
- [ ] `fly launch` created the app with `sin` region
- [ ] `fly deploy` succeeded
- [ ] `fly open` shows the app loading
- [ ] `fly certs add taxklaro.ph` issued certificate
- [ ] Cloudflare DNS A/AAAA records pointing to Fly.io IPs
- [ ] HTTPS forced (fly.toml `force_https = true`)
- [ ] Auth sign-up flow works end-to-end in production
- [ ] WASM compute works in production (`npm run build` local smoke test first)

---

## Critical Traps

1. **WASM MIME type**: nginx must declare `application/wasm wasm` in `types {}` block. Without it, `WebAssembly.instantiateStreaming` fails with MIME type error and falls back to arraybuffer (slower), or fails entirely in strict browsers.

2. **SPA routing**: nginx MUST have `try_files $uri $uri/ /index.html` or every direct URL visit returns 404. TanStack Router handles all routing client-side.

3. **VITE_* are build args, not runtime**: Changing `VITE_SUPABASE_URL` after build does nothing. Every URL change requires a new Docker build + deploy. Do not use Fly.io runtime secrets expecting them to reach the JS bundle.

4. **WASM build before frontend build**: `pkg/` must exist when `npm run build` runs. If using Option A (Rust in Docker), the Dockerfile stages must be ordered correctly (engine build → frontend build).

5. **auto_stop_machines = "stop"**: The app will cold-start on first request after inactivity. For a static file server, this is instantaneous (nginx starts in <100ms). Fine for production.

6. **min_machines_running = 0**: Zero machines running when idle = zero cost when not in use. Fly.io bills per second. This is correct for a cost-effective SPA deployment.
