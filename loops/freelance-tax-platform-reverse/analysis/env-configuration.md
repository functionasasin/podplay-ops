# Environment Configuration — TaxKlaro

**Wave:** 4 (Platform Layer)
**Status:** COMPLETE
**Date:** 2026-03-06
**Depends on:** supabase-auth-flow, supabase-migrations, route-table

---

## Summary

This document specifies all environment variables for TaxKlaro, the `.env.local.example` file, the `vite-env.d.ts` TypeScript declarations, the `supabaseConfigured` guard pattern, the `SetupPage` fallback component, and how VITE_* vars are injected at build time for Fly.io Docker deployment.

---

## 1. Environment Variables

### Required Variables

| Variable | Purpose | Example Value |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase project REST/Auth endpoint | `https://xxxxxxxxxxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous (public) JWT key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `VITE_APP_URL` | Public URL of the app (no trailing slash) | `https://taxklaro.ph` |

### Optional Variables

| Variable | Purpose | Example Value |
|---|---|---|
| `VITE_SENTRY_DSN` | Sentry error tracking DSN | `https://abc123@o123456.ingest.sentry.io/789` |

### Local Development Variables

| Variable | Purpose | Example Value |
|---|---|---|
| `VITE_SUPABASE_URL` | Local Supabase (via `supabase start`) | `http://localhost:54321` |
| `VITE_SUPABASE_ANON_KEY` | Local Supabase anon key (from `supabase start` output) | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `VITE_APP_URL` | Local dev server URL | `http://localhost:5173` |

---

## 2. `.env.local.example`

Location: `frontend/.env.local.example`

```dotenv
# TaxKlaro Environment Configuration
# Copy this file to .env.local and fill in your values.
# NEVER commit .env.local to version control.

# ============================================================
# REQUIRED — App will not start without these
# ============================================================

# Supabase project URL (from: https://supabase.com/dashboard/project/_/settings/api)
# Local dev: run `supabase start` and copy the API URL shown
VITE_SUPABASE_URL=http://localhost:54321

# Supabase anonymous/public key (safe to expose in browser)
# Local dev: run `supabase start` and copy the anon key shown
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Public URL of this app — used for:
#   - Auth email redirect URLs (password reset, email confirmation)
#   - Share link generation
# Local dev: http://localhost:5173
# Production: https://taxklaro.ph
VITE_APP_URL=http://localhost:5173

# ============================================================
# OPTIONAL — Graceful degradation if absent
# ============================================================

# Sentry DSN for error tracking (omit to disable Sentry)
# VITE_SENTRY_DSN=https://your-dsn@o123456.ingest.sentry.io/789
```

---

## 3. TypeScript Declarations — `vite-env.d.ts`

Location: `frontend/src/vite-env.d.ts`

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_APP_URL: string;
  readonly VITE_SENTRY_DSN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

This enables TypeScript type checking for all `import.meta.env.VITE_*` accesses and flags misspelled variable names at compile time.

---

## 4. Supabase Client — `src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// supabaseConfigured is exported so main.tsx can render SetupPage if false
export const supabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// supabase is null-ish when not configured, but callers MUST guard on
// supabaseConfigured before calling any supabase methods.
export const supabase = supabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null as any;
```

**Critical**: `null as any` is intentional. It allows TypeScript to compile without non-null assertions at every call site. Runtime safety is guaranteed by the `supabaseConfigured` check in `main.tsx` — if not configured, the router never mounts and `supabase` is never called.

---

## 5. Application Bootstrap Guard — `src/main.tsx` (env-relevant portion)

```typescript
import { supabase, supabaseConfigured } from '@/lib/supabase';
import { SetupPage } from '@/components/SetupPage';

// Guard: if env vars missing, render setup instructions instead of crashing
if (!supabaseConfigured) {
  ReactDOM.createRoot(document.getElementById('root')!).render(<SetupPage />);
} else {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode><RouterWithAuth /></React.StrictMode>
  );
}
```

---

## 6. SetupPage Component — `src/components/SetupPage.tsx`

Rendered when `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` is missing. Shows setup instructions rather than crashing with a cryptic error.

```typescript
import { Calculator } from 'lucide-react';

