# TikTok Live API

## Summary

TikTok does **not provide a public official Live API** for third-party developers. Live stream capabilities are gated behind proprietary infrastructure, partnership programs, and Live Agency relationships. The official developer platform offers no live-stream-specific endpoints. Real-time live event data (comments, gifts, viewer counts, battles) is accessible only via unofficial reverse-engineered libraries that connect to TikTok's internal Webcast push service (WebSocket). Post-live analytics are partially accessible via the Display API for creators who have granted OAuth authorization. Live commerce integration (product tagging in streams) is handled within TikTok Shop's ecosystem, not through a Live-specific API. **For Cheerful, this means live stream tracking of influencer campaigns is constrained to unofficial libraries or third-party data providers, with no official sanctioned path.**

---

## API Surface 1: Official RTMP Streaming (Creator-facing, not developer API)

### Purpose
Allow creators/brands to stream to TikTok from external tools (OBS, StreamYard, Restream) using standard RTMP protocol.

### Authentication / Access Requirements
- **Account eligibility**: Minimum ~1,000 followers in most regions; some regions require 25,000+ or agency enrollment
- **Age**: 18+ to go live and receive gifts (varies by region)
- **Access path**: TikTok in-app "Cast on PC/Mac" option, or via Live Agency sponsorship
- **No developer API**: RTMP credentials (server URL + stream key) are provided through the TikTok app UI, not via developer API
- **Key rotation**: Stream key is **session-specific**, regenerated each live session — not permanently queryable

### RTMP Details
```
Server URL (unofficial, observed):  rtmp://push-rtmp-l1-mus.pstatp.com/hudong/
Stream Key: stream-{streamId}?wsSecret=...&wsTime=...
```
⚠️ **Warning**: The RTMP endpoint format above is reverse-engineered from unofficial sources. TikTok does not publish official RTMP URLs.

### TikTok's Own Tool: TikTok LIVE Studio
- Official proprietary streaming app (Windows, Mac)
- Direct integration with TikTok Live Producer dashboard
- Reportedly favored by TikTok's algorithm vs. third-party RTMP
- No developer API surface — desktop app only

### Approved Third-Party RTMP Platforms (require TikTok approval)
| Platform | Notes |
|----------|-------|
| StreamYard | Requires custom RTMP access from TikTok; not universally available |
| Restream | Access not guaranteed even if live-eligible; may need to apply separately |
| OneStream Live | Multistreaming support; requires TikTok RTMP credentials |

### Data Accessible via RTMP Path
- **None programmatically** — RTMP is a one-way write protocol (video in, no data out)
- Live producer dashboard shows viewer count and chat, but these are not API-accessible

---

## API Surface 2: Real-Time Live Event Data (Unofficial — Reverse-Engineered)

### Overview
TikTok broadcasts live stream events over an internal WebSocket protocol called the **Webcast push service**. Multiple open-source libraries have reverse-engineered this service to expose real-time event streams without requiring authentication (public streams only).

### Libraries

#### TikTok-Live-Connector (Node.js)
- **Repo**: https://github.com/zerodytrash/TikTok-Live-Connector
- **Auth**: No credentials required for public streams; unique `@username` of broadcaster
- **Method**: WebSocket connection to TikTok's internal Webcast push service

**Event types available**:
| Event | Description |
|-------|-------------|
| `chat` | Chat comments from viewers |
| `gift` | Gifts sent to streamer (with extended gift info: name, coin cost, images) |
| `member` | New members joining the stream |
| `subscribe` | Subscription events |
| `roomUser` | Current viewer count updates |
| `follow` | Follow events triggered during stream |
| `share` | Share events |
| `questionNew` | Q&A submissions |
| `like` | Like events |
| `battle` | Link Mic battle events between streamers |

**Room info available** via `fetchRoomInfo()`:
- Streamer profile info
- Room status (live/ended)
- Viewer count
- Room ID

