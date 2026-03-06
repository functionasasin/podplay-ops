# Analysis: Environment Configuration

**Wave:** 5 — Frontend Data Model + UI Design
**Aspect:** env-configuration
**Date:** 2026-03-06
**Sources:** auth-flow.md, route-table.md

---

## Overview

The app requires two environment variables at build time. Missing vars cause Supabase client
initialization to fail silently. The solution is the **SetupPage pattern**: detect missing vars
at app load time in the root layout and render a setup guide instead of the normal app.

---

## 1. Environment Variables

### Required Variables

| Variable | Type | Purpose | Example Value |
|----------|------|---------|---------------|
| `VITE_SUPABASE_URL` | string (URL) | Supabase project REST + Auth endpoint | `https://abcdefghijklmnop.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | string (JWT) | Supabase anonymous API key (public, safe to expose) | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

Both are **required** for the app to function. They are available from the Supabase project
dashboard under **Project Settings > API**.

### No Optional Variables

There are no optional environment variables. The app does not support feature flags, analytics,
or any third-party integrations requiring separate env vars. If additional vars are needed in
future, they follow the same `VITE_` prefix pattern (Vite-required for client-side exposure).

---

## 2. Files

### 2a. `.env.local.example`

**Location:** `apps/retirement-pay/frontend/.env.local.example`

Committed to the repo. Developers copy it to `.env.local` and fill in real values.
`.env.local` is in `.gitignore` and must NEVER be committed.

```
# RA 7641 Retirement Pay Calculator — Environment Configuration
#
# Copy this file to .env.local and fill in your Supabase project credentials.
# Get these from: https://supabase.com/dashboard/project/<your-project>/settings/api
#
# NEVER commit .env.local to git.

# Supabase project URL (required)
# Format: https://<project-ref>.supabase.co
VITE_SUPABASE_URL=https://your-project-ref.supabase.co

# Supabase anon key (required)
# This key is safe to expose in client-side code. It enforces Row Level Security.
# Format: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.<payload>.<signature>
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-anon-key-here
```

### 2b. `.gitignore` Entry

**Location:** `apps/retirement-pay/frontend/.gitignore`

Must include:
```
.env.local
.env.*.local
```

### 2c. Supabase Client (`src/lib/supabase.ts`)

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Do NOT throw here — missing vars handled by SetupPage pattern in root layout.
// createClient called with empty strings so the module loads without crashing.
// All Supabase calls will fail gracefully; root layout intercepts before they're made.

export const supabase = createClient<Database>(
  supabaseUrl ?? '',
  supabaseAnonKey ?? '',
  {
    auth: {
      flowType: 'pkce',
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
)

export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)
```

**Why not throw on missing vars?** Vite bundles the module at startup. Throwing would crash
the entire module graph before React mounts. The `SetupPage` pattern is the correct intercept.

---

## 3. SetupPage Pattern

### Root Layout Check (`src/routes/__root.tsx`)

The root layout checks `supabaseConfigured` before rendering any route:

```typescript
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/AuthContext'
import { Toaster } from 'sonner'
import { SetupPage } from '@/components/SetupPage'
import { supabaseConfigured } from '@/lib/supabase'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
})

function RootLayout() {
  if (!supabaseConfigured) {
    return <SetupPage />
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  )
}

function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-slate-800">404</h1>
        <p className="text-slate-600">Page not found.</p>
        <a href="/" className="text-blue-600 hover:underline text-sm">Go to Homepage</a>
      </div>
    </div>
  )
}
```

### SetupPage Component (`src/components/SetupPage.tsx`)

**File:** `apps/retirement-pay/frontend/src/components/SetupPage.tsx`

Rendered when `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` are missing or empty.