export function SetupPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-xl shadow-sm border p-8 space-y-4">
        <div className="flex items-center gap-2">
          <Calculator className="h-6 w-6 text-[#1D4ED8]" />
          <h1 className="text-xl font-bold text-[#1D4ED8]">TaxKlaro</h1>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="font-medium text-amber-900 mb-1">Setup Required</p>
          <p className="text-sm text-amber-800">
            Missing Supabase environment variables. Create{' '}
            <code className="bg-amber-100 px-1 rounded">frontend/.env.local</code> with:
          </p>
        </div>
        <pre className="bg-slate-900 text-green-400 rounded-lg p-4 text-sm overflow-x-auto whitespace-pre">
{`VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your-key-here
VITE_APP_URL=http://localhost:5173`}
        </pre>
        <p className="text-sm text-slate-600">
          Run <code className="bg-slate-100 px-1 rounded">supabase start</code> to get your
          local keys, then restart the dev server with{' '}
          <code className="bg-slate-100 px-1 rounded">npm run dev</code>.
        </p>
      </div>
    </div>
  );
}
```

---

## 7. Usage of `VITE_APP_URL` at Runtime

`VITE_APP_URL` is referenced in two places:

### `src/lib/auth.ts` — Password reset redirect
```typescript
export async function resetPassword(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${import.meta.env.VITE_APP_URL}/auth/reset-confirm`,
  });
  if (error) throw error;
}
```

### `src/lib/computations.ts` — Share link generation
```typescript
export function getShareUrl(shareToken: string): string {
  return `${import.meta.env.VITE_APP_URL}/share/${shareToken}`;
}
```

**Important**: `VITE_APP_URL` must NOT have a trailing slash. The auth email redirect and share links both append a path directly.

---

## 8. Supabase Dashboard Configuration

The following redirect URLs must be added to the Supabase project's **Auth > URL Configuration**:

### Allowed Redirect URLs
```
https://taxklaro.ph/auth/callback
https://taxklaro.ph/auth/reset-confirm
http://localhost:5173/auth/callback
http://localhost:5173/auth/reset-confirm
```

These match the routes defined in the route table and the `redirectTo` values passed by `lib/auth.ts`.

**Supabase Dashboard path**: Authentication > URL Configuration > Redirect URLs

---

## 9. Dockerfile — Build-Time Variable Injection

Location: `frontend/Dockerfile`

VITE_* variables are baked into the static bundle at build time (not runtime). They must be passed as Docker build arguments.

```dockerfile
FROM node:20-alpine AS build

WORKDIR /app

# Accept VITE_* vars as build args (required, no defaults)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_APP_URL
ARG VITE_SENTRY_DSN

# Make build args available to Vite as env vars
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_APP_URL=$VITE_APP_URL
ENV VITE_SENTRY_DSN=$VITE_SENTRY_DSN

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage: nginx serving static files
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
```

**Note**: Inheritance app uses nginx (not `serve`). TaxKlaro uses the same pattern. The nginx.conf handles SPA routing (`try_files $uri $uri/ /index.html`) and asset caching.

### `nginx.conf`

```nginx
server {
    listen 8080;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript application/wasm;
    gzip_min_length 256;
}
```

The `application/wasm` MIME type in `gzip_types` is critical for WASM files to be served correctly.

---

## 10. Fly.io Build Arguments — `fly.toml`

```toml
app = "taxklaro"
primary_region = "sin"

[build]
  [build.args]
    VITE_APP_URL = "https://taxklaro.ph"
    # VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set as Fly secrets
    # and passed automatically if named as build args in Dockerfile

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

### Setting Secrets for Build

```bash
# Set Supabase secrets (these become available as build args)
fly secrets set VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
fly secrets set VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: Sentry
fly secrets set VITE_SENTRY_DSN=https://your-dsn@o123456.ingest.sentry.io/789
```

**Important**: Fly.io secrets named `VITE_*` are automatically passed as build args when the Dockerfile declares them with `ARG VITE_*`. The `VITE_APP_URL` is NOT a secret (it's public) and is set directly in `fly.toml [build.args]`.

---

## 11. Local Development Setup Flow

When a developer clones the repo and runs for the first time:

1. `cp frontend/.env.local.example frontend/.env.local`
2. `supabase start` — starts local Supabase (Docker-based), prints:
   ```
   API URL: http://localhost:54321
   anon key: eyJhbGci...
   ```
3. Copy those values into `.env.local`
4. `npm run dev` — if `.env.local` has values, app starts. If missing, SetupPage renders.

### `.gitignore` Entry (required)
```
frontend/.env.local
frontend/.env.*.local
```

---

## 12. Vite Configuration — `vite.config.ts`

```typescript
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import wasm from 'vite-plugin-wasm';

export default defineConfig({
  plugins: [tailwindcss(), react(), wasm()],
  build: {
    target: 'esnext',  // Required for WASM top-level await
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

`target: 'esnext'` is required because WASM initialization uses top-level await in modern browsers. Older targets trigger `vite-plugin-top-level-await` which can break prototype chains (see production-build-verification wave).

---

## 13. Critical Traps

### Trap 1: VITE_APP_URL trailing slash
If `VITE_APP_URL=https://taxklaro.ph/` (with trailing slash), share links become `https://taxklaro.ph//share/token` and auth redirects become `https://taxklaro.ph//auth/reset-confirm`. These fail.
**Fix**: Validate `VITE_APP_URL` has no trailing slash in `SetupPage` display and `lib/auth.ts` docs.

### Trap 2: Vars not in vite-env.d.ts
TypeScript will not error on `import.meta.env.VITE_TYPO` without the `ImportMetaEnv` interface. The interface in `vite-env.d.ts` makes all VITE_* accesses type-safe.

### Trap 3: VITE_* vars at runtime vs build time
These vars are replaced at build time by Vite (not injected at container startup). Changing them requires a rebuild. There is no runtime env injection for a static SPA — you cannot `fly secrets set` and have it take effect without `fly deploy`.

### Trap 4: Supabase anon key is NOT secret
`VITE_SUPABASE_ANON_KEY` is the public anonymous key designed to be exposed. It is not a secret. Row-Level Security (not the anon key) controls data access. However, it should still be stored in Fly secrets rather than hardcoded in source to allow key rotation without code changes.

### Trap 5: Redirect URLs must be configured in Supabase Dashboard
Even with correct `VITE_APP_URL`, Supabase will reject redirects that aren't in the allowlist. Both production (`https://taxklaro.ph/...`) and local dev (`http://localhost:5173/...`) URLs must be added.

### Trap 6: WASM MIME type in nginx
If nginx doesn't include `application/wasm` in `gzip_types`, some browsers reject the WASM file. Always include it (see nginx.conf above).
