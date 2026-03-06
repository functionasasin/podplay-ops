# Monitoring and Alerts — TaxKlaro

**Wave:** 6 (Testing + Deployment)
**Status:** COMPLETE
**Date:** 2026-03-06
**Depends on:** fly-io-deployment, ci-cd-pipeline, production-build-verification

---

## Overview

TaxKlaro is a **pure client-side SPA** (React + WASM) served by nginx on Fly.io. There is no API server, no Express, no Node.js runtime in production. Monitoring therefore focuses on:

1. **Client-side JavaScript errors** — Sentry Browser SDK
2. **WASM computation failures** — Custom Sentry capture + error boundary
3. **Fly.io machine availability** — Built-in HTTP health check on port 8080
4. **Core Web Vitals / performance** — Sentry Performance
5. **External uptime monitoring** — BetterUptime or UptimeRobot HTTP probe

No server-side APM (no Express, no Node.js process to instrument). No custom metrics server. No log aggregation (nginx logs are ephemeral on Fly.io).

---

## 1. Sentry — Client-Side Error Tracking

### Installation

```bash
npm install @sentry/react
```

### Initialization — `src/main.tsx`

Sentry MUST be initialized **before** the React tree renders. Place at the very top of `main.tsx`, before imports of React or router.

```typescript
import * as Sentry from '@sentry/react';

// Initialize before anything else
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,  // undefined in dev = Sentry disabled
  environment: import.meta.env.MODE,       // "development" or "production"

  // Performance monitoring
  tracesSampleRate: import.meta.env.PROD ? 0.1 : 0.0,  // 10% in prod, off in dev

  // Release tracking (injected by CI)
  release: import.meta.env.VITE_APP_VERSION,

  // Filter out noise
  beforeSend(event) {
    // Drop events from localhost
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      return null;
    }
    return event;
  },

  // Ignore common browser extension errors
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
  ],
});
```

**Critical**: If `VITE_SENTRY_DSN` is undefined (local dev or not configured), Sentry initializes in no-op mode silently. No need to guard against it.

### Environment Variable

```
VITE_SENTRY_DSN=https://xxxx@o0.ingest.sentry.io/0
```

This is a **build-time** variable (embedded in the JS bundle by Vite). It is the public DSN (safe to expose — it only allows event submission, not reading). Add to:
- `.env.local.example` — with documentation comment
- Fly.io build secrets: `fly secrets set VITE_SENTRY_DSN=https://...`
- GitHub Actions secrets: `VITE_SENTRY_DSN`
- CI/CD Dockerfile `ARG VITE_SENTRY_DSN` (already in fly-io-deployment.md Dockerfile)

### Release Tracking

Inject the git commit SHA as the app version during CI builds:

**In GitHub Actions workflow (`.github/workflows/deploy.yml`):**
```yaml
- name: Deploy to Fly.io
  run: fly deploy --build-arg VITE_APP_VERSION=${{ github.sha }}
```

**In `vite.config.ts`:**
```typescript
export default defineConfig({
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(process.env.VITE_APP_VERSION ?? 'local'),
  },
});
```

This lets Sentry group errors by release and show diffs between affected releases.

---

## 2. Sentry Error Boundary — `src/components/ErrorBoundary.tsx`

Wraps the entire app to catch unhandled React render errors.

```typescript
import { Component, ReactNode } from 'react';
import * as Sentry from '@sentry/react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; eventId: string | null; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, eventId: null };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const eventId = Sentry.captureException(error, {
      contexts: { react: { componentStack: errorInfo.componentStack } },
    });
    this.setState({ eventId });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-sm border border-gray-200 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-gray-600 mb-6">
              An unexpected error occurred. The error has been reported.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => window.location.reload()}>
                Reload page
              </Button>
              {this.state.eventId && (
                <Button
                  variant="ghost"
                  onClick={() => Sentry.showReportDialog({ eventId: this.state.eventId! })}
                >
                  Report feedback
                </Button>
              )}
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
```

**Usage in `src/main.tsx`:**
```typescript
createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <RouterProvider router={router} />
  </ErrorBoundary>
);
```

---

## 3. WASM Computation Error Tracking — `src/wasm/bridge.ts`

WASM computation errors fall into two categories:

| Category | Source | Handling |
|----------|--------|----------|
| `ValidationError` | User input (code starts ERR_*) | Show to user via toast, do NOT send to Sentry |
| `ComputeError` | Engine bug (code starts ASSERT_*) | Send to Sentry as bug report, show generic error to user |
| `WasmInitError` | WASM failed to load | Send to Sentry as critical error, show setup error page |

**Sentry capture pattern in `bridge.ts`:**

```typescript
import * as Sentry from '@sentry/react';

export async function compute(input: EngineInput): Promise<WasmResult<EngineOutput>> {
  try {
    const result = computeJson(JSON.stringify(input));
    return JSON.parse(result) as WasmResult<EngineOutput>;
  } catch (e) {
    // WASM threw (uncaught panic or JS error)
    Sentry.captureException(e, {
      tags: { category: 'wasm_computation' },
      extra: { inputSummary: { taxYear: input.taxYear, regime: input.selectedRegime } },
    });
    return {
      ok: false,
      error: {
        code: 'WASM_PANIC',
        message: 'Internal computation error. This has been reported.',
        severity: 'error',
      },
    };
  }
}
```

