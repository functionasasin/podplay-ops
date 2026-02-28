# TikTok Embed & oEmbed — Analysis

## Overview

TikTok provides two zero-authentication integration surfaces: the **oEmbed API** (for converting video/profile URLs into embed markup) and the **Embed Player** (a programmable iframe player with bidirectional messaging). Both are publicly accessible without app registration or API keys, making them the lowest-friction way to interact with TikTok content programmatically.

**Status**: Generally Available (GA)
**Authentication**: None required
**Official Docs**:
- Video Embed: https://developers.tiktok.com/doc/embed-videos/
- Embed Player: https://developers.tiktok.com/doc/embed-player
- Creator Profile Embed: https://developers.tiktok.com/doc/embed-creator-profiles

---

## 1. oEmbed API — Video Embeds

### Endpoint

```
GET https://www.tiktok.com/oembed?url={tiktok_video_url}
```

No authentication header required. Standard HTTP GET.

### Example Request

```
https://www.tiktok.com/oembed?url=https://www.tiktok.com/@scout2015/video/6718335390845095173
```

### Response Fields

| Field | Type | Value / Notes |
|-------|------|---------------|
| `version` | string | `"1.0"` — oEmbed spec version |
| `type` | string | `"video"` |
| `title` | string | Video caption/description text |
| `author_name` | string | Creator's display name (username) |
| `author_url` | string | URL to creator's TikTok profile (`https://www.tiktok.com/@username`) |
| `width` | string | `"100%"` — responsive |
| `height` | string | `"100%"` — responsive |
| `html` | string | Full embed HTML: `<blockquote class="tiktok-embed">` + `<script async src="https://www.tiktok.com/embed.js">` |
| `thumbnail_url` | string | Video thumbnail image URL (CDN-hosted) |
| `thumbnail_width` | integer | `720` |
| `thumbnail_height` | integer | `1280` |
| `provider_name` | string | `"TikTok"` |
| `provider_url` | string | `"https://www.tiktok.com"` |

### Data Extractable Without Auth

From the oEmbed response alone (no API key, no OAuth):
- Video title/caption text
- Creator username + profile URL link
- Thumbnail image URL (720×1280)

**NOT available via oEmbed**: view count, like count, comment count, share count, follower count, posting date, hashtags, sounds, or any engagement metrics.

### HTML Structure

The returned `html` field embeds a `<blockquote class="tiktok-embed">` with a `data-video-id` attribute containing the numeric TikTok video ID. The `embed.js` script transforms this blockquote into a rendered interactive player. Example:

```html
<blockquote
  class="tiktok-embed"
  cite="https://www.tiktok.com/@username/video/1234567890"
  data-video-id="1234567890"
  data-embed-from="oembed"
  style="max-width: 605px; min-width: 325px;">
  <section></section>
</blockquote>
<script async src="https://www.tiktok.com/embed.js"></script>
```

The `cite` attribute doubles as the oEmbed request URL, parseable by AMP and other oEmbed-aware systems.

---

## 2. oEmbed API — Creator Profile Embeds

### Endpoint

Same endpoint, different URL type:

```
GET https://www.tiktok.com/oembed?url=https://www.tiktok.com/@username
```

### Response Fields

| Field | Type | Value |
|-------|------|-------|
| `version` | string | `"1.0"` |
| `type` | string | `"rich"` (differs from video — rich embed type) |
| `title` | string | Creator's profile title/name |
| `author_name` | string | Creator's username |
| `author_url` | string | Profile URL |
| `html` | string | Embed markup for profile widget |
| `width` | string | `"100%"` |
| `height` | string | `"100%"` |
| `provider_name` | string | `"TikTok"` |

### What the Rendered Creator Profile Shows

When rendered via `embed.js`, the creator profile embed displays:
- Creator avatar, username, bio
- **Follower count**
- **Following count**
- **Total likes** across all videos
- Up to **10 most recent videos** (auto-play on hover/scroll-into-view)

This is notable: follower count and total likes are visible in the rendered widget without any API authentication. However, these values are rendered in the client-side DOM (not in the oEmbed JSON response itself), making programmatic extraction require browser rendering or headless scraping.

### Limitations on Creator Profile Embeds

- **Private accounts**: Cannot be embedded; share icon grayed out in TikTok UI
- **Underage accounts**: Cannot be embedded; accounts without age set default to private
- Removed or deleted content becomes inaccessible in embedded form
- Some China-region browsers (CN) substitute TikTok's custom player with the default browser video player

