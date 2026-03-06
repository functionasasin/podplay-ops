# Analysis: Fly.io Deployment — RA 7641 Retirement Pay Calculator

**Wave:** 6 — Testing + Deployment
**Aspect:** fly-io-deployment
**Date:** 2026-03-06
**Sources:** production-build-verification.md, env-configuration.md, database-migrations.md, supabase-gotchas.md

---

## Overview

The app is a static SPA (Vite-built React) served via Nginx on Fly.io. There is no server-side
Node.js process — the backend is entirely Supabase (managed). The Docker build is multi-stage:

1. **Stage 1 (rust-builder)**: Install Rust + wasm-pack, compile Rust engine to WASM
2. **Stage 2 (frontend-builder)**: Node.js 22, install deps, build Vite app (embeds WASM + env vars)
3. **Stage 3 (nginx)**: Copy `dist/` into Nginx, serve as static files with SPA routing

---

## 1. Dockerfile

**Path:** `apps/retirement-pay/Dockerfile`
(One Dockerfile at the app root, not inside `frontend/` or `engine/`)

```dockerfile
# Stage 1: Build Rust WASM engine
FROM rust:1.82-slim AS rust-builder

WORKDIR /engine

# Install wasm-pack
RUN cargo install wasm-pack

# Install required system deps for wasm-pack
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Add wasm32 target
RUN rustup target add wasm32-unknown-unknown

# Copy Rust source
COPY engine/ .

# Build WASM package
# Output goes to /engine/pkg (matched in Stage 2 COPY)
RUN wasm-pack build --target web --out-dir /engine/pkg

# ---

# Stage 2: Build Vite frontend
FROM node:22-alpine AS frontend-builder

WORKDIR /app

# Copy frontend source
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ .

# Copy the WASM package from Stage 1
# Must match the path referenced in frontend's package.json / import
COPY --from=rust-builder /engine/pkg ./src/wasm/pkg

# Build-time environment variables (injected as Docker build args)
# These are Vite env vars — embedded into the JS bundle at build time
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Generate TanStack Router route tree, typecheck, then build
RUN npm run build

# Verify WASM file is present in dist (fail fast if missing)
RUN ls dist/assets/*.wasm || (echo "ERROR: WASM file missing from dist/assets/" && exit 1)

# ---

# Stage 3: Nginx serving
FROM nginx:1.27-alpine AS production

# Remove default Nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom Nginx config (SPA routing + security headers + WASM content-type)
COPY nginx.conf /etc/nginx/conf.d/app.conf

# Copy built frontend
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# Fly.io expects the app to listen on port 8080 (not 80)
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
```

---

## 2. Nginx Configuration

**Path:** `apps/retirement-pay/nginx.conf`

```nginx
server {
    listen 8080;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # Compression
    gzip on;
    gzip_types
        text/plain
        text/css
        text/javascript
        application/javascript
        application/json
        application/wasm
        image/svg+xml;
    gzip_min_length 1024;

    # Cache static assets (JS, CSS, WASM) — they have content hashes
    location ~* \.(js|css|wasm|ico|png|jpg|svg|woff2?)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header X-Content-Type-Options "nosniff";
    }

    # WASM content type (Nginx default may serve as application/octet-stream)
    location ~* \.wasm$ {
        default_type application/wasm;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing — all non-file requests serve index.html
    location / {
        try_files $uri $uri/ /index.html;

        # Security headers
        add_header X-Frame-Options "DENY" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; connect-src 'self' https://*.supabase.co wss://*.supabase.co; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; frame-ancestors 'none';" always;
    }

    # Do not log health check requests (Fly.io pings /_health every 15s)
    location /_health {
        access_log off;
        return 200 "ok";
        add_header Content-Type text/plain;
    }
}
```

**Critical items:**
- Port **8080** — Fly.io routes external traffic to port 8080 inside the container by default
- `try_files $uri $uri/ /index.html` — Required for SPA routing (direct URL access to `/dashboard`)
- `'wasm-unsafe-eval'` in CSP — Required for WASM compilation in browser
- `application/wasm` content type — Required; browser refuses to instantiate WASM with wrong MIME type
- `/_health` endpoint — Fly.io uses this for health checks (returns 200 immediately from Nginx)

---

## 3. fly.toml

**Path:** `apps/retirement-pay/fly.toml`

