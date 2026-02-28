# TikTok Content Posting API — Analysis

## Overview

The TikTok Content Posting API enables third-party applications to programmatically upload and publish video and photo content to TikTok creator accounts. It supports two distinct posting modes (Direct Post to profile vs. Upload to Inbox as draft) and two media types (video and photo/carousel).

**Status**: Generally Available (GA)
**Authentication**: OAuth 2.0 user access tokens (via Login Kit — prerequisite)
**Base URL**: `https://open.tiktokapis.com/v2/`
**Required Scopes**: `video.publish` (Direct Post) or `video.upload` (Inbox/Draft upload)
**Official Docs**: https://developers.tiktok.com/doc/content-posting-api-get-started

---

## Architecture: Two Posting Modes

### Mode 1: Direct Post (`video.publish` scope)

Content is published directly to the creator's TikTok profile. The creator consents within your app and the video goes live (after moderation). Your app presents caption, hashtag, and privacy controls inline before posting.

**Key characteristics**:
- Requires `video.publish` scope (higher permission, more scrutiny in app review)
- Content goes directly to the creator's profile
- Creator must explicitly consent before posting (TikTok policy requirement)
- Your app must display a content preview
- Must include: *"By posting, you agree to TikTok's Music Usage Confirmation."* declaration
- Must not add promotional watermarks/logos to creator content (violation = revocation)
- Unaudited clients: content posted as `SELF_ONLY` (private) until audit passes

### Mode 2: Inbox Upload / Draft (`video.upload` scope)

Content is sent to TikTok and delivered to the creator's TikTok Inbox as a draft. The creator then opens TikTok, taps the inbox notification, and publishes through TikTok's native creation flow with full editing capabilities.

**Key characteristics**:
- Requires `video.upload` scope (lower permission, easier to get approved)
- Creator sees a notification in TikTok app inbox
- Creator completes the post natively in TikTok (can add stickers, sounds, effects, etc.)
- Better for "export to TikTok" or "save to drafts" use cases
- Less creator risk — they always have final control

---

## Endpoints

### 1. Initialize Direct Post — Video
```
POST https://open.tiktokapis.com/v2/post/publish/video/init/
```
**Scope**: `video.publish`

**Request body**:
```json
{
  "post_info": {
    "title": "Caption text (max 2200 chars)",
    "privacy_level": "PUBLIC_TO_EVERYONE | MUTUAL_FOLLOW_FRIENDS | FOLLOWER_OF_CREATOR | SELF_ONLY",
    "disable_duet": false,
    "disable_comment": false,
    "disable_stitch": false,
    "video_cover_timestamp_ms": 1000,
    "brand_content_toggle": false,
    "brand_organic_toggle": false
  },
  "source_info": {
    "source": "FILE_UPLOAD | PULL_FROM_URL",
    "video_size": 12345678,
    "chunk_size": 10485760,
    "total_chunk_count": 2
  }
}
```

**Prerequisites**: Must first call `POST /v2/post/publish/creator_info/query/` to get the creator's current privacy settings and available options.

**Response**:
```json
{
  "data": {
    "publish_id": "v_pub_url~v2-example",
    "upload_url": "https://upload.tiktokapis.com/video/?upload_id=..."
  },
  "error": { "code": "ok", "message": "" }
}
```

---

### 2. Initialize Inbox Upload — Video
```
POST https://open.tiktokapis.com/v2/post/publish/inbox/video/init/
```
**Scope**: `video.upload`

**Request body**:
```json
{
  "source_info": {
    "source": "FILE_UPLOAD | PULL_FROM_URL",
    "video_size": 12345678,
    "chunk_size": 10485760,
    "total_chunk_count": 2
  }
}
```

**Response**: Same structure as Direct Post init (returns `publish_id` + `upload_url`).

---

### 3. Initialize Photo/Carousel Post
```
POST https://open.tiktokapis.com/v2/post/publish/content/init/
```
**Scope**: `video.publish` (DIRECT_POST) or `video.upload` (MEDIA_UPLOAD)

