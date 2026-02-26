# Open Transit Data Initiatives — Manila GTFS Feeds

**Aspect**: Open Transit Data initiatives — any GTFS feeds published for Manila
**Date analyzed**: 2026-02-26
**Method**: Web research (WebSearch + WebFetch)

---

## Summary

Four distinct publicly downloadable GTFS feeds exist for Metro Manila. All ultimately trace back to the same 2013 Philippine Transit App Challenge dataset maintained by sakayph. One proprietary private GTFS (EACOMM/Google Maps) and one government-internal GTFS (LTFRB CPUVMS) also exist but are not publicly accessible.

**Bottom line**: No new GTFS feed covering post-2020 jeepney/UV Express routes has been publicly released. The sakayph/gtfs frozen June 2020 snapshot remains the only public static GTFS for jeepney and bus routes in NCR.

---

## Public GTFS Feeds

### 1. sakayph/gtfs (GitHub) — PRIMARY PUBLIC SOURCE

- **URL**: https://github.com/sakayph/gtfs
- **Direct download**: `https://github.com/sakayph/gtfs/archive/master.zip`
- **Origin**: Released for the DOTC Philippine Transit App Challenge (Oct 2013)
- **Last meaningful update**: June 2020 (COVID-era freeze)
- **Agencies** (6): LRTA, LTFRB, MRTC (MRT-3), MARINA, PNR, The Fort Bus
- **Route count**: 296–349 routes (depends on direction variants counted)
- **Stop count**: 2,078 stops with lat/lon coordinates
- **Geographic coverage**: 14.53–14.82°N, 120.90–121.09°E (full NCR bounding box)
- **Modes covered**: jeepney (PUJ/modern PUJ), city bus, LRT-1, LRT-2, MRT-3, PNR, ferry (MARINA)
- **Geometry**: Full shapes.txt available
- **License**: Not explicitly stated (open use implied by challenge terms)
- **Data quality**: High for 2013–2020 era; stale for current operations post-PUVMP consolidation

**File structure** (standard GTFS): agency.txt, routes.txt, trips.txt, stop_times.txt, stops.txt, shapes.txt, calendar.txt, calendar_dates.txt, fare_attributes.txt, fare_rules.txt

### 2. TUMI Datahub — manila.zip

- **URL**: https://hub.tumidata.org/dataset/gtfs-manila
- **Direct download**: `https://hub.tumidata.org/dataset/5dc13962-f732-4a74-959a-dbe44d21ce5e/resource/37dda9a8-b5b6-4b39-a1df-3069fb43e753/download/manila.zip`
- **Origin**: TUMI (Transformative Urban Mobility Initiative) data sourcing project; mirrors sakayph/gtfs content
- **Agencies**: Same 6 as sakayph/gtfs (LRTA, LTFRB, MRTC, MARINA, PNR, Fort Bus)
- **GTFS validation**: Passed Canonical GTFS Schedule Validator
- **Category**: Public Transport Timetable-bound PT
- **Status**: Available for download, no registration required
- **Note**: This is almost certainly the same dataset as sakayph/gtfs — TUMI scouted and re-hosted it. The TUMI GTFS Analyzer can be pointed at this URL for stop distribution and frequency analysis.

### 3. Transitland — Feed f-wdw-manila

- **URL**: https://www.transit.land/feeds/f-wdw-manila
- **Feed source URL**: `https://github.com/sakayph/gtfs/archive/master.zip#gtfs-master` (same as sakayph/gtfs)
- **Publisher**: Sakay.ph
- **Feed versions**: 3 archived versions
  - July 28, 2020 (service period Jun 2013–Jun 2020)
  - March 17, 2017 (service period Jun 2013–Jun 2020)
  - March 13, 2017 (service period Feb–Mar 2014)
- **Operators indexed**: Fort Bus, MRTC, PNR, LRTA, LTFRB, MARINA
- **Onestop ID**: f-wdw-manila
- **Transitland API**: Can query operators, stops, and routes via REST API using this feed ID
- **Note**: All 3 versions trace to the same sakayph/gtfs dataset. Transitland is the most useful for programmatic access via its REST API.

### 4. sakayph/p2p-gtfs

