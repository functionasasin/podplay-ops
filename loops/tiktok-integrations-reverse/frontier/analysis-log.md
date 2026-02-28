# Analysis Log

| # | Timestamp | Aspect | Duration | Key Findings |
|---|-----------|--------|----------|--------------|
| 1 | 2026-02-28 | `tiktok-login-kit` | 1 run | OAuth 2.0 foundation for all TikTok APIs. Two token types: user (`act.`, 24h, refreshable via refresh_token for 365d) and client-credentials (`clt.`, 2h, no user needed). Non-standard `client_key` param instead of `client_id`. 2024 breaking change split `user.info.basic` into basic/profile/stats scopes. App review required (3–4 days, manual). Login Kit gates Display API, Content Posting, Data Portability. Client credentials gates Research API + Commercial Content API. |