**Request body**:
```json
{
  "media_type": "PHOTO",
  "post_mode": "DIRECT_POST | MEDIA_UPLOAD",
  "post_info": {
    "title": "Post title (max 90 UTF-16 runes)",
    "description": "Caption (max 4000 UTF-16 runes)",
    "privacy_level": "PUBLIC_TO_EVERYONE | SELF_ONLY | ...",
    "disable_comment": false,
    "auto_add_music": true,
    "brand_content_toggle": false,
    "brand_organic_toggle": false
  },
  "source_info": {
    "source": "PULL_FROM_URL",
    "photo_images": [
      "https://example.com/photo1.jpg",
      "https://example.com/photo2.jpg"
    ],
    "photo_cover_index": 0
  }
}
```

**Important**: Photo posts ONLY support `PULL_FROM_URL` source — no `FILE_UPLOAD` option.

**Response**:
```json
{
  "data": { "publish_id": "v_pub_url~v2-photo-example" },
  "error": { "code": "ok", "message": "" }
}
```

---

### 4. Query Creator Info (prerequisite for Direct Post)
```
POST https://open.tiktokapis.com/v2/post/publish/creator_info/query/
```
**Scope**: `video.publish`

Returns the creator's available privacy options, comment settings, duet/stitch settings, and other account-level constraints relevant to posting. Must be called before every direct post to ensure posted settings are valid for that creator.

---

### 5. Check Post Status (Polling)
```
POST https://open.tiktokapis.com/v2/post/publish/status/fetch/
```
**Scope**: `video.publish` or `video.upload`

**Request body**:
```json
{
  "publish_id": "v_pub_url~v2-example"
}
```

**Response status values**:
- `PROCESSING_UPLOAD` — media transfer in progress
- `PROCESSING_DOWNLOAD` — TikTok downloading from URL (PULL_FROM_URL mode)
- `SEND_TO_USER_INBOX` — sent to inbox (inbox mode)
- `PUBLISH_COMPLETE` — successfully published (direct post)
- `FAILED` — processing failed (see `fail_reason`)

**Key note**: For public posts, `post_id` is NOT returned until TikTok's content moderation completes (usually within 1 minute, but can take hours).

---

## Video Upload Mechanics (FILE_UPLOAD)

After initialization, upload video binary data via PUT to the returned `upload_url`:

```
PUT {upload_url}
Content-Range: bytes {start}-{end}/{total}
Content-Length: {chunk_size}
Content-Type: video/mp4
```

**Chunking rules**:
| Scenario | Rule |
|----------|------|
| File < 5 MB | Single upload, `chunk_size = file_size`, `total_chunk_count = 1` |
| 5 MB ≤ file ≤ 64 MB | Can upload as single chunk or multiple chunks |
| File > 64 MB | Must use multiple chunks |
| Each chunk | Minimum 5 MB, maximum 64 MB (except final chunk, up to 128 MB) |
| Total chunks | Minimum 1, maximum 1,000 |
| Upload order | Sequential only (no parallel chunk upload) |
| Upload URL validity | 1 hour from issuance |

---

## URL Pull Mechanics (PULL_FROM_URL)

TikTok servers download the video from your URL:
- URL must use HTTPS (no redirects)
- TikTok server ingress bandwidth: up to 100 Mbps
- Download timeout: 1 hour from init
- Your server must keep the URL accessible for the full download duration

---

## Supported Content Formats

### Video
| Format | Details |
|--------|---------|
| Container | MP4, MOV |
| Video codec | H.264 |
| Resolution | Up to 4K; recommended 1080×1920 (9:16) |
| Duration | 3 seconds – 10 minutes |
| Max file size | No explicit limit stated; practical max ~4 GB |

### Photo/Carousel
| Format | Details |
|--------|---------|
| Image formats | JPG, PNG |
| Images per post | Up to 35 images |
| Total size limit | 500 MB |
| Recommended per image | Under 100 KB for fast loading |
| Recommended dimensions | 1080×1920 px (9:16) |
| Cover image | Selectable via `photo_cover_index` |
| Music | Auto-add option via `auto_add_music` |