- **URL**: https://github.com/sakayph/p2p-gtfs
- **Coverage**: Point-to-point premium bus routes in Manila
- **Route count**: 11 static routes (3 Froehlich routes defunct as of 2023–2024)
- **Active routes** (estimated 8): HM Transport, RRCG, UBE Express, and others
- **Note**: Already analyzed as part of Sakay.ph aspect (log entry #12). Complement to the main sakayph/gtfs.

---

## Private / Non-Public GTFS Feeds

### EACOMM / Google Maps (Best Maintained, Not Public)

- **Status**: Proprietary, maintained under contract with Google Maps
- **Origin**: Commissioned by Google in 2012, World Bank-funded initial dataset
- **Current coverage** (estimated): 20–30 city bus routes with geometry, LRT/MRT/PNR, some jeepney routes in Cebu/Davao (Manila jeepney less certain post-2020)
- **GTFS-RT**: Planned via CPUVMS data (not yet live as of 2026)
- **Access**: Not downloadable; available to Google Maps users through the transit layer
- **Contact**: admin@eacomm.com / www.gtfsrt.com
- **Historical note**: EACOMM also developed GTFS for Singapore, Jakarta, Bangkok, and Queensland (Australia)

### LTFRB CPUVMS (Government Internal, Not Public)

- **Status**: Internal government use only
- **Coverage**: All PUV modes (jeepney, bus, UV Express, taxis) being progressively added to GTFS
- **Purpose**: Government tool for route planning and compliance monitoring
- **Access**: Not published; eFOI request theoretically possible but no public portal
- **GTFS-RT component**: Being developed based on GPS tracking from CPUVMS hardware installed on PUVs

---

## Historical Context

### Philippine Transit App Challenge (October 2013)
- Organized by DOTC (now DOTr), MMDA, and Cebu City Government
- First open transit data challenge in Southeast Asia
- Attracted 17 entries, 10 finalists
- Released the original GTFS dataset as open data for app developers
- Winners:
  - Open Community Award: **Sakay.ph** (jeepney + bus + train routing in Metro Manila)
  - Transport Award: Transit.com.ph (Cebu City routing + editor)
  - Inclusive Technology Award: Manila Train Guide
  - Voter's Choice: Rklamo (driver-tipping via SMS)
- **Sakay.ph** used the DOTC GTFS as its base, adding validation and modifications; this dataset evolved into sakayph/gtfs on GitHub

### World Bank Connection
- The Metro Manila Urban Transport Integration Project (World Bank $60M loan, June 2011) provided foundational funding for the transit data ecosystem that enabled the PTAC
- Academic paper published (Narboneta & Teknomo, 2015, SURP/NCTS) on the GTFS-based routing methodology

---

## Feed Aggregator Status

### Mobility Database (successor to TransitFeeds/OpenMobilityData)
- **URL**: https://mobilitydatabase.org/
- **Status**: TransitFeeds.com deprecated December 2025; all feeds migrated to Mobility Database
- **Philippines entry** (historical): Listed as `philippines/71` on old TransitFeeds
- **Programmatic access**: REST API at mobilitydatabase.org (requires free registration)
- **CSV catalog**: `https://files.mobilitydatabase.org/feeds_v2.csv` — filter by country_code=PH
- **R package**: `mobdb` on GitHub (jasonad123/mobdb) wraps the Mobility Database API

### Old TransitFeeds (Deprecated)
- Philippines was listed at transitfeeds.com/p/philippines/71
- No longer updated as of December 2025
- 3 versions archived: 2020-07-28, 2017-03-17, 2017-03-13 (all sakayph/gtfs)

---

## Data Quality Assessment

| Feed | Routes | Stops | Geometry | Staleness | Jeepney | Bus | Rail |
|------|--------|-------|----------|-----------|---------|-----|------|
| sakayph/gtfs | 296–349 | 2,078 | Full | 2020 | Yes | Yes | Yes |
| TUMI manila.zip | Same | Same | Same | 2020 | Yes | Yes | Yes |
| Transitland f-wdw-manila | Same | Same | Same | 2020 | Yes | Yes | Yes |
| sakayph/p2p-gtfs | 11 | Unknown | Yes | 2022–2023 | No | P2P only | No |
| EACOMM/Google Maps | ~20–30 bus | ~200 bus stops | Yes | Live | Partial | Yes | Yes |
| LTFRB CPUVMS | ~950 jeep + 68 bus + 250 UV | Unknown | Yes | Live | Yes | Yes | No |

---

## Key Gaps

1. **No public GTFS for post-2020 jeepney routes**: The 555+ consolidated modern PUJ routes under PUVMP have no public GTFS equivalent. LTFRB's CPUVMS has this internally.
2. **No public GTFS for UV Express**: 250 NCR UV Express routes have never been in any public GTFS.
3. **Rail is well-covered**: LRT-1, LRT-2, MRT-3, PNR all covered in sakayph/gtfs and TUMI feed.
4. **Ferry/MARINA data sparse**: MARINA routes in sakayph/gtfs likely incomplete/outdated.
5. **Stop coordinates outdated**: 2,078 stops in sakayph/gtfs represent 2013–2020 network; many relocated or closed post-consolidation.

---

## Recommendations for GTFS Build

1. **Start from sakayph/gtfs** as the geometric backbone (shapes.txt especially)
2. **Use TUMI Datahub manila.zip** as the downloadable starting point (same content, GTFS-validated)
3. **Query Transitland API** (f-wdw-manila) for stop and route data with Onestop IDs
4. **Supplement with OSM geometry** (Wave 1 aspects 22–23) for post-2020 routes not in sakayph
5. **Do NOT rely on EACOMM or CPUVMS** — not publicly accessible
6. **Flag all jeepney/UV Express data** as requiring field validation (2020 freeze is significant)

---

## Sources

- https://github.com/sakayph/gtfs
- https://hub.tumidata.org/dataset/gtfs-manila
- https://www.transit.land/feeds/f-wdw-manila
- https://www.officialgazette.gov.ph/2013/10/15/dotc-concludes-successful-phl-transit-app-challenge/
- https://eacomm.com/blog/gtfs-protocol-simplified-mobility-with-it/
- https://mobilitydatabase.org/
- https://github.com/sakayph/p2p-gtfs
