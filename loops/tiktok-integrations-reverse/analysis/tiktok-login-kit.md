# TikTok Login Kit — Analysis

## Overview

TikTok Login Kit is the OAuth 2.0 foundation for TikTok's developer platform. It is the prerequisite for most TikTok API products — without Login Kit, there is no way to obtain user access tokens. It supports four platforms: **Web**, **iOS**, **Android**, and **Desktop**.

**Status**: Generally Available (GA)
**Authentication Model**: OAuth 2.0 Authorization Code flow (user tokens) + `client_credentials` flow (app-only tokens)
**Official Docs**: https://developers.tiktok.com/doc/login-kit-overview

---

## Auth Architecture

### Token Types

TikTok supports two fundamentally different token types, both issued via the same endpoint:

| Token Type | Grant Type | Prefix | Lifetime | Requires User? | Use Case |
|---|---|---|---|---|---|
| User Access Token | `authorization_code` | `act.` | 24 hours (refreshable) | Yes | Most TikTok APIs — Display, Content Posting, etc. |
| Refresh Token | (from auth code exchange) | — | 365 days | Yes | Refreshing user access tokens |
| Client Access Token | `client_credentials` | `clt.` | 2 hours | No | Research API, Commercial Content API |

### Token Endpoint

```
POST https://open.tiktokapis.com/v2/oauth/token/
Content-Type: application/x-www-form-urlencoded
```

**Authorization code exchange** (user token):
```
client_key=CLIENT_KEY
client_secret=CLIENT_SECRET
code=AUTH_CODE
grant_type=authorization_code
redirect_uri=REDIRECT_URI
```

**Refresh user token**:
```
client_key=CLIENT_KEY
client_secret=CLIENT_SECRET
grant_type=refresh_token
refresh_token=REFRESH_TOKEN
```

**Client credentials** (app-only):
```
client_key=CLIENT_KEY
client_secret=CLIENT_SECRET
grant_type=client_credentials
```

**Token Response** (user token):
```json
{
  "access_token": "act.example...",
  "refresh_token": "rft.example...",
  "open_id": "USER_OPEN_ID",
  "scope": "user.info.basic,video.list",
  "expires_in": 86400,
  "refresh_expires_in": 31536000,
  "token_type": "Bearer"
}
```

**Token Revocation**:
```
POST https://open.tiktokapis.com/v2/oauth/revoke/
```

### Authorization Endpoint

```
https://www.tiktok.com/v2/auth/authorize/
```

**Required query parameters**:
- `client_key` — ⚠️ TikTok non-standard: uses `client_key`, NOT `client_id`
- `scope` — comma-separated list of scopes (e.g., `user.info.basic,video.list`)
- `response_type` — always `code`
- `redirect_uri` — must match registered URI exactly
- `state` — CSRF protection token (recommended)

### User Info Endpoint

```
GET https://open.tiktokapis.com/v2/user/info/?fields=union_id,display_name,avatar_url
Authorization: Bearer {access_token}
```

---

## Scopes Reference

All scopes require TikTok app review approval before they can be requested from users.

### User Info Scopes

| Scope | Fields Accessible | Review Required |
|---|---|---|
| `user.info.basic` | `open_id`, `union_id`, `avatar_url`, `avatar_url_100`, `avatar_large_url`, `display_name` | Default — no extra review |
| `user.info.profile` | `bio_description`, `profile_deep_link`, `is_verified` | Yes |
| `user.info.stats` | `follower_count`, `following_count`, `like_count`, `video_count` | Yes |

> **2024 Breaking Change**: Prior to Feb 29, 2024, `user.info.basic` included profile and stats fields. They were separated into dedicated scopes. Apps not migrated may receive incomplete responses.

### Video Scopes

| Scope | What It Enables | API Product |
|---|---|---|
| `video.list` | Read a user's public videos on TikTok | Display API / Query Videos |
| `video.publish` | Direct-post video to user's TikTok profile | Content Posting API |
| `video.upload` | Upload video as draft (inbox) to user's account | Content Posting API |

### Research Scopes (Client Token, not user token)

| Scope | What It Enables |
|---|---|
| `research.data.basic` | Access public TikTok data for research |
| `research.data.u18eu` | EU users under 18 data (research) |
| `research.data.vra` | Vetted researcher provisioned data |
| `research.adlib.basic` | Public commercial/ad data research |

### Data Portability Scopes

| Scope | What It Enables |
|---|---|
| `portability.activity.single` / `.ongoing` | User activity data export (one-time / recurring) |
| `portability.postsandprofile.single` / `.ongoing` | Posts and profile data export |
| `portability.directmessages.single` / `.ongoing` | Direct message export |
| `portability.all.single` / `.ongoing` | Full user data archive export |