---

## 3. Embed Player (Programmable iframe)

A more capable integration than the blockquote embed: a directly addressable iframe with bidirectional JavaScript messaging.

### URL Structure

```
https://www.tiktok.com/player/v1/{video_id}
```

Example:
```
https://www.tiktok.com/player/v1/6718335390845095173
```

No authentication required. Works for any public TikTok video.

### Customization Parameters

Append as query parameters to the player URL:

| Parameter | Values | Description |
|-----------|--------|-------------|
| `autoplay` | `0` / `1` | Auto-start playback on load |
| `muted` | `0` / `1` | Mute audio, disables volume control |
| `loop` | `0` / `1` | Repeat playback |
| `controls` | `0` / `1` | Show/hide progress bar and control buttons |
| `play_button` | `0` / `1` | Show/hide play button |
| `volume_control` | `0` / `1` | Show/hide volume control |
| `fullscreen_button` | `0` / `1` | Show/hide fullscreen button |
| `music_info` | `0` / `1` | Show sound/music details overlay |
| `description` | `0` / `1` | Show post description text |
| `progress_bar` | `0` / `1` | Show/hide progress bar (video only) |
| `timestamp` | `0` / `1` | Show elapsed/remaining time (video only) |

Most parameters apply to both video and image carousel posts. Some (`progress_bar`, `timestamp`) are video-only.

### Bidirectional Messaging API (postMessage)

The host page and player communicate via `window.postMessage()`.

**Commands host → player** (control playback programmatically):

| Method | Payload | Description |
|--------|---------|-------------|
| `play` | — | Start playback |
| `pause` | — | Pause playback |
| `seekTo` | `{seconds: N}` | Jump to specific timestamp |
| `mute` | — | Mute audio |
| `unMute` | — | Unmute audio |
| `navigateTo` | `{index: N}` | Navigate to image N in carousel |

**Events player → host** (observe playback state):

| Event | Data | Description |
|-------|------|-------------|
| `onPlayerReady` | — | Player fully initialized |
| `onStateChange` | state value | Playback state change (playing/paused/ended) |
| `onCurrentTime` | `{currentTime: N}` | Current playback time in seconds |
| `onMute` | boolean | Mute status changed |
| `onVolumeChange` | 0–100 | Volume percentage |
| `onImageChange` | `{index: N}` | Current carousel image index |
| `onPlayerError` | `{code, type}` | Error with code (1000–3000 range) |

**Error types**: `INVALID_VIDEO`, `SERVER_ERROR`, `PLAYBACK_ERROR`

This API enables building custom video interfaces that use TikTok content without showing TikTok's own player UI.

---

## 4. Authentication & Rate Limits

### Authentication
Neither the oEmbed endpoint nor the Embed Player requires authentication. Both accept public video/profile URLs directly.

### Rate Limits
TikTok does not publish documented rate limits for the oEmbed endpoint specifically. However:
- General TikTok API rate limits use a **1-minute sliding window** with HTTP 429 + `rate_limit_exceeded` error when exceeded
- The oEmbed endpoint is likely subject to IP-level throttling at some threshold (undocumented)
- For high-volume use, expect rate limiting without a formal request to TikTok for increased limits

### Commercial Use Restrictions

**Important**: TikTok's Developer Terms of Service explicitly state that commercial use of TikTok Developer Services (which includes embeds and APIs) requires **express written consent from TikTok**. The standard terms cover "domestic and private use" only.

For commercial applications:
- TikTok For Business accounts are governed by separate Commercial Terms
- Building a commercial product using TikTok embeds at scale may require a formal agreement with TikTok
- The embed player and oEmbed endpoints are broadly used by commercial parties in practice, but this creates TOS exposure

---

## 5. Third-Party oEmbed Providers

Several third-party services wrap TikTok's oEmbed for enhanced features:

| Provider | What It Adds | Notes |
|----------|-------------|-------|
| **Embedly** | Richer embed handling across 300+ providers | Paid SaaS; normalizes TikTok with other platforms |
| **Iframely** | Enhanced embed with fallback handling | Freemium; TikTok support confirmed |
| **EmbedSocial** | Automated video feeds, UGC walls, shoppable widgets | Paid; aggregates TikTok feeds |
| **WordPress oEmbed** | Built-in TikTok URL recognition | Free; no plugins needed for single embeds |

---

## 6. AMP Integration

TikTok has a first-party AMP component (`<amp-tiktok>`) for Accelerated Mobile Pages:

