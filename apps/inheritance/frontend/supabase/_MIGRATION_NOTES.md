# Migration Notes

## Missing Migration Numbers

### 002, 003 — Never Written
The initial database schema was consolidated entirely into `001_initial_schema.sql`.
Migrations 002 and 003 were never written because all table/enum/trigger definitions
were combined in the initial file.

### 006 — No-op
`006_case_documents.sql` is a no-op: the `case_documents` table was already created
in `001_initial_schema.sql`. The migration file exists but contains a duplicate
`CREATE TABLE` that has no effect (Supabase applies idempotently in local dev via
`db reset`).

### 008 — Skipped
Migration 008 was skipped. The features that would have gone into 008 were instead
included in `009_cases_intake_data.sql` and `010_rls_org_scope.sql`.

## Apply Order (Production)

```
001_initial_schema.sql
004_shared_case_rpc.sql
005_case_deadlines.sql
006_case_documents.sql   (no-op, safe to apply)
007_conflict_check.sql
009_cases_intake_data.sql
010_rls_org_scope.sql
011_create_org_rpc.sql
012_pdf_storage.sql
```

## Local Dev

Run `supabase db reset` to drop and recreate cleanly from all migrations in order.
