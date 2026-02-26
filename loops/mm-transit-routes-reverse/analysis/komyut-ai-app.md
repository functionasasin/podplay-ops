# Komyut AI App (komyut-app.vercel.app / komyut.ph)

**Aspect**: Komyut AI app — separate AI-powered Metro Manila transit planner
**Date analyzed**: 2026-02-26
**Source type**: Transit App & Platform Data
**Data extractability**: VERY LOW — LLM-generated responses, no structured data export

---

## Summary

Komyut AI app (`komyut-app.vercel.app`, production domain `komyut.ph`) is an AI-powered transit route planner for the Philippines, primarily targeting Metro Manila. It is **entirely distinct** from `github.com/vrymel/komyut`, which covers Cagayan de Oro. The Komyut AI app appears to use a large language model (LLM) to generate route recommendations rather than a structured GTFS database, making it a near-zero source for extractable structured route data.

---

## Key Findings

### Identity & Branding
- **Production domain**: `komyut.ph` (live; sitemap-confirmed; TLS connection issues during fetch)
- **Dev deployment**: `komyut-app.vercel.app` (accessible)
- **ICP MVP version**: `236jx-viaaa-aaaae-acpqq-cai.icp0.io` — an early MVP deployed on the Internet Computer Protocol (Dfinity ICP) blockchain, suggesting the app may have hackathon or Web3 origins
- **Not related to**: `github.com/vrymel/komyut` (CDO-only Elixir project) or the KOMYUT advocacy group (transport rights campaign, APC thesis project)

### Transport Modes Claimed
- Jeepneys
- Buses
- MRT/LRT (all three rail lines)
- UV Express
- Claims "4+ transport modes" and "Metro Manila and beyond"

### Technology Assessment: Likely Pure LLM

The app's marketing copy — "Our AI analyzes traffic patterns and public transport schedules to provide the most efficient routes" — is consistent with an LLM-powered chatbot overlay rather than a structured routing engine. Evidence:

1. **No GTFS data disclosed**: Unlike Sakay.ph (which publishes its GTFS on GitHub), Komyut AI app discloses no data sources, no GTFS files, and no API documentation.
2. **No routing algorithm described**: Structured routing apps (Sakay.ph, Google Maps) describe their underlying algorithms (Dijkstra, OSRM, etc.). Komyut AI only describes "AI analysis."
3. **Landing page shows AI-style output**: Example results show narrative comparisons ("Jeepney → MRT → Bus, 60 min, ₱41") without stop IDs, route codes, or GTFS trip IDs.
4. **No route database or stop list visible**: No stop search, no route index, no route codes (T-prefix, N-prefix, etc.).
5. **Vercel hosting + AI branding**: Consistent with Next.js + LLM API (likely OpenAI GPT-4o, Anthropic Claude, or Google Gemini) pattern common in 2024–2025 AI wrapper apps.
6. **Web3/ICP MVP origin**: ICP (Internet Computer) deployment suggests hackathon-era origins where LLM integration was the primary differentiator.

### Known Route Examples (from landing page)
| Origin | Destination | Route shown | Time | Fare |
|--------|-------------|-------------|------|------|
| SM Mall of Asia, Pasay | Makati CBD | Jeepney → MRT → Bus (3 transfers) | 60 min | ₱41 |
| SM Mall of Asia, Pasay | Makati CBD | Walk → Bus (1 transfer) | 55 min | ₱25 |

These examples are illustrative only — typical SM MOA to Makati route options. No route IDs or stop codes shown.

### Coverage Claims vs. Reality
- **Claimed**: "Metro Manila and beyond", all jeepney/bus/rail/UV Express
- **Likely reality**: LLM knowledge of Manila transit derived from training data (which includes Sakay.ph GTFS, OSM, blog posts, LTFRB announcements). Accuracy for specific routes is unverified and subject to hallucination.
- **No user reviews found**: No Reddit, Twitter/X, or App Store reviews indexed as of 2026-02-26. Extremely low public profile compared to Sakay.ph and Moovit.
- **No mobile app**: Website only (no iOS/Android app found in app stores).

### Data Extractability Assessment
| Criterion | Score | Notes |
|-----------|-------|-------|
| Structured route list | 0/10 | No route index or database exposed |
| Stop coordinates | 0/10 | No stop data disclosed |
| GTFS export | 0/10 | No GTFS files available |
| API access | 0/10 | No public API |
| Route confidence | 1/10 | LLM output may hallucinate specific routes |
| Data currency | N/A | Depends on LLM training cutoff |
| Overall value | 1/10 | Unusable as primary data source |

---

## Data Quality Assessment

**Currency**: Unknown — LLM training data cutoff unknown; likely 2023–2024 at best
**Completeness**: Unknown — LLM may confidently describe non-existent routes
**Accuracy**: Unverified — no independent validation found
**Geometry**: None — no coordinates, no shapes
**Confidence level**: LOW for any route data extracted from this source

---

## Comparison to Other AI Transit Apps

| App | Mode | Data source | GTFS | Manila coverage |
|-----|------|-------------|------|-----------------|
| Sakay.ph | Structured routing | Own GTFS DB | Yes (GitHub) | ~296–349 routes |
| Moovit | Crowdsourced + structured | Proprietary | No export | 888 routes |
| Komyut AI | LLM-generated | Unknown/LLM | No | Claims all modes |
| Google Maps | Structured routing | EACOMM GTFS | Via partner | Rail + ~20 buses |

Komyut AI is the weakest source among these for structured data extraction.

---

## Implications for GTFS Build

**Do not use as primary data source.** The app provides zero extractable structured route data.

Potential **secondary use**: Cross-check LLM knowledge against validated routes in Wave 2 to identify obvious gaps where even an LLM "knows" a route that our structured data doesn't cover — but flag these as low-confidence and requiring human verification.

---

## New Frontier Aspects Discovered

1. **PinoyCommute.com** — surfaced in search results alongside Sakay.ph; claims current 2025 routes, fares, and terminal information for jeepneys, buses, MRT, LRT; appears to be a static/blog-style route guide rather than an app; may have structured route listings worth extracting

---

## Routes Extracted

**0 validated routes extracted.** Raw JSON file contains 0 route entries.

Reason: App is LLM-generated; no route database, stop list, or GTFS data is publicly accessible. Example routes on landing page (MOA→Makati) are illustrative only, not extractable as structured data without verification.