```toml
app = "retirement-pay-ph"
primary_region = "sin"  # Singapore — closest to Philippines

[build]
  dockerfile = "Dockerfile"

  [build.args]
    # Values are empty strings here.
    # Real values injected via: fly deploy --build-arg VITE_SUPABASE_URL=... --build-arg VITE_SUPABASE_ANON_KEY=...
    # See CI/CD pipeline for exact command.
    VITE_SUPABASE_URL = ""
    VITE_SUPABASE_ANON_KEY = ""

[[services]]
  internal_port = 8080
  protocol = "tcp"

  [[services.ports]]
    handlers = ["http"]
    port = 80
    force_https = true

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443

  [services.concurrency]
    type = "requests"
    hard_limit = 200
    soft_limit = 150

  [[services.http_checks]]
    interval = "15s"
    timeout = "5s"
    grace_period = "10s"
    method = "GET"
    path = "/_health"
    protocol = "http"

[vm]
  size = "shared-cpu-1x"
  memory = "256mb"

[env]
  # No runtime env vars — this is a static SPA; all config is baked in at build time.
  # Do NOT put VITE_* vars here; Fly.io runtime env vars are not available to Nginx.
```

**Fly.io region selection:**
- `sin` = Singapore — lowest latency to Philippine users
- Alternatively `nrt` (Tokyo) or `syd` (Sydney) if Singapore is unavailable
- Single region sufficient for MVP; Fly.io auto-scales horizontally

---

## 4. Directory Structure for Docker Build Context

The Dockerfile is at `apps/retirement-pay/` and uses paths relative to that root:

```
apps/retirement-pay/
├── Dockerfile              # Multi-stage build
├── fly.toml                # Fly.io configuration
├── nginx.conf              # Nginx SPA + security config
├── engine/                 # Rust source (Cargo.toml, src/)
│   ├── Cargo.toml
│   └── src/
│       └── lib.rs
└── frontend/               # React app
    ├── package.json
    ├── package-lock.json
    ├── vite.config.ts
    ├── tsconfig.json
    ├── tailwind.config.ts
    ├── .env.local.example
    └── src/
        └── wasm/
            └── pkg/        # WASM output (populated by wasm-pack; gitignored)
```

**`.gitignore` entries for the app directory:**
```
apps/retirement-pay/frontend/src/wasm/pkg/
apps/retirement-pay/frontend/dist/
apps/retirement-pay/frontend/node_modules/
apps/retirement-pay/frontend/.env.local
```

The WASM `pkg/` directory is populated by:
- `wasm-pack build` in the Docker Stage 1 (for CI/production builds)
- `npm run build:engine` (for local development)

---

## 5. Fly.io Initial Setup Commands

Run these once to initialize the app (not in CI — done manually by the developer):

```bash
# Install Fly.io CLI (if not installed)
curl -L https://fly.io/install.sh | sh

# Authenticate
fly auth login

# Create the app (registers app name in Fly.io account)
# Run from: apps/retirement-pay/
fly apps create retirement-pay-ph --machines

# Confirm the app was created
fly apps list

# Assign a dedicated IPv4 (optional — shared IPv4 is free, dedicated costs $2/month)
fly ips allocate-v4 --app retirement-pay-ph
fly ips allocate-v6 --app retirement-pay-ph

# Verify IP assignment
fly ips list --app retirement-pay-ph
```

---

## 6. Build-Time Secret Injection

Vite embeds `VITE_*` env vars at build time. Fly.io runtime secrets (`fly secrets set`) are
NOT available during Docker build stages — they are only injected at container startup as
environment variables, but Nginx does not expose those to JavaScript.

**Correct pattern for Vite on Fly.io:**

```bash
# During fly deploy, pass build args explicitly:
fly deploy \
  --app retirement-pay-ph \
  --build-arg VITE_SUPABASE_URL="https://abcdefghijklmnop.supabase.co" \
  --build-arg VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  --remote-only
```

**In GitHub Actions CI/CD**, store these as GitHub repository secrets:
- `FLY_API_TOKEN` — Fly.io deploy token (from `fly tokens create deploy`)
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anon key

The CI/CD pipeline reads these and passes as `--build-arg`. See `ci-cd-pipeline.md` for
the complete GitHub Actions workflow.

**Why not use fly.toml `[build.args]`?**
The `[build.args]` section in `fly.toml` sets default build arg values but cannot reference
Fly.io secrets. The `--build-arg` flag on `fly deploy` overrides these defaults and is the
correct injection mechanism for sensitive build-time values.

