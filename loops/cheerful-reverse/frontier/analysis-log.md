# Analysis Log

| # | Timestamp | Aspect | Duration | Key Findings |
|---|-----------|--------|----------|--------------|
| 1 | 2026-02-25 | supabase-schema | 1 run | 50+ migration files; ~35 tables across email (Gmail+SMTP), campaign, creator, team, Discord, and infra domains; pgvector for email reply examples; pg_trgm for search; extensive RLS; trigger-maintained denormalized views |
| 2 | 2026-02-25 | backend-api-surface | 1 run | 26 route files; ~110 endpoints; 3 auth tiers (JWT/API-key/Slack-sig/public); key domains: campaigns, threads, creators, drafts, email, Shopify, YouTube, Slack, teams, dashboard, internal service API; async via Temporal workflows |
| 3 | 2026-02-25 | backend-services | 1 run | 12 service domains (campaign, creator, email, post-tracking, external, storage, processing, CSV, workflow, tools, composio, utils); 27+ repositories; idempotency-first via ON CONFLICT DO NOTHING; append-only thread state; two-tier content storage (DB capped + Supabase Storage full); enrichment waterfall (cache→Apify→bio crawl→Influencer Club); personalization at queue time not send time |