### Local Service Scopes

| Scope | What It Enables |
|---|---|
| `local.product.manage` | Create and manage product listings |
| `local.shop.manage` | Create and manage local shops |
| `local.voucher.manage` | Validate and redeem vouchers |

---

## Platform Support

| Platform | Notes |
|---|---|
| Web | Full support; redirect URI must be `https`, static, <512 chars |
| Desktop | Uses same `https://www.tiktok.com/v2/auth/authorize/` endpoint |
| iOS | App must be live in Apple App Store; Bundle ID required |
| Android | App must be live in Google Play; App signature + package name required |
| QR Code | Supported — user scans QR to authorize (useful for TV/desktop flows) |

Max redirect URIs per app: **10**

---

## App Registration & Review Process

### Requirements for Approval

1. **Custom app name** — displayed on authorization consent screen
2. **Published app** — development/test apps are not approved
3. **Official website** — fully developed, externally accessible; privacy policy and ToS must be visible without navigation
4. **Mobile apps** — must be published in app stores with correct bundle ID/signature
5. **Redirect URI** — must be registered; must be `https` absolute URL
6. **Demo video** — must show working integration in sandbox environment; all selected products/scopes must be demonstrated
7. **URL verification** (for apps created after Sep 9, 2024) — Content Posting API upload URLs must be verified

### Review Timeline

- No guaranteed timeline; typically **3–4 days** for initial review
- Manual process — build review timeline into launch planning
- Post-approval changes also require review
- Violations can result in **permanent ban** of account and business entity

### App States

| State | Meaning |
|---|---|
| In Review | Submitted, pending; no changes allowed |
| Live | Approved and active |
| Not Approved | Rejected with feedback; resubmit after addressing issues |

---

## What Login Kit Unlocks

Login Kit is the prerequisite for all user-context API products:

```
Login Kit (OAuth)
├── Display API (user profile, video list, metrics)
├── Content Posting API (video/photo upload)
├── Data Portability API (user data export)
├── Local Services API (shop/product management)
└── User context for other APIs
```

**Client Credentials** (no user required) unlocks:
```
client_credentials grant
├── Research API
└── Commercial Content API
```

---

## Key Identifiers

| Identifier | Description |
|---|---|
| `open_id` | Per-app unique user ID (changes per app) |
| `union_id` | Cross-app unique user ID (same across apps from same developer) |
| `client_key` | App identifier (TikTok's non-standard name for `client_id`) |
| `client_secret` | App secret |

`union_id` is only available when approved — it requires the `user.info.basic` scope but must be explicitly requested in the `fields` parameter.

---

## Security Considerations

- Store all tokens **server-side only** — never expose to client
- Use `state` parameter for CSRF protection (random alphanumeric string)
- `client_secret` must never be exposed in client-side code
- No notification when tokens expire or are revoked — implement proactive refresh scheduling
- Refresh tokens expire after **365 days** of inactivity

---

## Rate Limits

No explicit rate limits documented for token operations. Rate limits are applied at the individual API product level (Display API, Content Posting API, etc.), not at the auth layer.

---

## Cheerful Applicability

### Relevance: **Critical Foundation**

Login Kit is the entry point for all TikTok user-context integrations. For Cheerful's influencer outreach workflows:

| Workflow | Login Kit Role |
|---|---|
| Creator discovery | User access token needed to call Display API (creator profile, videos) |
| Enrichment | `user.info.profile` + `user.info.stats` scopes provide follower counts, verification status |
| Content tracking | `video.list` scope enables reading creator's public videos |
| Campaign management | Token stored per-creator to poll metrics over time |
| Outreach | Not directly needed (outreach is email/DM-based, not TikTok auth) |

### Integration Pattern

For Cheerful, Login Kit would be used in a **"connect your TikTok" OAuth flow** — either:
1. **Creator connects their account** (creator self-serves, Cheerful stores their `act.` token)
2. **Brand account connects** (brand authorizes Cheerful to act on their behalf)

Alternatively, for enrichment of third-party creators (discovery without their participation), the **Display API via Apify** (no OAuth needed on Cheerful's side) is more appropriate.

### What Must Be Built

```
1. TikTok OAuth callback endpoint (FastAPI)
2. Token storage in Supabase (encrypted at_token, refresh_token per creator/brand)
3. Proactive refresh workflow (Temporal cron — refresh before 24hr expiry)
4. Scope request strategy: user.info.basic + user.info.profile + user.info.stats + video.list
```

---

## Open Questions

- Does Cheerful need creators to self-authorize (OAuth), or only discover them via third-party scraping?
- `union_id` enables cross-app deduplication — important if Cheerful uses multiple TikTok apps
- Regional restrictions: Login Kit itself appears globally available, but some downstream APIs have regional limits