```typescript
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CheckCircle2, Terminal } from 'lucide-react'

export function SetupPage() {
  const hasUrl = Boolean(import.meta.env.VITE_SUPABASE_URL)
  const hasKey = Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY)

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-xl font-bold">Setup Required</CardTitle>
          </div>
          <CardDescription>
            The app needs your Supabase credentials before it can start.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Missing environment variables detected. Create a{' '}
              <code className="font-mono text-sm bg-red-100 px-1 rounded">.env.local</code>{' '}
              file in <code className="font-mono text-sm bg-red-100 px-1 rounded">apps/retirement-pay/frontend/</code>.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Terminal className="h-4 w-4" />
              Variable Status
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded border px-3 py-2">
                <code className="font-mono text-sm text-slate-700">VITE_SUPABASE_URL</code>
                {hasUrl ? (
                  <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Set
                  </Badge>
                ) : (
                  <Badge variant="destructive">Missing</Badge>
                )}
              </div>
              <div className="flex items-center justify-between rounded border px-3 py-2">
                <code className="font-mono text-sm text-slate-700">VITE_SUPABASE_ANON_KEY</code>
                {hasKey ? (
                  <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Set
                  </Badge>
                ) : (
                  <Badge variant="destructive">Missing</Badge>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-slate-800">Steps to fix</h3>
            <ol className="space-y-2 text-sm text-slate-600 list-decimal list-inside">
              <li>
                Go to{' '}
                <span className="font-mono text-xs bg-slate-100 px-1 rounded">
                  supabase.com/dashboard
                </span>{' '}
                and open your project
              </li>
              <li>
                Navigate to <strong>Project Settings &gt; API</strong>
              </li>
              <li>
                Copy the <strong>Project URL</strong> and <strong>anon public</strong> key
              </li>
              <li>
                Create{' '}
                <span className="font-mono text-xs bg-slate-100 px-1 rounded">
                  apps/retirement-pay/frontend/.env.local
                </span>{' '}
                with the content below
              </li>
              <li>Restart the dev server (<code className="font-mono text-xs">npm run dev</code>)</li>
            </ol>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-slate-800 text-sm">.env.local template</h3>
            <pre className="bg-slate-900 text-slate-100 rounded-lg p-4 text-xs font-mono overflow-x-auto whitespace-pre">
{`VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## 4. TypeScript Environment Type Augmentation

**File:** `apps/retirement-pay/frontend/src/vite-env.d.ts`

Vite generates this file. It must be extended to include custom env var types:

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

This makes `import.meta.env.VITE_SUPABASE_URL` typed as `string` instead of `string | undefined`,
which means TypeScript will not error when passing it to `createClient`. The runtime check
via `supabaseConfigured` handles the empty-string case; TypeScript trusts the declaration.

---

## 5. Production Environment (Fly.io)

In production, env vars are set as Fly.io secrets, NOT in `.env.local`:

```bash
# Set Supabase credentials as Fly.io secrets (run once during deployment setup)
fly secrets set VITE_SUPABASE_URL=https://your-project-ref.supabase.co
fly secrets set VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Important**: Vite embeds env vars at **build time**, not runtime. The Docker build must have
access to the secrets during `npm run build`. In the Dockerfile:

```dockerfile
# Build stage — env vars must be available HERE
FROM node:22-alpine AS frontend-builder

WORKDIR /app
COPY apps/retirement-pay/frontend/ .
RUN npm ci

# These build args are set from Fly.io secrets via fly.toml [build.args]
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

RUN npm run build
```

In `fly.toml`:

```toml
[build]
  [build.args]
    VITE_SUPABASE_URL = ""      # Overridden by fly secrets at build time
    VITE_SUPABASE_ANON_KEY = "" # Overridden by fly secrets at build time
```

**Fly.io build-time secret injection**: Use `fly secrets set` for runtime secrets (Node.js apps)
but for Vite apps that embed vars at build time, pass them as build args via `fly deploy`:

```bash
fly deploy \
  --build-arg VITE_SUPABASE_URL=$(fly secrets list | ...) \
  ...
```

Actually the standard pattern for Vite on Fly.io is to pass the secrets via `fly.toml` env
section and ensure the Docker build stage has access. The CI/CD pipeline section will cover
the exact `fly deploy` command with `--build-arg` flags.

---

## 6. Local Development Supabase (Optional)

For fully local development using `supabase start` (Docker):

```
# .env.local — local Supabase instance (supabase start output)
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRFA0NiK7W9oHKFkr4fHx252K9um2vmjfuJF7DaRqrY
```

The anon key shown is the default local Supabase development key (publicly known, safe to
include in documentation). It does not grant access to any production data.

---

## 7. /setup Route

The `/setup` route renders `SetupPage` directly for developers navigating to it deliberately
(e.g., following a README link). This route is defined in `src/routes/setup.tsx`:

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { SetupPage } from '@/components/SetupPage'

export const Route = createFileRoute('/setup')({
  component: SetupPage,
})
```

When env vars ARE configured and the user navigates to `/setup`, they still see the setup page
(with both variables showing "Set" status). This is intentional — it serves as a diagnostic
page for verifying configuration.

---

## Summary

| Item | Value |
|------|-------|
| Required vars | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |
| Example file | `apps/retirement-pay/frontend/.env.local.example` |
| gitignored | `apps/retirement-pay/frontend/.env.local` |
| Missing var handling | Root layout renders `<SetupPage />` before any route |
| Type declaration | `src/vite-env.d.ts` augments `ImportMetaEnv` |
| Production injection | Fly.io `--build-arg` at Docker build time |
| Local Supabase | `http://localhost:54321` with known default anon key |
| Export from supabase.ts | `export const supabaseConfigured: boolean` |