---

## Scheduling

**Native scheduling via API: Not supported.**

The Content Posting API has no `schedule_time` or future-dated publish parameters. To schedule posts:
- Build your own scheduler (store post metadata + media URL, trigger the API at desired time)
- Use third-party platforms (Later, Hootsuite, Buffer) which wrap the Content Posting API with scheduling UX
- TikTok's native scheduler (in-app only, not API-accessible)

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| Video/photo init (any mode) | 6 requests/minute per user `access_token` |
| Get Post Status | 30 requests/minute per user `access_token` |
| Daily posts per creator account | ~15 posts per 24-hour period (varies by account tier) |

- Rate limit window: 1-minute sliding window
- Exceeding limits returns HTTP 429 with error code `rate_limit_exceeded`
- Higher limits available on request via TikTok Support (reviewed case-by-case)

---

## Webhook Events

The Content Posting API fires events to your registered callback URL:

| Event | Trigger |
|-------|---------|
| `video.upload.failed` | Video upload failed (FILE_UPLOAD mode) |
| `authorization.removed` | User deauthorized your app (token already revoked at delivery) |

**Webhook payload example**:
```json
{
  "client_key": "bwo2m45353a6k85",
  "event": "video.upload.failed",
  "create_time": 1615338610,
  "user_openid": "act.example12345Example12345Example",
  "content": "{\"share_id\":\"video.6974245311675353080.VDCxrcMJ\"}"
}
```

**Subscription**: Configured via TikTok Developer Portal. By default, all events are delivered to your registered callback URL.

**Limitation**: No webhook is sent for successful `SELF_ONLY` (private) posts until the account owner makes them public.

---

## App Review & Audit Requirements

### App Review (before any users can access)
- Submit via TikTok Developer Portal with a demo video
- Demo must show actual integration with your website/app
- Required: sandbox environment demo if app not previously approved
- Timeline: several days to 2 weeks
- Rejection appeal: contact TikTok Support

**App statuses**: Draft → In Review → Live | Not Approved

### Audit (to lift content visibility restrictions)
After app review passes, all content from unaudited clients is posted as `SELF_ONLY` (private). To lift this:

| State | Restriction |
|-------|-------------|
| **Unaudited** | Max 5 users can post per 24-hour window; all posts are `SELF_ONLY` |
| **Audited** | Full public posting enabled; user cap lifted |

To become audited: contact TikTok after successful test integration. TikTok verifies ToS compliance.

**Consequences of violations**: Immediate integration revocation + permanent ban on future integrations for your account and business entity.

---

## UX Requirements (Policy — Not Optional)

TikTok mandates specific UX patterns for apps using the Content Posting API:

1. **Content preview**: Show users a preview of their content before posting
2. **Music confirmation**: Must display *"By posting, you agree to TikTok's Music Usage Confirmation."* before the post button
3. **No promotional watermarks**: Cannot add brand logos, links, or promotional text to creator content
4. **Preset hashtags editable**: Any pre-filled hashtags must be editable by the user before posting
5. **Full user awareness**: Users must understand and control what is posted to their account

---

## Privacy Level Options

| Level | Description |
|-------|-------------|
| `PUBLIC_TO_EVERYONE` | Anyone on TikTok can see |
| `MUTUAL_FOLLOW_FRIENDS` | Only mutual followers |
| `FOLLOWER_OF_CREATOR` | Only creator's followers |
| `SELF_ONLY` | Private (only creator can see) |

Available privacy options vary per creator (some creators may not have all options). Always call `creator_info/query/` first to check.

---

## Cheerful Applicability

### Primary Use Case: Influencer Content Amplification

For Cheerful, the Content Posting API is most relevant for enabling **brand-directed content workflows** where Cheerful facilitates creators posting campaign content:

