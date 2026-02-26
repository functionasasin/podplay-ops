# Mapillary / KartaView — Street-Level Imagery of Route Signage and Terminals

**Source type**: Street-level imagery platforms (crowdsourced + commercially captured)
**Retrieved**: 2026-02-26
**Routes extractable**: 0 (imagery only; no structured route database)

---

## Summary

Both Mapillary and KartaView have Metro Manila coverage, but **neither platform yields directly extractable route data**. Street-level imagery is useful for stop verification and terminal location confirmation, but automated route extraction from jeepney windshield signs or bus signage is not feasible without a dedicated OCR pipeline applied to raw images. For this GTFS project, these platforms serve as secondary **validation tools**, not primary data sources.

---

## Mapillary

### Coverage in Metro Manila

Mapillary has **community-driven coverage** in Metro Manila, primarily contributed by:

- **OSM Philippines volunteers**: Community coordinated by Erwin Olario (OSM Philippines), who introduced Mapillary to Filipino mappers. Early capture at UP Diliman (2016).
- **YouthMappers chapters**: 2023 field workshops trained university students (multiple Philippine YouthMappers chapters) to use Mapillary for street-level imagery; Metro Manila campuses (UP Diliman, Ateneo, DLSU) likely covered.
- **PedalMap project**: 2024 collaboration with Tiklop Society of the Philippines (folding bicycle NGO) — funded by Open Knowledge Foundation mini-grant. Aims to integrate daily bike routes with continuous imagery capture; coverage skews toward secondary roads.
- **Schadow1 Expeditions**: Active Philippines OSM contributor (Ervin Malicdem) who contributes transport station data; unclear if Mapillary imagery is part of his workflow, but transport POIs are his specialty.

**Coverage assessment**: Metro Manila main arterials (EDSA, Commonwealth, Quezon Ave, Taft, C5) likely have scattered coverage, especially near intersections. Secondary streets and barangay roads are patchy. No systematic transit corridor capture program exists.

### Technical Capabilities (API v4)

| Feature | Capability | Transit Relevance |
|---------|-----------|-------------------|
| Image bounding box search | ✅ | Find images near terminals/stops |
| Object detection API | ✅ | 42 point feature categories |
| Traffic sign detection | ✅ 1,500 classes / 100 countries | Philippine signs mostly covered |
| Bus stop/shelter detection | ✅ (as point feature) | Validates stop existence |
| Route sign text reading | ❌ | Requires separate OCR step |
| GTFS export | ❌ | No structured data export |

**API geographic limit**: Bounding box must be < 0.01 degrees square per query. Metro Manila (NCR) bounding box is ~0.52° × 0.43° — requires tiling into ~230+ sub-queries. The `mapillary-python-sdk` handles this automatically.

### Object Detection for Transit

Mapillary's computer vision can detect:
- **Bus stops/shelters**: As `point` map features (requires detection in ≥3 images)
- **Traffic signs**: Including Philippine-specific road signs (≥2 images)
- **Benches, utility poles, crosswalks**: Secondary infrastructure

**Critical limitation**: Mapillary's object detection **classifies sign types** (stop sign, speed limit sign, etc.) but **cannot read text** on signs. Philippine jeepney route signs — hand-lettered or vinyl-printed text on windshields listing destinations (e.g., "CUBAO via ESPAÑA") — are:
1. Not in Mapillary's traffic sign taxonomy (jeepney route placards are not standardized road signage)
2. Not readable by Mapillary's CV without an added OCR step
3. Often at an angle, partially obscured, or low-contrast

An OCR pipeline using Tesseract or Google Vision API applied to cropped Mapillary images *could* extract route text, but this requires significant engineering and would have low precision given image quality variability.

---

## KartaView

### Coverage in Metro Manila

KartaView (formerly OpenStreetCam/OpenStreetView) is owned and operated by **GrabMaps** (Grab Holdings). Key Philippines facts:

- **Grab drivers as contributors**: GrabMaps commissions Grab driver-partners to capture imagery using dashcams and specialized equipment during regular trips. Metro Manila has a massive Grab rideshare presence — likely several thousand active drivers — making commercially-incentivized coverage far more systematic than Mapillary's volunteer model.
- **Southeast Asia focus**: KartaView explicitly targets SE Asia coverage. Philippines is listed among Thailand, Indonesia, Malaysia, and Vietnam as priority markets.
- **Coverage density**: "Particularly extensive coverage in Southeast Asia" — Metro Manila is likely one of the better-covered Asian cities given Grab's density there.
- **GrabMaps contribution scale**: "GrabMaps contributed 23,700 km of two-wheeler data to OpenStreetMap" (as of 2024) — indicating active structured capture programs, not just opportunistic crowdsourcing.

