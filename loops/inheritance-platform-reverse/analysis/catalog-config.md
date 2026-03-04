# catalog-config — Design Tokens & Build Configuration

**Wave**: 1 — Source Acquisition
**Date**: 2026-03-04
**Status**: Complete

---

## Files Analyzed

| File | Purpose |
|------|---------|
| `app/src/index.css` | Global styles, Tailwind v4 config, design tokens (CSS custom properties) |
| `app/vite.config.ts` | Build toolchain: Vite 7 + React + Tailwind + WASM |
| `app/tsconfig.json` | TypeScript compiler settings |
| `app/package.json` | All dependencies and scripts |
| `app/supabase/config.toml` | Local Supabase dev stack config (auth, DB, storage) |
| `app/.env.local.example` | Environment variable template |

---

## Design Tokens (`index.css`)

### CSS Stack
- Tailwind v4 via `@import "tailwindcss"` (no `tailwind.config.ts` needed)
- `tw-animate-css` — utility animation library imported globally
- `shadcn/tailwind.css` — shadcn component base styles

### Typography
- `--font-sans: 'Inter Variable', 'Inter', ui-sans-serif, system-ui, sans-serif`
- `--font-serif: 'Lora', 'Georgia', ui-serif, serif`
- Both fonts installed as packages (`@fontsource-variable/inter`, `@fontsource-variable/lora`)
- **Gap**: No custom font-size scale defined; app uses Tailwind defaults (`text-sm`, `text-lg`, etc.). No heading hierarchy established.

### Navy + Gold Palette (confirmed in place)
| Token | Value | Description |
|-------|-------|-------------|
| `--primary` | `#1e3a5f` | Deep navy — CTA buttons, headings |
| `--accent` | `#c5a44e` | Warm gold — highlights, active states |
| `--background` | `#f8fafc` | Slate-50 surface |
| `--foreground` | `#0f172a` | Slate-900 text |
| `--card` | `#ffffff` | White card backgrounds |
| `--muted` | `#f1f5f9` | Slate-100 secondary surfaces |
| `--muted-foreground` | `#64748b` | Slate-500 secondary text |
| `--border` | `#e2e8f0` | Slate-200 borders |
| `--destructive` | `#991b1b` | Deep red for errors |
| `--success` | `#166534` | Forest green for success |
| `--warning` | `#92400e` | Amber brown for warnings |
| `--ring` | `#1e3a5f` | Navy focus rings |

### Sidebar Tokens
| Token | Value |
|-------|-------|
| `--sidebar` | `#1e3a5f` (navy background) |
| `--sidebar-foreground` | `#ffffff` |
| `--sidebar-primary` | `#c5a44e` (gold for active items) |
| `--sidebar-primary-foreground` | `#ffffff` |
| `--sidebar-accent` | `#2a4d7a` (mid-navy for hover) |
| `--sidebar-accent-foreground` | `#ffffff` |
| `--sidebar-border` | `#2a4d7a` |
| `--sidebar-ring` | `#c5a44e` |

### Border Radius
- `--radius: 0.625rem` (10px base)
- Derived: `--radius-sm` (6px), `--radius-md` (8px), `--radius-lg` (10px), `--radius-xl` (14px), `--radius-2xl` (18px), `--radius-3xl` (22px), `--radius-4xl` (26px)

### Gaps / Missing Tokens
1. **Dark mode tokens absent**: `@custom-variant dark (&:is(.dark *))` is declared but no `.dark` selector block with overridden CSS variables exists. Dark mode cannot work.
2. **No shadow/elevation tokens**: No `--shadow-*` custom properties. Card shadows are applied ad-hoc via inline Tailwind classes (`shadow-sm`, etc.) with no consistency.
3. **No animation/transition tokens**: `tw-animate-css` is imported but no custom durations (`--duration-*`) or easings (`--ease-*`) are defined. Each component uses arbitrary values.
4. **No font-size scale**: No `--text-*` overrides. Legal documents need a distinct heading hierarchy (H1 for firm name, H2 for case title, etc.).

---

## Build Config (`vite.config.ts`)

### Plugins
- `@tailwindcss/vite` — Tailwind v4 Vite integration
- `@vitejs/plugin-react` — React Fast Refresh
- `vite-plugin-wasm` — WebAssembly support
- `vite-plugin-top-level-await` — Required for wasm imports at module scope

### Alias
- `@` → `./src` (confirmed, matches tsconfig paths)

### Gaps
1. **No build output optimization**: No `build.rollupOptions.output.manualChunks`. Large packages (`react-d3-tree`, `recharts`, `@react-pdf/renderer`, wasm binary) will all land in one chunk, hurting initial load time.
2. **No dev proxy**: All API calls go directly to `VITE_SUPABASE_URL`. No CORS issues expected with Supabase but worth noting.
3. **No test config**: `vitest` config must be in a separate file or `package.json`. Not found — may use implicit defaults.

---

## TypeScript Config (`tsconfig.json`)

- Target: `ES2020` — supports modern JS, compatible with all target browsers
- `strict: true` — catches most type errors
- `noUnusedLocals: true`, `noUnusedParameters: true` — strict hygiene
- `noUncheckedIndexedAccess: true` — forces array/object access to handle `undefined` (strictest setting)
- `moduleResolution: "bundler"` — Vite-optimized, supports ESM imports without `.js` extensions
- Only includes `src/` directory (correct)

**No gaps** — tsconfig is well-configured.

---

## Dependencies (`package.json`)

