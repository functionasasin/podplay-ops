# Analysis Log

| # | Timestamp | Aspect | Duration | Key Findings |
|---|-----------|--------|----------|--------------|
| 1 | 2026-02-28 | `graph-api-mentions-tags` | 1 run | `/tags` polls photo-tagged feed posts (no creator opt-in, brand token); `mentioned_media` is webhook-first (requires `media_id`). Both use brand's own token. Stories/Reels NOT covered. 200 calls/hr/brand rate limit. `instagram_manage_comments` requires App Review. Two distinct webhook systems (Graph API `changes` vs Messaging API `messaging`). |