**Security note:** `VITE_SUPABASE_ANON_KEY` is safe to embed in the client bundle — it is
the public anonymous key designed for browser exposure. Row Level Security enforces access
control server-side. Never embed the `service_role` key.

---

## 7. Supabase Project Setup

These steps are performed once by the developer before first deployment:

### 7a. Create Supabase Project

```
1. Go to supabase.com/dashboard
2. Click "New project"
3. Organization: create or select existing
4. Name: "retirement-pay-ph" (or any name)
5. Database password: generate strong password, save in password manager
6. Region: Southeast Asia (Singapore) — closest to Philippines
7. Plan: Free tier sufficient for MVP (500MB database, 50MB file storage, 50K auth users/month)
8. Click "Create new project"
9. Wait ~2 minutes for provisioning
```

### 7b. Get API Credentials

```
1. Project Dashboard > Settings (left sidebar gear icon) > API
2. Copy "Project URL" (format: https://<ref>.supabase.co)
3. Copy "anon public" key under "Project API keys"
4. Do NOT copy the "service_role" key — never used in browser code
```

### 7c. Run Database Migrations

```bash
# Install Supabase CLI (if not installed)
brew install supabase/tap/supabase  # macOS
# OR: npm install -g supabase

# Link to your project
cd apps/retirement-pay
supabase link --project-ref <your-project-ref>

# Run migrations
supabase db push

# Verify migrations ran
supabase db diff  # Should show no diff if migrations are current
```

### 7d. Configure Auth Settings

In Supabase Dashboard > Authentication > Settings:

```
Site URL: https://retirement-pay-ph.fly.dev
Redirect URLs (add ALL of these):
  - https://retirement-pay-ph.fly.dev/auth/callback
  - http://localhost:5173/auth/callback       (local dev)
  - http://localhost:3000/auth/callback       (prod build preview)

Email confirmation: ENABLED (require email verification)
Secure email change: ENABLED
```

### 7e. Email Templates (Optional — customize from Supabase defaults)

Supabase provides default email templates for confirmation and password reset. For production:

- Dashboard > Authentication > Email Templates
- Confirm signup subject: "Confirm your RA 7641 Calculator account"
- Reset password subject: "Reset your RA 7641 Calculator password"
- Magic link subject: "Sign in to RA 7641 Calculator"
- Update the "From" display name to "RA 7641 Calculator"

---

## 8. Custom Domain Configuration (Optional)

To use a custom domain (e.g., `retirementpay.ph` or `ph7641.com`) instead of the default
`retirement-pay-ph.fly.dev`:

### 8a. Point DNS to Fly.io

```bash
# Get Fly.io IP addresses
fly ips list --app retirement-pay-ph
# Example output:
#   v4: 137.66.xx.xx
#   v6: fdaa:0:xxxx::xx

# In your DNS registrar (Namecheap, Cloudflare, etc.):
# A record:     retirementpay.ph   → 137.66.xx.xx
# AAAA record:  retirementpay.ph   → fdaa:0:xxxx::xx
```

### 8b. Add Certificate to Fly.io

```bash
fly certs add retirementpay.ph --app retirement-pay-ph
# Fly.io provisions a Let's Encrypt certificate automatically

# Verify certificate status
fly certs show retirementpay.ph --app retirement-pay-ph
# Wait until: Status = Ready
```

### 8c. Update Supabase Auth Redirect URLs

After adding custom domain, add to Supabase Dashboard > Authentication > Settings:
```
https://retirementpay.ph/auth/callback
```

---

## 9. First Deployment (Manual, After Setup)

```bash
# From: apps/retirement-pay/
fly deploy \
  --app retirement-pay-ph \
  --build-arg VITE_SUPABASE_URL="https://your-project-ref.supabase.co" \
  --build-arg VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-key" \
  --remote-only

# Monitor deployment
fly logs --app retirement-pay-ph

# Check app status
fly status --app retirement-pay-ph

# Open in browser (should show landing page)
fly open --app retirement-pay-ph
```

### Deployment Verification Checklist

```
[ ] fly status shows "running" (not "failed" or "pending")
[ ] fly open loads the landing page (no 502 or blank page)
[ ] No JS errors in browser console
[ ] WASM loads: DevTools > Network > filter "wasm" shows 200 status
[ ] Sign up with new account — confirmation email received
[ ] Click confirmation link — redirected to /dashboard
[ ] Create a computation — wizard completes, results display correctly
[ ] PDF export generates non-zero file
[ ] Share link generates and works in incognito window
[ ] fly logs shows no ERROR level messages
```

