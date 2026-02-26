# PinoyCommute.com — Analysis

**Source type**: Consumer-facing OD-pair commute guide website
**Retrieved**: 2026-02-26
**URL**: https://www.pinoycommute.com/
**Extractable routes for GTFS**: 0
**Verdict**: NOT a viable GTFS data source

---

## What PinoyCommute.com Is

PinoyCommute.com is an SEO content site that generates narrative commute guides for specific origin-to-destination pairs. Each page describes how to get from point A to point B using public transit in the Philippines. It is **not** a structured route database.

**URL pattern**: `/routes/{origin}-to-{destination}-via-{mode}-route`

Example pages indexed:
- `/routes/katipunan-to-antipolo-via-lrt-line-2-route`
- `/routes/shaw-boulevard-to-buendia-via-mrt-line-3-route`
- `/routes/park-n-ride-lawton-to-dasmarinas-paliparan-site`
- `/routes/nasugbu-to-batangas-city`
- `/routes/cebu-city-lapu-lapu-city-metro-ferry-start-to-cebu-city-lapu-lapu-city-metro-ferry-end`

The breadth of coverage (Metro Manila + Cebu + provincial routes) and the OD-pair article format strongly indicate **AI-generated or template-driven content**, not manually curated route data.

---

## Data Access

Direct web scraping was blocked by **HTTP 429 (Too Many Requests)** on every fetch attempt, including:
- Homepage
- Sitemap.xml
- Individual route pages
- Support page

This aggressive rate-limiting is consistent with a site protecting SEO content from automated scraping. Google cache was also inaccessible (JavaScript-rendered, no static content in cache).

---

## Content Structure (Inferred from Search Snippets)

Based on meta descriptions and search result snippets, each route page contains:

1. **Narrative step-by-step directions** (e.g., "Take the MRT-3 from Shaw Blvd Station to Buendia Station")
2. **Generic fare information** (standard LTFRB fare matrices, not route-specific)
3. **Estimated travel time** (broad ranges: "30–60 minutes")
4. **General terminal names** (without GPS coordinates or stop codes)
5. **"Pro tips"** and safety advice

What it does **NOT** contain:
- LTFRB route codes (T-codes, N-codes, C-codes)
- Stop coordinates (lat/lon)
- Route shapes or geometry
- Frequency/schedule data
- Machine-readable structured data of any kind
- GTFS-compatible output

---

## Fare Data (from site meta / search descriptions)

The site claims "current 2025 fares" but this appears to be the standard LTFRB fare matrix:
- Traditional jeepney: ₱13 base + ₱1.80/km (Note: actual current rate is ₱13 base + ₱1.80/km, per MC 2023-038)
- Modern/electric jeepney: ₱14 base + ₱2.20/km (Note: actual is ₱15 base; site may have outdated figures)
- Ordinary city bus: ₱13 base + ₱2.25/km
- AC city bus: ₱15 base + ₱2.65/km
- Student/senior/PWD: 20% discount

These are **generic rates, not route-specific fares**. They duplicate data already captured in the LTFRB fare matrices analysis.

---

## Comparison to Similar Sites

| Characteristic | PinoyCommute.com | Komyut AI (komyut-app.vercel.app) |
|---|---|---|
| Format | OD-pair articles | Chat interface |
| Coverage | Metro Manila + provinces + Cebu | Metro Manila |
| Data type | Narrative steps | Conversational answers |
| Route DB | None | None |
| GTFS extractable | No | No |
| Verdict | SEO content farm | LLM chatbot |

Both are consumer routing helpers that synthesize general transit knowledge, not primary route data sources.

---

## Reliability Assessment

- **No independent user reviews** found on Reddit, Facebook, App Store, or Google Reviews
- **No media coverage** specifically about PinoyCommute.com
- **No app** — web-only presence
- **No "About" or methodology page** found in search results
- **One data discrepancy found**: site lists modern jeepney base fare as ₱14 while actual LTFRB rate is ₱15 (per MC 2023-038 effective Oct 8, 2023)
- The Park N' Ride Lawton page has a factual error: the terminal referenced (Park N' Ride) was not operational as of 2025

---

## Assessment for GTFS Project

| Criterion | Score |
|---|---|
| Route coverage | N/A (no structured route list) |
| Stop data | None |
| Geometry | None |
| Fare accuracy | Low (generic matrix, ≥1 error found) |
| Data freshness | Claims 2025, but errors found |
| Machine-readable | No |
| Overall utility | **None** |

**Conclusion**: PinoyCommute.com provides zero extractable data for GTFS construction. It is a content site, not a transit data source. Do not use as a primary or secondary source for any route, stop, or geometry data.

---

## New Data Sources Discovered

None. PinoyCommute.com did not reference or link to any primary data sources that haven't already been identified.