**WASM init error capture in `bridge.ts`:**

```typescript
let initPromise: Promise<void> | null = null;

async function ensureInit(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    try {
      const { default: init } = await import('/pkg/taxklaro_engine.js');
      await init();
    } catch (e) {
      Sentry.captureException(e, {
        tags: { category: 'wasm_init' },
        level: 'fatal',
      });
      initPromise = null;  // Allow retry
      throw e;
    }
  })();
  return initPromise;
}
```

---

## 4. Performance Monitoring

### Core Web Vitals

Sentry automatically captures CWV (LCP, FID/INP, CLS, TTFB) when `tracesSampleRate > 0`.

No additional code needed — the `@sentry/react` SDK instruments automatically.

### Slow Computation Tracking

Flag WASM computations that exceed 500ms (should be <50ms — slowness indicates a bug):

```typescript
export async function compute(input: EngineInput): Promise<WasmResult<EngineOutput>> {
  await ensureInit();

  const startMs = performance.now();
  const result = computeJson(JSON.stringify(input));
  const durationMs = performance.now() - startMs;

  if (durationMs > 500) {
    Sentry.captureMessage('Slow WASM computation', {
      level: 'warning',
      extra: { durationMs, taxYear: input.taxYear },
    });
  }

  return JSON.parse(result) as WasmResult<EngineOutput>;
}
```

---

## 5. Fly.io Health Check

Fly.io monitors app health via HTTP probe. Configured in `fly.toml`:

```toml
[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = "stop"
  auto_start_machines = true
  min_machines_running = 0

  [http_service.checks]
    [http_service.checks.alive]
      interval = "30s"
      timeout = "5s"
      grace_period = "10s"
      method = "GET"
      path = "/"
      protocol = "http"
      tls_skip_verify = false
```

**Behavior:**
- Fly.io probes `GET /` on port 8080 every 30s
- nginx serves `index.html` (the SPA entry point) — response is 200 OK
- If the machine fails to respond within 5s, Fly.io marks it unhealthy
- Fly.io auto-restarts the nginx container on health check failure
- For `min_machines_running = 0`, machines stop when idle — the health check only runs when a machine is active

**Note**: This is a liveness check, not a readiness check. It only verifies nginx is running. It does NOT verify:
- Supabase connectivity (Supabase is external; outages affect app but not Fly.io health)
- WASM loading (client-side, not server-side)
- Database migrations applied

---

## 6. External Uptime Monitoring

Fly.io health checks only detect machine failure. An external probe detects full-stack outages (DNS, Cloudflare, Fly.io, etc.).

### BetterUptime (Recommended)

Free tier: 3 monitors, 3-minute intervals. Sufficient for TaxKlaro.

**Setup:**
1. Create account at betteruptime.com
2. Add monitor: `https://taxklaro.ph` — HTTP(S) check, every 3 minutes
3. Alert channels: Email to owner, optional Slack webhook
4. Escalation: Alert immediately on first failure (no multi-failure threshold for tax deadlines)

**Status page** (optional): BetterUptime provides a public status page at `status.taxklaro.ph` — configure CNAME in Cloudflare.

### Alternative: UptimeRobot

Free tier: 50 monitors, 5-minute intervals.

Same setup: HTTP monitor on `https://taxklaro.ph`, email alert on failure.

---

## 7. Alerting Thresholds

### Sentry Alerts (configured in Sentry dashboard)

| Alert | Condition | Severity | Action |
|-------|-----------|----------|--------|
| Error spike | >10 new errors/hour | High | Email + Slack |
| Error rate | >5% of sessions have errors | High | Email |
| WASM init failure | Any `wasm_init` tag error | Critical | Email immediately |
| WASM panic | Any `wasm_computation` tag error | High | Email |
| New issue | First occurrence of any new error | Medium | Email |
| Performance degradation | P95 LCP > 4s | Medium | Email |

**Sentry alert rule for WASM failures:**
- Rule: `tags.category = wasm_init OR tags.category = wasm_computation`
- Threshold: Any occurrence
- Action: Email owner immediately

### Fly.io Alerts

Fly.io sends email on:
- Machine restart (after health check failure)
- Certificate expiry warning (30 days before)
- App crash

No additional configuration needed — enabled by default for the app owner's email.

### Uptime Alerts

- Down alert: Notify immediately (first failure)
- Recovery alert: Notify when back up
- Recipients: Owner email

---

## 8. Sentry Project Configuration

### Sentry Project Setup

1. Create account at sentry.io
2. Create new project: Platform = "React", Project name = "taxklaro-frontend"
3. Get DSN from Project Settings > Client Keys > DSN
4. Set DSN as GitHub Secret + Fly.io build secret

### Inbound Filters

In Sentry > Project Settings > Inbound Filters:
- Enable: "Filter known browser extension errors"
- Enable: "Filter localhost"
- Enable: "Filter web crawlers"