```html
<amp-tiktok
  width="325"
  height="572"
  data-video-id="6718335390845095173"
  data-lang="en"
  data-cite="https://www.tiktok.com/oembed?url=...">
</amp-tiktok>
```

The `data-cite` attribute points to the oEmbed URL, which AMP uses to fetch the thumbnail.

---

## 7. Data Extractable at Zero Cost / Zero Auth

Summary of what can be obtained via oEmbed/embed without any API credentials:

| Data Point | Method | Notes |
|------------|--------|-------|
| Video caption/title | oEmbed JSON `title` field | Direct |
| Creator username | oEmbed JSON `author_name` field | Direct |
| Creator profile URL | oEmbed JSON `author_url` field | Direct → extract username |
| Video thumbnail URL | oEmbed JSON `thumbnail_url` field | Direct; CDN URL |
| Video ID | Parse from `author_url` or `html` field | Parse `data-video-id` attribute |
| Follower count | Profile embed rendered DOM | Requires browser render; not in JSON |
| Following count | Profile embed rendered DOM | Requires browser render |
| Total likes | Profile embed rendered DOM | Requires browser render |
| Recent 10 videos | Profile embed rendered DOM | Requires browser render |

**Not accessible via any embed/oEmbed method**: view count, like count, comment count, share count, hashtags, sounds, audience demographics, posting date, engagement rate.

---

## 8. Cheerful Applicability

### Use Cases

| Workflow | oEmbed/Embed Use | Value |
|----------|-----------------|-------|
| **Creator discovery** | Low — only captures username + profile URL from video URL; no discovery search | Minimal |
| **Creator enrichment** | Low-Medium — zero-auth thumbnail + username resolution; rendered profile shows follower/likes but requires headless browser | Use as fallback only |
| **Content embedding** | High — display creator videos in Cheerful UI without API auth; use Embed Player for custom branded player | Direct use |
| **Campaign content preview** | High — Embed Player with postMessage control for custom campaign content review UI | Direct use |
| **Content tracking** | None — no metrics accessible via embed | Not applicable |

### Key Opportunities

1. **Zero-auth creator profile card**: Use oEmbed API to resolve any TikTok video URL → extract creator username → then fetch oEmbed for creator profile page to get follower/like counts (requires headless browser render, but no credentials)

2. **Embedded content review in campaign UI**: Use `https://www.tiktok.com/player/v1/{video_id}` in Cheerful's campaign dashboard to let brand clients watch creator content directly without leaving the app. Full postMessage control (play/pause/seek) enables a polished review experience.

3. **Thumbnail prefetch for creator cards**: When building creator profiles in the discovery UI, use oEmbed to fetch thumbnail URLs without spending API quota.

4. **Video ID extraction**: Parse `data-video-id` from oEmbed `html` field to get numeric video IDs needed for other API calls.

### Integration Architecture

```python
# Example: zero-auth creator profile resolution
import httpx

def get_creator_from_tiktok_url(video_url: str) -> dict:
    """Resolve any TikTok video URL to creator metadata via oEmbed."""
    resp = httpx.get(
        "https://www.tiktok.com/oembed",
        params={"url": video_url}
    )
    data = resp.json()
    return {
        "username": data["author_name"],
        "profile_url": data["author_url"],
        "video_title": data["title"],
        "thumbnail_url": data["thumbnail_url"],
    }
```

### Limitations for Cheerful

- **No engagement metrics**: Cannot get views, likes, comments from oEmbed — need Display API (user-auth), Research API (academic-gated), or third-party services
- **No discovery**: Cannot search for creators via embed/oEmbed; need other APIs or Apify
- **Headless render requirement**: Follower/like counts from profile embed require browser rendering (Playwright/Puppeteer), adding operational complexity
- **Commercial TOS risk**: At scale, using oEmbed commercially without a TikTok agreement creates exposure (low enforcement risk in practice, but non-zero)

---

## Summary

| Property | Value |
|----------|-------|
| Authentication required | None |
| App review required | None |
| Rate limits (documented) | None (undocumented IP throttling likely) |
| Data access | Caption, username, profile URL, thumbnail, rendered follower/like counts |
| Use for creator discovery | No |
| Use for content embedding | Yes — ideal zero-cost solution |
| Use for metrics tracking | No |
| TOS for commercial use | Requires express TikTok consent (often ignored in practice) |
| Regional restrictions | None documented; CN may use different player |
