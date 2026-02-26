# Apple Maps Transit — Manila Routes Analysis

**Date analyzed**: 2026-02-26
**Source type**: Transit app (Apple platform)
**Data value for GTFS project**: Very low — rail outline only, no bus/jeepney data

---

## Summary

Apple Maps added transit directions for Manila, Philippines in **December 2018**, confirmed by a MacRumors report citing Apple's Feature Availability page. However, as of early 2026, the current Apple Philippines iOS Feature Availability page **does not list transit directions** for the Philippines — suggesting either the feature was quietly removed, its coverage is too limited to be listed, or it was never expanded beyond a minimal rail outline.

**Bottom line**: Apple Maps is not a viable data source for this GTFS project. It covers Manila's rail network in outline form at best, and provides zero data on buses, jeepneys, UV Express, or P2P routes.

---

## Data Source Assessment

### What Apple Maps Does Cover (Rail, Low Confidence)

When transit directions were added in December 2018, the scope was almost certainly limited to the rail network, consistent with how Apple Maps works in other cities (it requires structured GTFS/agency data, and only formal rail operators in Manila had published such data at the time):

- **MRT-3**: EDSA corridor, 13 stations, North Ave to Taft Ave
- **LRT-1**: 20 stations, Roosevelt to Baclaran
- **LRT-2**: 13 stations, Recto to Antipolo (Marikina extension added ~2021)
- **PNR**: Commuter rail, limited coverage possible

None of these are routes that need to be researched through Apple Maps — they are already documented in multiple authoritative sources (TUMI Datahub GTFS, official rail operator data, LRTA/MRTC published schedules).

### What Apple Maps Does NOT Cover

- **Jeepney routes**: Zero. Apple Maps has never published jeepney data in its transit layer anywhere in the world. Jeepneys lack formal GTFS submissions and have dynamic/informal stops incompatible with Apple's transit display model.
- **City bus routes**: No evidence of any bus route coverage in Apple Maps for Manila, unlike Google Maps which has ~20 city bus routes from the EACOMM-submitted GTFS.
- **UV Express**: Zero.
- **P2P buses**: Zero.
- **Modern jeepneys**: Zero.

### Current Feature Availability Status

The Apple Philippines iOS Feature Availability page (apple.com/ph/ios/feature-availability/) does **not** list transit directions as a feature available in the Philippines. This contrasts with the Apple Wallet Transit page which lists supported regions (Philippines absent from that list as well).

Apple explicitly notes: *"Public transportation information isn't available in all countries or regions."*

### Data Quality Issues

| Dimension | Assessment |
|-----------|-----------|
| Rail coverage | Minimal — stations only, possibly schedules |
| Bus coverage | None |
| Jeepney coverage | None |
| UV Express coverage | None |
| Route geometry | Unknown for rail; none for others |
| Stop coordinates | Unknown for rail; none for others |
| Real-time data | Not available in Philippines |
| API/export access | None (proprietary, no GTFS export) |
| Last confirmed active | December 2018 (original announcement) |

---

## Route Data Extracted

**Zero routes extracted** for bus, jeepney, UV Express, or P2P modes.

Rail routes are excluded here as they are already captured from authoritative sources (TUMI Datahub, LRTA/MRTC official data) with better quality than what Apple Maps would provide.

A corresponding `raw/apple-maps-routes.json` is written with empty route array and the negative finding documented.

---

## Comparison with Other Transit Apps

| App | Manila Bus | Manila Jeepney | Manila Rail | Data Export |
|-----|-----------|----------------|-------------|-------------|
| Google Maps | ~20 routes | 0 | Full (4 lines) | TUMI Datahub GTFS |
| Sakay.ph | Yes (via GTFS 2020) | 296+ (frozen 2020) | Full | GitHub (frozen) |
| Moovit | 888 routes total | Yes | Full | No export |
| Transit app | 0 | 0 | 0 | None |
| **Apple Maps** | **0** | **0** | **Rail only (low conf.)** | **None** |

---

## New Data Sources Discovered

None. Apple Maps does not serve as a gateway to additional Philippine transit data sources.

---

## Recommendations

1. **Do not pursue Apple Maps further** as a data source. The effort required to extract any useful information (which would require an iOS device and manual mapping) is not justified by the near-zero data value.
2. Rail data should come from TUMI Datahub GTFS and official LRTA/MRTC publications.
3. Focus Wave 1 research on sources with actual bus/jeepney data: OSM, Komyut GitHub repo, SafeTravelPH, Chalo app, and terminal-level research.
