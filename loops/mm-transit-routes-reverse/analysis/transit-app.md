# Transit App — Manila Coverage Assessment

**Aspect**: Transit app — Manila coverage, real-time data availability
**Date analyzed**: 2026-02-26
**Source type**: Transit platform
**Data quality**: N/A (no Manila coverage)

---

## Summary

**Transit app (transitapp.com) has zero coverage in Metro Manila or anywhere in the Philippines.** The app operates in 1,095 cities across 33 countries, with coverage concentrated exclusively in North America, Europe, Australia, and New Zealand. There is no Southeast Asian city in their coverage footprint.

---

## Transit App Global Coverage

Transit app claims coverage in **1,095 cities across 33 countries** (as of Feb 2026). Countries include:

| Region | Countries |
|--------|-----------|
| North America | United States (359 cities), Canada (129 cities), Mexico |
| Europe | France (370 cities), UK (53 cities), Germany, Spain, Italy, Netherlands, Sweden, Norway, Poland, Switzerland, Romania, Austria, Czechia, Portugal, Belgium, Hungary, Ukraine, Luxembourg, Monaco, Iceland, Albania, Bulgaria, Ireland |
| Oceania | Australia (27 cities), New Zealand |
| Other | Lebanon, UAE, Argentina, Chile, Bermuda |

**Asia coverage: none.** No cities in Philippines, Thailand, Vietnam, Indonesia, Singapore, Malaysia, India, Japan, or China are supported.

**Conclusion**: Transit app is not a data source for Metro Manila GTFS compilation. No routes to extract.

---

## Transit App Technical Profile

For context on why this app was investigated:
- Transit app is a North America-centric transit planner that aggregates GTFS feeds from city agencies
- Strong real-time data where agencies publish GTFS-RT (General Transit Feed Specification – Realtime)
- Would require official LTFRB/DOTr GTFS-RT publication to support Manila — which does not exist
- Their data model depends on official open data portals; Manila's informal transport ecosystem is incompatible

---

## Adjacent Discoveries: Other Apps with Manila Coverage

During research, two previously untracked apps with meaningful Manila coverage were identified:

### Chalo (chalo.com)
- **Origin**: Indian live bus tracking app, expanded to Metro Manila
- **Coverage**: Metro Manila is one of their listed cities alongside Bangkok, Mumbai, Chennai, etc.
- **Features**: Real-time GPS tracking of buses and jeepneys; live arrival times; mobile ticketing
- **Data type**: Live GPS positions (useful for stop inference), not a static route database
- **Data quality**: Unknown — partnership with LCTSL (Las Vegas? or Philippine operator) implied by URL `chalo.com/metromanila`
- **Modes**: "Bus and Jeepney" per their landing page
- **Notes**: Available on iOS; may have route data underlying the tracking system; API access unknown
- **Source**: https://chalo.com/metromanila

### Komyut (komyut-app.vercel.app)
- **Origin**: Filipino-built AI-powered route planner
- **Open source**: GitHub repo at `github.com/vrymel/komyut` — pathfinding + jeepney route listing
- **Coverage**: Metro Manila jeepney, bus, MRT/LRT, UV Express
- **Data model**: Route database stored in PostgreSQL (from GitHub repo description); uses pathfinding algorithm
- **Data provenance**: Route data source not documented publicly; likely derived from community/LTFRB listings
- **Potential value**: If GitHub repo contains route data in a structured format, may be extractable
- **Notes**: Vercel deployment suggests this is a live, maintained project as of 2026

### Sakay.ph Tracker (tracker.sakay.ph)
- **Previously analyzed**: Sakay.ph covered in iteration #12; the real-time tracker was not separately assessed
- **Features**: Real-time GPS positions of buses (EDSA Carousel) and jeepneys
- **Partnership**: LTFRB official partnership for jeepney GPS tracking
- **Data value**: GPS telemetry data → infer actual stop locations and route paths from real vehicle positions
- **Access**: Web-based, no documented API; tracker-old.sakay.ph also exists

---

## Data Quality Assessment

| Source | Manila Coverage | Route Data | Real-Time | GTFS Export |
|--------|----------------|-----------|-----------|-------------|
| Transit app | **None** | None | N/A | N/A |
| Chalo | Yes (buses + jeepneys) | Unknown quantity | Yes (GPS) | No |
| Komyut | Yes (jeepney, bus, rail) | Structured DB (private) | No | Unknown |
| Sakay.ph Tracker | Yes (EDSA + jeepney) | Routes implicit | Yes (GPS) | No |

---

## Implications for GTFS Build

Transit app contributes zero routes. The absence of any Asia coverage (despite 1,095 global cities) confirms that Manila's informal transport structure — no official GTFS published, no agency open data portal — is the primary barrier to international app integration.

The Chalo discovery is potentially significant: if they have a route database underlying their live tracking, that data may cover modes (jeepneys) that static GTFS sources miss. Investigation warranted.

---

## Routes Extracted

**0 routes** — Transit app has no Manila coverage.

See `raw/transit-app-routes.json` for empty dataset with source metadata.