### Technical Capabilities

| Feature | Capability | Transit Relevance |
|---------|-----------|-------------------|
| Web viewer | ✅ kartaview.org | Manual stop verification |
| API access | ✅ (requires registration: name, work email, company) | Bulk image queries |
| 360° imagery | ✅ in some areas | Better terminal visibility |
| Dashcam photo sequences | ✅ primary format | Route corridor coverage |
| Route sign extraction | ❌ | Same OCR limitation as Mapillary |
| Data download | ✅ (registered users) | Potential bulk analysis |

**GrabMaps advantage**: Because Grab drivers follow road networks extensively (rideshare OD pairs are distributed across Metro Manila), KartaView likely has better **arterial road coverage** than Mapillary, particularly on major bus/jeepney corridors (EDSA, Commonwealth, C5, Marcos Highway, Taft, Ortigas, Shaw, Aurora).

---

## Practical Value for This GTFS Project

### High-Value Use Cases

1. **Terminal location verification**: Where is the exact jeepney/bus terminal? Street imagery shows queuing structures, signboards at terminal entries, and which vehicles park where. Useful for placing terminal stops in stops.txt.
   - Example: Exactly where is the SM North EDSA jeepney terminal relative to the mall? Imagery shows the structure.

2. **Stop existence confirmation**: Verify that a community-reported stop actually exists (shelter, road marking, congregation point) before adding to stops.txt.

3. **Route signage cross-reference**: A skilled analyst looking at sequence images along a corridor can spot route destination boards on passing jeepneys — manual labor-intensive but possible.

4. **Terminal infrastructure documentation**: Identify terminal amenities (covered shed, kiosk, time table boards) for quality scoring.

### Low-Value / Not Feasible

- **Automated route extraction**: Cannot reliably OCR Philippine jeepney route placards at scale
- **Stop coordinate generation**: GPS accuracy of street-level photo geotags (~5–10m) is insufficient for precise stop placement; better to use OSM node coordinates
- **Frequency estimation**: Imagery cannot substitute for operational surveys
- **Real-time data**: Both platforms are static imagery archives, not live feeds

---

## Data Quality Assessment

| Dimension | Mapillary | KartaView |
|-----------|-----------|-----------|
| Metro Manila coverage density | LOW–MEDIUM | MEDIUM–HIGH |
| Route data extractability | NONE (direct) | NONE (direct) |
| Stop verification utility | MEDIUM | MEDIUM–HIGH |
| API accessibility | ✅ Public (free tier) | ✅ Registered users |
| OCR pipeline feasibility | LOW | LOW |
| GTFS contribution potential | INDIRECT | INDIRECT |

---

## Key Findings

1. **Neither platform exports route data** — imagery-only; no route DB, stop list, or GTFS
2. **KartaView > Mapillary for Metro Manila coverage** due to GrabMaps' commercial driver-capture program
3. **Mapillary is more accessible** (no registration required for API free tier) and has a stronger OSM Philippines community integration
4. **OCR of jeepney route signs is theoretically possible** but requires a custom pipeline and would have significant false positive rates; not worth building for this project given OSM and LTFRB data sources are more reliable
5. **Best use**: Spot-check terminal coordinates and stop existence during Wave 3 GTFS synthesis — not a data extraction source for Wave 1
6. **Mapillary map features API** can extract `bus_stop` point features within bounding boxes — potentially 200–400 detected bus stops in Metro Manila with lat/lon. This supplements OSM stop nodes but adds no route information.

---

## Recommended Action for GTFS Pipeline

- **Do not** build an OCR pipeline for route sign extraction — ROI too low given existing OSM, LTFRB, and Sakay data
- **Do** use KartaView/Mapillary as a spot-check tool during Wave 3 stop coordinate validation for major terminals (Cubao, Pasay, Monumento, Fairview, Baclaran)
- **Consider** querying Mapillary map features API for `bus_stop` detections in NCR bbox as supplementary stop coordinate list — free, quick, adds locational diversity beyond OSM

---

## Data Freshness

- Mapillary imagery: continuously contributed; Philippines community active as of Feb 2025
- KartaView imagery: continuously captured by Grab drivers; Metro Manila likely updated within weeks
- Both platforms: static snapshots; no real-time route operational data
