# YouTube — Jeepney/Bus Route Documentation Videos & Commuter Vlogs

**Aspect**: YouTube — jeepney/bus route documentation videos, commuter vlogs with route info
**Analyzed**: 2026-02-28
**Method**: Web search for YouTube channels, commuter vlogs, and transit documentation videos; supplemented by blog cross-references

---

## Summary

YouTube is a **low-value source** for structured GTFS-ready route data. The platform hosts route-adjacent content (news coverage, commute tutorials, vlogs), but data is locked in video format with no machine-readable stop coordinates, route shapes, or scheduled times. Web searches consistently fail to surface specific video content with route tables. No GTFS-extractable data was found directly from YouTube.

However, YouTube serves an important **validation role**: videos document real-world commuting conditions, terminus behavior, and informal route behavior not captured in official databases.

---

## Channel Landscape

### Official/Government Channels (Likely Present, Not Verified)

| Channel | Content Type | Route Data Value |
|---------|-------------|-----------------|
| LTFRB Official (@LTFRBofficial) | Policy announcements, modernization updates, franchise news | Low — policy, no route tables |
| DOTr Philippines | Infrastructure announcements, EDSA Carousel openings | Low — no route geometry |
| GMA News Online | PUV phaseout coverage, strikes, route rationalization news | Low — news, no routes |
| ABS-CBN News | Similar PUVMP coverage | Low |
| Rappler | Transit reform reporting, EDSA Carousel | Low |
| CNN Philippines | Bus/jeepney modernization | Low |

### Community/Vlogger Content (Anecdotal)

Based on web search mentions, Filipino commuter vlog content exists on YouTube but is diffuse and channel-specific:

- **"How to commute" tutorial videos** — typically cover how to board a jeepney, fare payment norms, signaling stops; almost never include route-level data (stops with GPS, schedules)
- **"Commute challenge" vlogs** — commuters document specific OD trips but rarely name all intermediate stops
- **EDSA Carousel reviews** — several videos reportedly review the EDSA Busway experience; stop names mentioned verbally but not as structured data
- **Route-specific ride-along videos** — very rare; search queries for "end to end jeepney route vlog" returned zero indexed results

Search terms attempted that returned no usable YouTube-specific results:
- `"commute vlog" Metro Manila YouTube 2024 jeepney bus EDSA`
- `"jeepney route" Philippines vlog documentary site:youtube.com`
- `"route vlog" Metro Manila YouTube 2024 jeepney bus EDSA`
- `"para sa commuter" Metro Manila jeepney bus route video`

---

## Content Types & Route Data Quality

### Type 1: News Coverage of PUVMP (2023–2024)
- **Content**: LTFRB crackdowns, phaseout deadlines, operator protests, modernization progress
- **Route data**: None extractable; mentions general statistics only
- **Key stats mentioned**: 78.33% nationwide consolidation (April 2024), 96% active jeepney consolidation in NCR, ~7,019 consolidated routes nationally

### Type 2: Commute Tutorial Vlogs
- **Content**: How to board jeepney/bus, pay fare, signal stop
- **Route data**: Fare amounts sometimes mentioned (₱13–15 jeepney minimum, ₱12 bus minimum)
- **Specific routes named**: Occasionally (Cubao–Divisoria, Baclaran–Quiapo mentioned in search results)
- **Value for GTFS**: Very low; no coordinates, no stop lists

### Type 3: Destination-Specific Guides ("How to Commute to X")
- **Content**: Step-by-step for specific destinations; cross-reference with blogs
- **Route data**: Terminal names, transfer points, fare estimates
- **Examples found via blog cross-reference**:
  - SM North EDSA → MOA: MRT-3 to Taft Ave + jeep to MOA
  - Katipunan → PGH: LRT-2 Katipunan → Recto → LRT-1 Pedro Gil
  - Eastwood → Tambo: Jeep to Cubao → bus toward Baclaran/Coastal
  - Paranaque → Katarungan Village: Bus to Starmall Alabang → jeepney

### Type 4: P2P Bus Reviews
- **Content**: Premium P2P service documentation (Robinson's Novaliches → Park Square Makati, fare ₱120)
- **Route data**: Endpoints and some fare data; terminal addresses
- **Value**: Moderate — confirms P2P route endpoints already in other sources

---

## Route Data Surfaced (Not Directly YouTube-Sourced)

These routes were found in blog sources that reference commuter video content:

| Route Type | Route | Mode | Source Context |
|-----------|-------|------|---------------|
| Feeder | SM North EDSA → MOA | MRT-3 + jeep | Manila Commuter Blog |
| Feeder | Katipunan Ave → PGH | LRT-2 + LRT-1 | Manila Commuter Blog |
| City | Eastwood → Baclaran | Jeep + bus | Manila Commuter Blog |
| P2P | Robinson's Novaliches → Park Square Makati | P2P bus, ₱120 | Manila Commuter Blog |
| City | Alabang → Festival Mall | Jeepney "Alabang South Station" | Philippine Primer |
| City | EDSA/Shaw → E. Rodriguez (T276) | Modern jeepney | PNA article |
| City | EDSA/Shaw → E. Rodriguez/Ortigas Ave (T277) | Modern jeepney | PNA article |
| City | EDSA/Shaw → E.R. (T278) | Modern jeepney | PNA article (partial) |

---

## Assessment: Value for GTFS

| Dimension | Score | Notes |
|-----------|-------|-------|
| Route names/endpoints | Low | Occasional mentions, not systematic |
| Stop names | Very Low | Rarely named in video descriptions |
| Geometry (shapes) | None | Videos don't contain coordinates |
| Fare data | Low | Sometimes mentioned, often outdated |
| Frequency data | None | Not addressed in commute vlogs |
| Cross-validation utility | Medium | Can confirm real-world operation of specific routes |
| Coverage breadth | Very Low | <5% of known routes covered by any indexed content |

**Conclusion**: YouTube provides **zero extractable GTFS data** at this time. It may be useful for **manual validation** of specific contested routes (e.g., verifying that a route is actively operating by finding a vlog that rides it), but this requires direct video review, not web scraping.

---

## Recommended Use in This Project

1. **Skip YouTube as a primary data source** — no structured route data can be extracted via web search
2. **Use for validation only** — if a specific route is disputed between sources, search YouTube for ride-along videos to confirm real-world operation
3. **LTFRB Official YouTube** — may have recorded public hearings where route lists are presented on slides; worth checking manually for specific contested routes
4. **News channel archives** — GMA/ABS-CBN coverage of EDSA Carousel opening (2020–2021) may show full stop lists on screen; not extractable programmatically

---

## Data Quality

- **Confidence**: N/A (no route data extracted)
- **Currency**: 2024–2025 based on search summaries
- **Completeness**: Very low — YouTube not a viable systematic source
- **Cross-reference value**: Low

---

## Sources Consulted

- Web searches: multiple queries for YouTube commute vlog content, returning no direct video results
- [The Manila Commuter Blog](http://themanilacommuter.blogspot.com/) — cross-referenced blog that references commuter video content
- [Philippine News Agency — LTFRB 16 new routes](https://www.pna.gov.ph/articles/1121381) — partial route list (T276–T278) surfaced via search
- [More Fun with Juan — Bus Routes](https://www.morefunwithjuan.com/2022/06/bus-routes-in-metro-manila.html) — blog with route data, no YouTube embeds found
- [Philippine Primer — South Metro commute guide](https://primer.com.ph/tips-guides/2015/05/11/how-to-commute-in-the-south-of-metro-manila/) — destination guides cross-referencing commuter community knowledge
