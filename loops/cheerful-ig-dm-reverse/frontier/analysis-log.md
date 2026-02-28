# Analysis Log

| # | Timestamp | Aspect | Duration | Key Findings |
|---|-----------|--------|----------|--------------|
| 1 | 2026-02-28 | `meta-instagram-messaging-api` | 1 run | Messenger Platform API; requires Business/Creator + FB Page link; Advanced Access app review required (2–10 days); webhook object=instagram; IGSID-based sender identity; 24h outbound window; 200 DM/hr rate limit; no group DMs; voice/Reels unsupported |
| 2 | 2026-02-28 | `meta-graph-api-conversations` | 1 run | Complementary read layer to Messenger Platform; `GET /{page-id}/conversations?platform=instagram`; cursor-paginated; same `instagram_manage_messages` Advanced Access required; 30-day inactivity cutoff for Requests folder; NOT viable as primary ingestion (rate limits + latency); best for initial account sync and webhook recovery/backfill; new Instagram Login API (July 2024) may remove FB Page requirement but DM endpoint support unclear; not deprecated |
