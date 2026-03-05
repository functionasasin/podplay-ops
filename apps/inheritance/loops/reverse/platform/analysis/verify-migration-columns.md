# verify-migration-columns — Migration Column & RPC Verification

**Wave**: 1 (Additional Verification)
**Date**: 2026-03-04
**Sources**: All files in `loops/inheritance-frontend-forward/app/supabase/migrations/`, `app/supabase/config.toml`

---

## Verification Checklist

### 1. Migrations 003 and 008 — Status

| Migration | Status | Explanation |
|-----------|--------|-------------|
| `003_*.sql` | **MISSING — CONFIRMED** | File does not exist in migrations directory. Not referenced by any other file. No evidence it was ever written. Initial schema was consolidated into 001 in a single mega-migration. |
| `008_*.sql` | **MISSING — CONFIRMED** | File does not exist. Same situation. Gap between 007 and 009 is unexplained. No migration notes or changelog. |

**Impact**: Sequential migration runners that enforce numbering continuity (e.g., Flyway) will error. Supabase CLI applies alphabetically so this does not fail locally, but any custom deployment script checking for continuity will break. Documented gap needs a `_MIGRATION_NOTES.md` file.

---

### 2. Migration 004 — `get_shared_case()` RPC

**Status**: ✅ EXISTS AND CORRECT

File: `004_shared_case_rpc.sql`

```sql
CREATE OR REPLACE FUNCTION get_shared_case(p_token TEXT)
RETURNS TABLE (
  title TEXT,
  status TEXT,
  input_json JSONB,
  output_json JSONB,
  decedent_name TEXT,
  date_of_death DATE
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
```

**Functional**: Returns shared case data to anonymous users when `share_token` matches and `share_enabled = TRUE`. SECURITY DEFINER correctly bypasses RLS.

**Gap found**: The RPC only returns `input_json` and `output_json`. The public share page (`ShareResultsPage`) may need `tax_output_json` and `comparison_output_json` for a complete display. These columns exist on the table (see §3) but are not included in the RPC return type.

**Fix**: Update `get_shared_case` in a new migration `011_create_org_rpc.sql` to add:
```sql
-- Add to RETURNS TABLE:
tax_output_json JSONB,
comparison_output_json JSONB,
-- Add to SELECT:
c.tax_output_json, c.comparison_output_json
```

---

### 3. Migration 009 — `intake_data` Column

**Status**: ✅ EXISTS AND CORRECT

File: `009_cases_intake_data.sql`

```sql
ALTER TABLE cases ADD COLUMN IF NOT EXISTS intake_data JSONB;
CREATE INDEX IF NOT EXISTS idx_cases_intake_data ON cases
  USING gin(intake_data) WHERE intake_data IS NOT NULL;
```

Uses `IF NOT EXISTS` — idempotent. ✅

---

### 4. `cases` Table Column Verification

All columns confirmed present in `001_initial_schema.sql` (lines 167–210):

| Column | Present | Type | Notes |
|--------|---------|------|-------|
| `comparison_input_json` | ✅ | JSONB | Line 179 |
| `comparison_output_json` | ✅ | JSONB | Line 180 |
| `comparison_ran_at` | ✅ | TIMESTAMPTZ | Line 181 |
| `tax_input_json` | ✅ | JSONB | Line 177 |
| `tax_output_json` | ✅ | JSONB | Line 178 |
| `intake_data` | ✅ | JSONB | Added by 009 |

All 6 columns the premium spec required on `cases` are present. ✅

---

### 5. `firm-logos` Storage Bucket

**Status**: ❌ NOT CONFIGURED — MISSING

**Evidence**:
- `config.toml` storage section has no bucket definitions (lines 114–119 are commented-out example only)
- No `seed.sql` file exists in the supabase directory (referenced in config.toml line 65 but file is absent)
- No migration creates a storage bucket via `INSERT INTO storage.buckets`
- No migration creates RLS policies on `storage.objects` for a `firm-logos` bucket
- The premium spec (§4.3) requires this bucket for logo upload in FirmProfileEditor

**Impact**: `FirmProfileEditor` uses `supabase.storage.from('firm-logos').upload(...)`. Without the bucket, all logo uploads return a `Bucket not found` error. The logo_url column in user_profiles is never populated.

**Fix**: Add to `config.toml` for local development:
```toml
[storage.buckets.firm-logos]
public = true
file_size_limit = "2MiB"
allowed_mime_types = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"]
```

Add to a new migration `011_create_org_rpc.sql` for production:
```sql
-- Create firm-logos storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'firm-logos',
  'firm-logos',
  TRUE,
  2097152, -- 2MiB
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
) ON CONFLICT (id) DO NOTHING;

-- RLS: authenticated users can upload to their own path (org_id/logo.ext)
CREATE POLICY "firm_logos_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'firm-logos'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "firm_logos_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'firm-logos'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "firm_logos_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'firm-logos');

CREATE POLICY "firm_logos_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'firm-logos'
    AND auth.uid() IS NOT NULL
  );
```

---

## Summary

| Item | Status | Action Required |
|------|--------|-----------------|
| Migration 003 | MISSING (never written) | Document gap in `_MIGRATION_NOTES.md` |
| Migration 004 | ✅ EXISTS | Extend RPC to include tax/comparison output columns |
| Migration 008 | MISSING (never written) | Document gap in `_MIGRATION_NOTES.md` |
| Migration 009 | ✅ EXISTS (idempotent) | None |
| `comparison_*` columns | ✅ IN 001 | None |
| `tax_*` columns | ✅ IN 001 | None |
| `intake_data` column | ✅ IN 009 | None |
| `get_shared_case()` RPC | ✅ EXISTS | Missing tax/comparison output in return type |
| `firm-logos` storage bucket | ❌ MISSING | Add to config.toml + migration 011 |

**Critical finding**: The `firm-logos` bucket is the only item from the premium spec verification that is fully absent with no partial implementation.

**New findings feeding into spec**: The `get_shared_case` RPC gap and the missing `firm-logos` bucket must appear in the platform spec under §5 (Database Migrations) and §4 (Environment Configuration) respectively.