### Key Dependencies Catalog
| Package | Version | Purpose |
|---------|---------|---------|
| `@supabase/supabase-js` | ^2.98.0 | Auth + DB client |
| `@tanstack/react-router` | ^1.163.3 | File-based routing |
| `react-hook-form` | ^7.71.2 | Form state management |
| `@hookform/resolvers` | ^5.2.2 | Zod integration for forms |
| `zod` | ^4.3.6 | Schema validation |
| `@react-pdf/renderer` | ^4.3.2 | PDF export |
| `recharts` | ^3.7.0 | Charts/visualization |
| `react-d3-tree` | ^3.6.6 | Family tree visualization |
| `lucide-react` | ^0.575.0 | Icon library |
| `radix-ui` | ^1.4.3 | Headless component primitives |
| `qrcode.react` | ^4.2.0 | QR codes for case sharing |
| `jszip` | ^3.10.1 | ZIP export |
| `react-markdown` | ^10.1.0 | Narrative panel rendering |
| `rehype-sanitize` | ^6.0.0 | XSS protection for markdown |
| `remark-gfm` | ^4.0.1 | GitHub Flavored Markdown |

### Missing Dependencies (Gaps)
1. **No toast/notification library**: `sonner`, `react-hot-toast`, or similar is absent. Multiple components need user feedback (form submit, copy link, invite sent). Cross-confirmed from `catalog-components`.
2. **No date manipulation library**: No `date-fns`, `dayjs`, or `luxon`. The app handles legal deadlines (statute of limitations, filing dates) which require date arithmetic. Currently raw `Date` objects are used throughout, risking timezone/DST bugs.
3. **WASM bridge**: `vite-plugin-wasm` is configured and `comparison.ts` uses a static wasm import (`@/wasm/bridge`). That wasm file must exist at `src/wasm/bridge.wasm` — NOT VERIFIED in source catalog.

### Dev Dependencies (Complete)
- `@testing-library/react` + `jest-dom` + `user-event` — testing stack
- `vitest` ^4.0.18 — test runner
- `jsdom` ^28.1.0 — DOM simulation for tests
- `shadcn` ^3.8.5 — component generator CLI
- `typescript` ^5.9.3

---

## Supabase Config (`supabase/config.toml`)

### Auth Configuration
| Setting | Value | Impact |
|---------|-------|--------|
| `jwt_expiry` | 3600 (1 hour) | Sessions expire after 1 hour |
| `enable_refresh_token_rotation` | true | Tokens rotate on refresh |
| `refresh_token_reuse_interval` | 10s | 10s grace window for concurrent requests |
| `enable_signup` | true | Users can register |
| `enable_anonymous_sign_ins` | false | No anonymous sessions |
| `enable_confirmations` | false | **Email NOT required to verify on signup** |
| `minimum_password_length` | 6 | Weak — should be 8+ for legal tool |
| `secure_password_change` | false | Can change password without re-auth |
| `double_confirm_changes` | true | Email changes confirmed on both addresses |

### Critical Auth Gaps
1. **Email confirmations disabled** (`enable_confirmations = false`): Users can sign up and immediately access the app without verifying their email. For a legal tool handling estate cases, this is a security concern. Production config MUST enable confirmations.
2. **Weak password minimum** (6 chars): Legal tools should enforce at least 8 characters, ideally with a complexity requirement (`letters_digits` minimum).
3. **No production auth config**: `config.toml` is purely for local dev. Production Supabase project auth settings are managed via the Supabase dashboard, not this file. No documentation exists for what production settings should be.
4. **site_url hardcoded to localhost**: `site_url = "http://127.0.0.1:3000"` means auth redirect emails (password reset, email confirmation) point to localhost in dev. Production deployment requires updating the Supabase project's site_url via dashboard.

### Storage
- Max file size: 50MiB
- S3 protocol enabled (for programmatic access)
- No buckets configured (commented out)

### DB
- Major version: 17 (PostgreSQL 17)
- Migrations enabled, seed file at `./seed.sql`

---

## Environment Variables (`.env.local.example`)

```
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your-local-anon-key-from-supabase-start
```

### Gaps
1. **Only 2 env vars documented**: The `supabase.ts` client reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. No other env vars exist or are needed currently. However:
2. **No production values guidance**: Example file uses localhost values. No `.env.production.example` or README section explaining how to get production values from the Supabase dashboard.
3. **Missing `VITE_APP_URL`**: For features like QR codes, share links, and PDF footers, the app needs to know its own URL. Currently hardcoded or absent; should be `VITE_APP_URL=https://your-domain.com`.

---

## Summary of Findings

### Confirmed Working
- Navy + Gold palette fully defined with all required tokens
- Tailwind v4 setup is correct and complete
- TypeScript config is strict and well-tuned
- Font stack (Inter + Lora) installed and referenced
- WASM build pipeline configured correctly
- React Router and form validation stack present and consistent

### Gaps (Action Required)

| Gap | Severity | Impact |
|-----|----------|--------|
| Email confirmations disabled in dev config | HIGH | Security — users access app without verified email |
| No toast/notification library installed | HIGH | UX dead end — no feedback on form submit, copy, invite |
| No date manipulation library | MEDIUM | Bug risk — timezone/DST in deadline calculations |
| Missing `VITE_APP_URL` env var | MEDIUM | QR codes and share links can't resolve absolute URLs |
| No production auth guidance | MEDIUM | Deployment blocker — unclear how to configure prod auth |
| Weak minimum password length (6) | MEDIUM | Security — below recommended for legal tools |
| No shadow/elevation design tokens | LOW | Design inconsistency — card shadows ad-hoc |
| No animation/transition tokens | LOW | Motion inconsistency across components |
| Dark mode declared but not implemented | LOW | Feature gap (dark mode currently non-functional) |
| No Vite chunk splitting | LOW | Performance — large initial bundle |
| No font-size scale tokens | LOW | Typography inconsistency for legal document headings |
