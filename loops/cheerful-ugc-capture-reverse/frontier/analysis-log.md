# Analysis Log

| # | Timestamp | Aspect | Duration | Key Findings |
|---|-----------|--------|----------|--------------|
| 1 | 2026-02-28 | `graph-api-mentions-tags` | 1 run | `/tags` polls photo-tagged feed posts (no creator opt-in, brand token); `mentioned_media` is webhook-first (requires `media_id`). Both use brand's own token. Stories/Reels NOT covered. 200 calls/hr/brand rate limit. `instagram_manage_comments` requires App Review. Two distinct webhook systems (Graph API `changes` vs Messaging API `messaging`). |
| 2 | 2026-02-28 | `webhooks-mentions` | 1 run | Graph API `mentions` (plural, `changes[]` array) = caption/comment @mentions; Messaging API `mention` (singular, `messaging[]` array) = Story mentions — completely separate systems. Caption vs comment distinguished by `comment_id` null/present. No polling fallback for @mentions — webhook is mandatory. Shares callback URL + page token with IG DM integration. Incremental effort is tiny if IG DM infra already built. At-least-once delivery; no replay API; missed events are unrecoverable. Private account posts invisible. |