| Workflow | Relevance | Mode |
|----------|-----------|------|
| Creator posts sponsored content | High — campaign deliverable tracking | Direct Post or Inbox Upload |
| Brand sends content brief + pre-made assets to creator | High — push to creator inbox for final approval/posting | Inbox Upload |
| Proof of posting for campaign completion | High — use `publish_id` + status polling to confirm post | Status API |
| Scheduling content calendar | Medium — requires custom scheduler layer | Custom + Direct Post |
| Photo/carousel campaign posts | Medium — influencer carousels common on TikTok | Photo Post endpoint |

### Key Limitation for Cheerful
Cheerful would need creators to **OAuth-connect their TikTok account** to Cheerful via Login Kit. This is a high-friction step. The `video.publish` scope (direct post) requires additional app review and audit. Starting with `video.upload` (inbox mode) is lower friction and easier to get approved.

### Integration Pattern
1. Creator connects TikTok account → Login Kit OAuth → store access token
2. Campaign brief finalized → Cheerful prepares video + caption
3. Call `creator_info/query/` to check creator's post constraints
4. Call `post/publish/video/init/` (inbox mode) with pre-approved content
5. TikTok sends notification to creator → creator reviews + publishes
6. Poll `post/publish/status/fetch/` or listen to webhook for `PUBLISH_COMPLETE`
7. Store `post_id` in Cheerful → link to campaign deliverable → begin metrics tracking

### No Native Scheduling = Custom Logic Required
If Cheerful wants scheduled posting, it must implement its own queue (e.g., Temporal workflow with a timer activity) that triggers the Content Posting API at the scheduled datetime.

---

## Summary Capability Map

| Capability | Available | Notes |
|------------|-----------|-------|
| Post video to TikTok (direct) | ✅ | `video.publish` scope + audit required |
| Post video to TikTok inbox/drafts | ✅ | `video.upload` scope (easier approval) |
| Post photo carousel | ✅ | `PULL_FROM_URL` only; URL-hosted images |
| Schedule posts natively | ❌ | Not supported — must build custom scheduler |
| Check post status | ✅ | Polling or webhook |
| Get `post_id` for tracking | ✅ | After moderation completes |
| Set privacy level | ✅ | Per-post control |
| Control duet/stitch/comment | ✅ | Per-post settings (direct post) |
| Paid partnership labeling | ✅ | `brand_content_toggle` field |
| Creator organic promo labeling | ✅ | `brand_organic_toggle` field |
| Arbitrary creator posting | ❌ | Must have creator's OAuth token |
| Bulk posting without user token | ❌ | Every post needs per-creator OAuth |
| Add music/sounds via API | ❌ | Music is creator-selected in TikTok; `auto_add_music` boolean only |
| Add TikTok effects/stickers | ❌ | Only available in TikTok's native editor (inbox mode) |

---

## Sources

- [TikTok Content Posting API — Getting Started](https://developers.tiktok.com/doc/content-posting-api-get-started)
- [Content Posting API — Getting Started (Upload)](https://developers.tiktok.com/doc/content-posting-api-get-started-upload-content)
- [Content Posting API — Direct Post Reference](https://developers.tiktok.com/doc/content-posting-api-reference-direct-post)
- [Content Posting API — Video Upload Reference](https://developers.tiktok.com/doc/content-posting-api-reference-upload-video)
- [Content Posting API — Photo Post Reference](https://developers.tiktok.com/doc/content-posting-api-reference-photo-post)
- [Content Posting API — Media Transfer Guide](https://developers.tiktok.com/doc/content-posting-api-media-transfer-guide)
- [Content Posting API — Get Post Status](https://developers.tiktok.com/doc/content-posting-api-reference-get-video-status)
- [Content Posting API — Product Page](https://developers.tiktok.com/products/content-posting-api/)
- [TikTok API Scopes Overview](https://developers.tiktok.com/doc/scopes-overview)
- [TikTok API Rate Limits](https://developers.tiktok.com/doc/tiktok-api-v2-rate-limit)
- [TikTok Webhook Events](https://developers.tiktok.com/doc/webhooks-events)
- [TikTok App Review Guidelines](https://developers.tiktok.com/doc/app-review-guidelines)
- [TikTok Content Sharing Guidelines](https://developers.tiktok.com/doc/content-sharing-guidelines)