#### TikTokLive (Python)
- **Repo**: https://github.com/isaackogan/TikTokLive
- **PyPI**: https://pypi.org/project/TikTokLive/
- **Auth**: `unique_id` (broadcaster's @username); optional API key for rate limit increases

**Additional events beyond Node.js library**:
| Event | Description |
|-------|-------------|
| `ConnectEvent` | WebSocket connection initiated |
| `DisconnectEvent` | Connection closed |
| `LiveEndEvent` | Stream ended |
| `LivePauseEvent` / `LiveUnpauseEvent` | Stream pause state |
| `BarrageEvent` | Burst of likes/engagement |
| `PollEvent` | Live polls |
| `SuperFanEvent` | Super fan designation events |
| `RoomEvent` | Broadcast messages to all viewers |
| `EmoteChatEvent` | Emote-based chat |
| `EnvelopeEvent` | Lucky envelope events |
| `RankUpdateEvent` | Creator/viewer rank changes |
| 100+ proto events | Full Protobuf event coverage |

**Client attributes**:
- `room_id` — Live room identifier
- `room_info` — Full room metadata
- `gift_info` — Gift catalog with coin values
- `connected` — Connection status boolean
- `available_gifts` — Full list of purchasable gifts with pricing

### Risk Assessment for Unofficial Libraries
| Risk | Level | Notes |
|------|-------|-------|
| TOS violation | **HIGH** | Reverse-engineering violates TikTok ToS Section 2; TikTok has pursued legal action against scrapers |
| Account ban risk | Medium | Read-only for public streams; lower risk than write operations |
| API breakage | High | TikTok changes internal endpoints without notice; library maintainers play cat-and-mouse |
| Data reliability | Medium | No delivery guarantees; events may be missed during reconnects |
| Commercial use | HIGH | Using scraped data for commercial purposes (e.g., Cheerful campaigns) is explicitly prohibited |

---

## API Surface 3: Third-Party Live Data Provider

### Euler Stream
- **URL**: https://www.eulerstream.com/
- **Description**: Commercial API wrapping TikTok Live data access; claims enterprise-grade reliability
- **Capabilities**: Real-time LIVE data, WebSocket connections, Discord/Webhook integrations, TikTok LIVE notifications, analytics
- **Scale**: Claims "millions of connections daily"
- **Pricing**: Free tier exists; paid tiers not publicly listed (contact required)
- **Compliance posture**: Operates in same gray zone as open-source libraries

---

## API Surface 4: Post-Live Analytics (Official — via Display API)

### What's Available After a Live Stream Ends
Post-live analytics are accessible via the **Display API** for authorized creators. Key data:

| Metric | Available | Notes |
|--------|-----------|-------|
| Video views (if live recording posted) | ✅ | Live recordings posted as videos are trackable |
| Likes, comments, shares on recording | ✅ | Standard video metrics |
| Peak viewer count | ❌ | Not exposed via API |
| Gift revenue | ❌ | Not exposed via any public API |
| Live duration | ❌ | Not exposed |
| Chat log | ❌ | Not retained or exposed |
| Audience demographics during live | ❌ | Not exposed |

**Data freshness**: 24–48 hour lag for video-level analytics after posting.

**Auth**: OAuth 2.0 with creator authorization; requires `video.list` scope.

**Endpoint**:
```
GET https://open.tiktokapis.com/v2/video/list/
Authorization: Bearer {user_access_token}
```

### TikTok Analytics API (Display API extension)
For creators who authorized your app, video-level metrics include:
- Total views, likes, comments, shares
- Average watch time, total watch time
- Traffic sources

Account-level metrics (for authorized creators):
- Follower growth
- Profile views
- Audience demographics (age, gender, top regions)

**Limitation**: Revenue data (Creator Fund, Gifts, LIVE subscriptions) is **never exposed via API**.

---

## API Surface 5: Live Commerce Integration (TikTok Shop)

### How Live Commerce Works
Sellers/creators can tag TikTok Shop products during live streams. Viewers can purchase directly from the stream. This is a TikTok Shop feature, not a standalone Live API.

### API Access for Live Commerce
Managed via the **TikTok Shop Open API** (see `tiktok-shop-api.md`):

| Capability | API Available | Notes |
|-----------|--------------|-------|
| Tag products for live | ✅ | Via TikTok Shop seller tools |
| Live-specific product catalog | ✅ | Products can be prepped for live |
| Real-time purchase events during live | ❌ | Order webhooks fire after purchase completes, not live |
| Live sales analytics | ✅ (delayed) | Post-live via Shop reporting API |
| Affiliate creator live tagging | ✅ | Creators with affiliate links can tag products |

**Performance benchmark**: TikTok claims live stream conversion rates up to 10× higher than traditional e-commerce.

**2024–2025 milestones**:
- 2024 Black Friday/Cyber Monday: $100M+ in US live commerce sales
- TikTok Shop expanded to France, Germany, Italy in March 2025
- 5% standard seller commission on transactions

### TikTok Shop Affiliate API (launched 2024)
Relevant for creator live streams:
- Developers can build tools for creator-brand affiliate relationships
- **Register**: TikTok Shop Partner Center as Affiliate app developer
- **Discord**: Official developer community with weekly webinar sessions

---

## Capability Matrix

| Capability | Official API | Unofficial Library | Third-Party (Euler) |
|-----------|-------------|-------------------|---------------------|
| RTMP streaming (publish) | ✅ (via app UI, not API) | ⚠️ (reverse-eng) | ❌ |
| Real-time chat/comments | ❌ | ✅ | ✅ |
| Real-time gift events | ❌ | ✅ | ✅ |
| Real-time viewer count | ❌ | ✅ | ✅ |
| Live status check (is creator live?) | ❌ | ✅ | ✅ |
| Post-live video metrics | ✅ (Display API) | ⚠️ | ✅ |
| Gift revenue data | ❌ | ❌ | ❌ |
| Audience demographics during live | ❌ | ❌ | ❌ |
| Live commerce product tagging | ✅ (Shop API) | ❌ | ❌ |
| Live sales orders | ✅ (Shop webhooks) | ❌ | ❌ |
| Live room metadata | ❌ | ✅ | ✅ |

---

## Access & Eligibility Requirements

### Creator-side LIVE access
| Requirement | Threshold |
|-------------|-----------|
| Minimum followers | ~1,000 (varies by region) |
| Minimum age | 18+ (to go live and receive gifts) |
| Account standing | No recent guideline violations |
| RTMP access | Via app or Live Agency sponsorship |

### Developer-side (no official Live API exists)
- No dedicated Live API product on developers.tiktok.com
- Live data only accessible via Display API (post-live recording analytics) with standard OAuth
- No application process for live-specific permissions — because no such permissions exist publicly

### Live Commerce / Shop API
- Requires TikTok Shop seller or affiliate app approval
- See `tiktok-shop-api.md` for full requirements

---

## Regional Availability

| Feature | US | UK | EU | SEA | Notes |
|---------|----|----|----|----|-------|
| LIVE access (general) | ✅ | ✅ | ✅ | ✅ | Follower threshold may vary |
| Gift sending/receiving | ✅ | ✅ | ✅ | ✅ | Age-gated by local law |
| Live commerce (TikTok Shop) | ✅ | ✅ | ✅ (FR/DE/IT added Mar 2025) | ✅ | US, UK most mature |
| RTMP (third-party) | ✅ | ✅ | ✅ | ✅ | Requires follower threshold |

---

## Cheerful Applicability Assessment

### Relevance to Cheerful Workflows

| Cheerful Workflow | Live API Relevance | Notes |
|------------------|--------------------|-------|
| Creator discovery | Low | Live metrics (gift count, viewer count) could signal engagement quality — but no official data path |
| Creator enrichment | Low–Medium | Checking "is this creator doing lives?" possible via unofficial libs; live frequency as enrichment signal |
| Outreach | None | Live event is ephemeral; no outreach trigger from live events via official API |
| Content tracking | Medium | If campaign creator goes live, tracking gift/view metrics is unofficial only; post-live recording trackable via Display API |
| Campaign management | Low | Live commerce campaigns (Shop affiliate) are a distinct workflow from influencer content campaigns |
| Reporting | Low | Post-live video analytics via Display API for recording; live-specific KPIs (peak viewers, gifts) not measurable |

### Key Findings for Cheerful
1. **No official path to live stream monitoring** — If Cheerful wants to track influencer live events in real-time, it must use unofficial libraries (TikTok-Live-Connector, TikTokLive) with associated legal/reliability risks.
2. **Post-live recordings are trackable** — If creators post their live session as a video, standard Display API metrics apply. Cheerful should handle this case in content tracking.
3. **Live commerce is a separate funnel** — TikTok Shop affiliate tracking during lives is a different product line from influencer content campaigns. If Cheerful extends to commerce campaigns, this is a distinct integration path via Shop API.
4. **Gift/revenue data is a hard gap** — Gift income from live streams is never exposed via any API. Cannot measure this aspect of creator monetization.
5. **Quick win**: Use unofficial library (TikTokLive Python or TikTok-Live-Connector) as an opt-in enrichment signal to check whether a creator is "active on lives" — reduces risk by not using it for commercial attribution.

---

## Key Resources

| Resource | URL |
|----------|-----|
| TikTok Developer Portal | https://developers.tiktok.com/ |
| TikTok LIVE Studio (creator app) | https://www.tiktok.com/live/studio/ |
| LIVE Access Application (creator) | https://www.tiktok.com/live/studio/help/article/Before-you-go-LIVE/Apply-for-LIVE-access |
| TikTok-Live-Connector (Node.js) | https://github.com/zerodytrash/TikTok-Live-Connector |
| TikTokLive (Python) | https://github.com/isaackogan/TikTokLive |
| Euler Stream (commercial) | https://www.eulerstream.com/ |
| TikTok Shop Partner Center | https://partner.tiktokshop.com/ |
| TikTok Shop Affiliate API Blog | https://developers.tiktok.com/blog/2024-tiktok-shop-affiliate-apis-launch-developer-opportunity |
