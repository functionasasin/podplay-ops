# Chalo App — Metro Manila Coverage Analysis

**Source type**: Transit App & Platform Data
**Researched**: 2026-02-26
**Verdict**: Closed platform — no extractable route data

---

## What Is Chalo?

Chalo ("Let's go" in Hindi) is India's largest bus transport technology company, founded in 2014 and headquartered in Navi Mumbai. As of late 2023 it operates in ~65 cities across India, the Philippines, and Peru. It provides:
- Live GPS bus tracking (device-fitted fleet vehicles)
- Mobile ticketing / contactless payment ("Chalo Card")
- Operator dashboard (operator.chalo.com)
- Journey planner with route search

Funding: $143.9M total across 10 rounds, including $45M Series D (May 2023, Avataar Venture Partners).

---

## Metro Manila Presence

Chalo lists Metro Manila as a supported city on:
- `chalo.com/metromanila` (page returns HTTP 403 — inaccessible externally)
- Apple App Store PH listing: both **live bus tracking** and **mobile tickets** listed for Metro Manila
- Google Play Store listing: Metro Manila included in city list

Confirmed transport modes tracked: **buses and jeepneys** (both explicitly mentioned in marketing copy).

Chalo expanded to Manila via acquisition of Shuttl (October 2021), which already had a Southeast Asia footprint (Bangkok presence). Manila was part of Chalo's push into emerging markets alongside Bangkok and Peru.

---

## Data Accessibility Assessment

### What Chalo Tracks (in theory)
- Real-time GPS positions of onboarded fleet vehicles
- Route paths of those vehicles
- Stop locations (derived from live tracking + user-reported data)
- Estimated arrival times per stop

### What Is Publicly Accessible
| Resource | Status |
|---|---|
| `chalo.com/metromanila` | HTTP 403 — blocked |
| Operator portal (`operator.chalo.com`) | Requires login — inaccessible |
| API / GTFS export | No public API documented |
| Route list on website | Not published |
| Stop database | Not published |
| App Store listing | Generic description, no route list |

**Conclusion: Chalo's Manila data is fully proprietary and closed.** Unlike Sakay.ph (which published a GTFS on GitHub) or Moovit (which has a web interface with inspectable routes), Chalo exposes no structured data externally.

---

## Coverage Depth Estimate

No direct evidence of route count is available. Inferred estimates based on indirect signals:

**Likely coverage range: 50–200 routes (medium confidence)**

Reasoning:
- Chalo's model requires GPS hardware physically installed on vehicles, meaning they can only track operators who have agreed to the platform and fitted devices
- Filipino cooperative consolidation (PUVMP) would help — consolidated cooperatives are single entities that can sign agreements with Chalo
- Chalo serves ~15,000 buses across ~22 cities in India (as of late 2023), implying ~680 buses/city average. Manila would likely be well below India city averages given it's a newer market
- User reviews suggest real but patchy coverage: "GPS sometimes shows buses going in the opposite direction"; mixed feedback on arrival accuracy
- The app works for some routes but OTP verification failures prevent many Philippine users from onboarding at all

**What modes are likely tracked**:
- Modern PUJ (e-jeepneys) under PUVMP cooperatives — **most likely**, as modern jeepneys are mandated to have GPS (LTFRB MC 2017-011) and cooperatives are organized entities easier to partner with
- City buses (EDSA Carousel, rationalized routes) — **plausible**, many operators have GPS via LTFRB CPUVMS requirement
- Traditional jeepneys — **unlikely**, informal operators, no GPS hardware, no consolidated agreements possible

---

## Technology Architecture

- GPS device fitted on each tracked vehicle (hardware onboarding required)
- Vehicle locations streamed live to Chalo cloud (AWS EC2/ECS)
- Location accuracy via HERE Technologies (Geocoding & Search API) — upgraded from earlier Google Maps Platform
- Journey planner uses HERE and/or Google Directions API for route geometry
- User app: iOS + Android (app ID: `app.zophop` on Android, `id1607824800` on iOS)

**Key limitation identified by Chalo itself**: Expansion to Manila encountered "notable gaps in location coverage and accuracy of key geopoints, resulting in usability problems" — leading to the HERE partnership. This suggests early Manila coverage was worse than Indian cities.

---

## User Experience Issues (Philippines-Specific)

1. **OTP verification failures** — multiple Philippine App Store reviewers report not receiving OTP SMS, preventing account creation. Philippine phone numbers may not be fully supported.
2. **Route accuracy concerns** — general reviews (not PH-specific) mention "buses going in opposite direction" and "app showed bus arriving soon but it never came"
3. **No dark mode, no route search** — UI limitations noted
4. **Commuter visibility** — Chalo is not mentioned in any Philippine transit media (Rappler, Inquirer, PhilStar) as a recommended app. Sakay.ph dominates local commuter app coverage.

---

## Competitive Position vs. Other Manila Apps

| App | Route DB | GTFS Export | Live GPS | Manila Prominence |
|---|---|---|---|---|
| Sakay.ph | 1,000+ routes | Yes (GitHub, 2020 snapshot) | Yes (live tracker) | #1 in PH |
| Moovit | 888+ routes | No | No | Used but not dominant |
| Chalo | Unknown (50–200 est.) | No | Yes (on fitted vehicles) | Minimal PH visibility |
| Google Maps | ~20 bus + rail | Via EACOMM partner | No | Used for rail/walk |

---

## Data Source Assessment for GTFS Project

| Criterion | Rating |
|---|---|
| Extractability | **0/5** — fully closed platform |
| Coverage estimate | **2/5** — likely partial, hardware-limited |
| Accuracy | **Unknown** — live GPS but coverage patchy |
| Currency | **High** — real-time where it works |
| Usefulness for this project | **Very low** |

**Recommendation**: Do not pursue Chalo as a data source for GTFS compilation. No route, stop, shape, or schedule data is accessible without official Chalo cooperation (which would require a formal data-sharing agreement). The platform may be useful for validating specific routes if a commuter with the app can share observations, but it cannot be programmatically harvested.

---

## Extracted Routes

**0 routes extracted** — no route data is publicly accessible from Chalo's platform.

A nominal JSON file is written with 0 routes to document the null finding.

---

## References

- [Chalo Metro Manila page](https://chalo.com/metromanila) (returns HTTP 403)
- [Chalo iOS App Store PH](https://apps.apple.com/ph/app/chalo-live-bus-tracking-app/id1607824800)
- [Chalo & HERE AWS Case Study](https://aws.amazon.com/solutions/case-studies/chalo-here/)
- [Chalo Google Maps Platform blog (Apr 2022)](https://mapsplatform.google.com/resources/blog/how-chalo-uses-google-maps-platform-transform-bus-passenger-experience/)
- [Chalo 2023 funding announcement](https://chalo.com/news/fundraise2023)
- [Chalo company profile — Tracxn](https://tracxn.com/d/companies/chalo/__zTcdcR2JAwlr1qxwnLp9GD04N3FecFqsB3kCK5efOiw)
