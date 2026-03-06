# Fill Toast Catalog — TaxKlaro

**Wave:** 7.5 (Spec Gap Fill)
**Status:** COMPLETE
**Date:** 2026-03-06
**Depends on:** completeness-audit (identified 28 missing toasts in spec), toast-catalog.md (source)

---

## What Was Done

The `completeness-audit` found that Section 8.4 of `docs/plans/freelance-tax-spec.md` only documented 13 of 41 toasts in a summary table. The full `analysis/toast-catalog.md` contained 41 toasts across 8 categories with exact message text, variant, trigger, and handler context.

This aspect merged the complete catalog into Section 8.4 of the spec.

---

## Changes Made

**`docs/plans/freelance-tax-spec.md` — Section 8.4 replaced:**

Before: 13-row summary table, abbreviated Sonner setup, 1 code example.

After: Full Section 8.4 (8.4.1–8.4.12) containing:
- 8.4.1: Complete Sonner setup with `toastOptions`, `richColors` palette mapping, package.json dependency
- 8.4.2: 16 computation action toasts (exact `toast.*()` calls with trigger comments)
- 8.4.3: 4 PDF export toasts (loading+update pattern, toastId reuse)
- 8.4.4: 7 sharing toasts (including `duration: 5000` for longer share-rotated message)
- 8.4.5: 1 deadline toast
- 8.4.6: 6 team management toasts (interpolated invitation email)
- 8.4.7: 7 settings toasts (logo upload loading+update pattern)
- 8.4.8: 5 auth/onboarding toasts
- 8.4.9: Auto-save error toast + `SaveStatusIndicator` inline component spec
- 8.4.10: No-toast interactions table (10 entries)
- 8.4.11: Count summary table (13 success, 25 error, 1 info, 2 loading = 41 total)
- 8.4.12: Forward loop instructions + shadcn/ui toast conflict warning

---

## Toast Count

| Category | Success | Error | Info | Loading | Total |
|----------|---------|-------|------|---------|-------|
| Computation actions | 3 | 7 | 0 | 0 | 10 |
| PDF export | 1 | 2 | 0 | 1 | 4 |
| Sharing | 3 | 3 | 1 | 0 | 7 |
| Deadlines | 0 | 1 | 0 | 0 | 1 |
| Team management | 3 | 3 | 0 | 0 | 6 |
| Settings | 2 | 4 | 0 | 1 | 7 |
| Auth / onboarding | 1 | 4 | 0 | 0 | 5 |
| Auto-save error | 0 | 1 | 0 | 0 | 1 |
| **Total** | **13** | **25** | **1** | **2** | **41** |

---

## Critical Traps Documented

1. **Sonner vs shadcn/ui toast conflict** — Forward loop must NOT install `components/ui/toast.tsx` or `hooks/use-toast.ts`. They conflict with Sonner.
2. **toastId reuse for loading+update** — PDF export and logo upload use `toast.loading()` returning a `toastId`, which is passed to replacement `toast.success/error({ id: toastId })` calls.
3. **SaveStatusIndicator is NOT a toast** — Auto-save success uses inline component, not Sonner. Only auto-save errors use toasts.
4. **Inline field errors stay inline** — Already-member, already-invited, slug-taken, and all Zod validation errors render as field-level messages, not toasts.
5. **toast.info for share disabled** — Not `toast.success`. The distinction is intentional (disabling is neutral, not positive).
6. **`duration: 5000` for share-rotated** — The message "Share link rotated. Previous link is now invalid." is longer than average and needs extended display time.