---

## 10. Rollback Procedure

```bash
# List recent deployments
fly releases list --app retirement-pay-ph

# Rollback to previous release (e.g., v3)
fly deploy --image $(fly releases --app retirement-pay-ph --json | jq -r '.[1].ImageRef')

# OR: set a specific version
fly deploy --image registry.fly.io/retirement-pay-ph:deployment-01JXXXXXXXX
```

---

## 11. Scaling Configuration

Fly.io Machines auto-stop after inactivity (free tier default). For low-traffic MVP:

```bash
# Keep at least 1 machine running (prevents cold starts)
fly scale count 1 --app retirement-pay-ph

# Current config: shared-cpu-1x, 256MB RAM — sufficient for static file serving
# If compute is needed (Node.js SSR), upgrade to:
fly scale vm shared-cpu-2x --memory 512 --app retirement-pay-ph
```

Since this is a static SPA (Nginx serving pre-built files), 256MB RAM is more than sufficient.
Cold starts are ~1-2s for Nginx (vs ~5-10s for a Node.js server).

---

## 12. Environment Variable Reference for Deployment

| Variable | Source | Injected At | Who Reads It |
|----------|--------|-------------|-------------|
| `VITE_SUPABASE_URL` | GitHub secret `VITE_SUPABASE_URL` | Docker build time (`--build-arg`) | Vite bundles into JS |
| `VITE_SUPABASE_ANON_KEY` | GitHub secret `VITE_SUPABASE_ANON_KEY` | Docker build time (`--build-arg`) | Vite bundles into JS |
| `FLY_API_TOKEN` | GitHub secret `FLY_API_TOKEN` | CI environment | `flyctl` auth during deploy |

No runtime environment variables are needed — the app is a static SPA with Nginx.

---

## 13. Common Deployment Failures

| Failure | Symptom | Fix |
|---------|---------|-----|
| WASM missing from dist | App loads, computations error silently | Verify Stage 1 `wasm-pack build` ran; check `COPY --from=rust-builder` path matches |
| Nginx 404 on SPA routes | Direct URL `/dashboard` returns 404 | Verify `try_files $uri $uri/ /index.html` in nginx.conf |
| WASM MIME type wrong | Browser refuses WASM: "incorrect response MIME type" | Add `location ~* \.wasm$ { default_type application/wasm; }` to nginx.conf |
| CSP blocks WASM | Console: "WebAssembly.instantiate(): Wasm code generation disallowed" | Add `'wasm-unsafe-eval'` to `script-src` in CSP header |
| Env vars not embedded | App shows SetupPage in production | Ensure `--build-arg VITE_SUPABASE_URL=...` passed to `fly deploy` |
| Supabase auth redirect fails | After email confirmation, redirect to wrong URL | Add `https://retirement-pay-ph.fly.dev/auth/callback` to Supabase redirect URLs |
| Port mismatch | Fly.io health check fails (502) | Nginx must listen on port 8080 (not 80); `internal_port = 8080` in fly.toml |
| Container crashes on start | `fly logs` shows Nginx config error | Run `nginx -t -c nginx.conf` locally to validate config syntax |
| Build OOM during wasm-pack | CI build fails with "Killed" | Upgrade Fly.io builder machine: `fly machine update --memory 4096` |

---

## Summary

| Item | Value |
|------|-------|
| App name | `retirement-pay-ph` |
| Primary region | `sin` (Singapore) |
| Default URL | `https://retirement-pay-ph.fly.dev` |
| Internal port | 8080 (Nginx) |
| VM size | `shared-cpu-1x`, 256MB |
| Dockerfile stages | rust-builder → frontend-builder → nginx |
| Env var injection | `fly deploy --build-arg VITE_SUPABASE_URL=... --build-arg VITE_SUPABASE_ANON_KEY=...` |
| Health check path | `/_health` → 200 "ok" |
| SPA routing | Nginx `try_files $uri $uri/ /index.html` |
| WASM content type | `application/wasm` (explicit in nginx.conf) |
| CSP WASM directive | `'wasm-unsafe-eval'` in `script-src` |
| Rollback | `fly deploy --image <previous-image-ref>` |