### Issue Grouping

Default fingerprinting is sufficient. WASM errors are tagged with `category` for easy filtering.

### Issue Owners

Add owner rules in Sentry > Settings > Issue Owners:
```
path:src/wasm/* -> owner@taxklaro.ph
url:*/share/* -> owner@taxklaro.ph
```

---

## 9. `lib/monitoring.ts` — Convenience Wrapper

Centralizes Sentry calls so the rest of the app doesn't import Sentry directly.

```typescript
// src/lib/monitoring.ts

import * as Sentry from '@sentry/react';

/** Report a user-recoverable computation error (validation failure) — no Sentry */
export function trackValidationError(code: string, fieldName?: string) {
  // Do nothing — validation errors are expected, not bugs
  // Could be sent to analytics if needed, but not error tracking
  void code;
  void fieldName;
}

/** Report an unexpected engine error — sends to Sentry */
export function trackComputationError(error: Error | unknown, context?: Record<string, unknown>) {
  Sentry.captureException(error, {
    tags: { category: 'wasm_computation' },
    extra: context,
  });
}

/** Report WASM initialization failure — sends to Sentry as critical */
export function trackWasmInitError(error: Error | unknown) {
  Sentry.captureException(error, {
    tags: { category: 'wasm_init' },
    level: 'fatal',
  });
}

/** Report a non-fatal operational warning */
export function trackWarning(message: string, extra?: Record<string, unknown>) {
  Sentry.captureMessage(message, {
    level: 'warning',
    extra,
  });
}

/** Identify the current user in Sentry for better error attribution */
export function identifyUser(userId: string, email: string) {
  Sentry.setUser({ id: userId, email });
}

/** Clear user identity on sign-out */
export function clearUser() {
  Sentry.setUser(null);
}
```

**Usage in `useAuth` hook** (after auth state change):
```typescript
// On sign in:
identifyUser(user.id, user.email ?? '');
// On sign out:
clearUser();
```

---

## 10. No Server-Side Monitoring

TaxKlaro has no server-side process to monitor. Explicitly, the following server-side monitoring patterns from the original spec DO NOT APPLY:

| Original Spec Item | Status | Reason |
|--------------------|--------|--------|
| Express request latency metrics | DISCARD | No Express server |
| API error rate per endpoint | DISCARD | No API server |
| Database connection pool monitoring | DISCARD | Supabase manages this |
| Server memory / CPU metrics | DISCARD | nginx on Fly.io — trivial, auto-managed |
| Log aggregation (Winston, Datadog logs) | DISCARD | No server-side logging |
| Rate limit monitoring | DISCARD | Supabase handles rate limiting |

**What to monitor instead:**
- Client-side error rate (Sentry)
- WASM computation success rate (Sentry)
- Page load performance / CWV (Sentry Performance)
- Uptime (BetterUptime)
- Certificate expiry (Fly.io auto-notifies)

---

## 11. Forward Loop Integration Points

The forward loop MUST implement:

1. **`src/main.tsx`** — Sentry.init() call at very top, before React renders
2. **`src/components/ErrorBoundary.tsx`** — class component wrapping RouterProvider
3. **`src/lib/monitoring.ts`** — centralized Sentry wrapper functions
4. **`src/wasm/bridge.ts`** — trackComputationError / trackWasmInitError calls in catch blocks
5. **`src/hooks/useAuth.ts`** — identifyUser / clearUser calls on auth state change
6. **`fly.toml`** — `[http_service.checks]` section with 30s interval health check
7. **`vite.config.ts`** — `VITE_APP_VERSION` define for Sentry release tracking
8. **`.github/workflows/deploy.yml`** — `--build-arg VITE_APP_VERSION=${{ github.sha }}`
9. **`.env.local.example`** — `VITE_SENTRY_DSN=` line with comment (leave value empty for dev)

---

## 12. Critical Traps

1. **Sentry.init() must precede React**: If React renders before init(), the first render errors are missed. Always call `Sentry.init()` at the top of `main.tsx` before any other import that might throw.

2. **Do NOT send validation errors to Sentry**: ERR_* codes (user input problems) are expected. Sending them pollutes Sentry with noise. Only ASSERT_*/WASM_PANIC go to Sentry.

3. **VITE_SENTRY_DSN is a build arg**: Changing it requires redeploy. There is no runtime way to update it. Store the real DSN in Fly.io build secrets, not only in GitHub secrets.

4. **TracesSampleRate in development**: Set to `0.0` in dev (off) or performance traces from development flood Sentry's quota. The `import.meta.env.PROD` check in the init config handles this.

5. **Sentry user identity on session restore**: On page load, Supabase restores the session asynchronously. The `identifyUser()` call must happen in the `onAuthStateChange` callback, not just on sign-in — otherwise users who refresh are unidentified.

6. **BetterUptime probe vs. cold start**: With `min_machines_running = 0`, the Fly.io machine may be stopped when BetterUptime probes. The first probe after a cold start may time out (nginx takes <100ms to start, but Fly.io machine boot takes ~2-3s). Set BetterUptime timeout to 10s to avoid false positives.
