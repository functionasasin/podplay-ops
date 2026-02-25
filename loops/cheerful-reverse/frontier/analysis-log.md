# Analysis Log

| # | Timestamp | Aspect | Duration | Key Findings |
|---|-----------|--------|----------|--------------|
| 1 | 2026-02-25 | supabase-schema | 1 run | 50+ migration files; ~35 tables across email (Gmail+SMTP), campaign, creator, team, Discord, and infra domains; pgvector for email reply examples; pg_trgm for search; extensive RLS; trigger-maintained denormalized views |
