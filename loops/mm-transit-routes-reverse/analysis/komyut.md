# Komyut App (github.com/vrymel/komyut) — Analysis

**Aspect**: Komyut app — open-source Filipino route planner, jeepney route dataset
**Retrieved**: 2026-02-26
**Result**: WRONG CITY — covers Cagayan de Oro, NOT Metro Manila. Zero extractable NCR routes.

---

## Summary

The `vrymel/komyut` GitHub repository is an **open-source Elixir/Phoenix web application** for jeepney route pathfinding and listing. Despite appearing in multiple search results as a Filipino transit tool, it is **not useful for Metro Manila GTFS** for two reasons:

1. **Geographic mismatch**: The app covers **Cagayan de Oro (Mindanao)**, not NCR. Confirmed by coordinates `lat: 8.485273, lng: 124.646718` found in `scratch_pad.txt` — Cagayan de Oro is at exactly 8.47°N, 124.65°E.
2. **Data inaccessibility**: Route data is stored in a PostgreSQL binary database dump (`./database_dumps/`), not in any web-accessible or static file. The dump is not checked into the repo or publicly downloadable.

---

## Project Details

| Field | Value |
|---|---|
| Repository | github.com/vrymel/komyut |
| Type | Personal/learning project |
| Stack | Elixir/Phoenix, Vue.js, PostgreSQL, Docker |
| Development period | Sep 2017 – Nov 2018 (inactive) |
| City covered | Cagayan de Oro, Mindanao (NOT Metro Manila) |
| Routes in database | Unknown (binary dump, inaccessible) |
| Publicly accessible | No (no live instance found) |

---

## Data Architecture

The app uses a **graph-based routing model** with the following data structures:

- **Intersection**: Geographic nodes (lat/lon GeoPoints), numbered IDs (1–127+)
- **RouteEdge**: Directed edges between intersections, with weights; stored as `from_intersection_id → to_intersection_id`
- **Route**: Named collection of RouteEdges
- **Graph**: Dijkstra-based shortest-path over RouteEdge graph

The data model (`waypoints_direct` module) was designed for the informal jeepney transit system where routes are defined as ordered sequences of intersections (stops/waypoints), not road segments.

Key schema modules:
- `lib/waypoints_direct/` — core routing logic
- `lib/graph_helpers/graph.ex` — Dijkstra implementation
- `app/priv/repo/` — database migrations and seeds
- `./database_dumps/` — PostgreSQL dump (NOT in repo, not accessible)

---

## Data Coverage Assessment

| Metric | Value |
|---|---|
| Metro Manila routes | 0 (wrong city) |
| Extractable routes (any method) | 0 |
| Data currency | ~2017-2018 (stale even for CDO) |
| GTFS compatibility | Not applicable |
| Geometry available | Not accessible |
| Confidence | High (coordinate evidence is definitive) |

---

## Related Projects Found

### Komyut AI (komyut-app.vercel.app)
A **separate, unrelated project** sharing the same name. This is an AI-powered transit planner for Metro Manila that covers jeepney, bus, MRT/LRT, and UV Express routes. Uses AI-generated route recommendations rather than a structured GTFS database. Not open-source. Coverage unknown. Added as new frontier aspect.

### jtransit/route-planner (github.com/jtransit/route-planner)
Open-source jeepney route plotter for **Cebu City**, used to power the JTransit Android app. Similarly not useful for Metro Manila but confirms that open-source jeepney route tools exist for Philippine cities outside NCR.

---

## Verdict

**vrymel/komyut is not a data source for Metro Manila GTFS.**

- Wrong city (Cagayan de Oro)
- Data inaccessible even for CDO (binary PostgreSQL dump, not publicly hosted)
- Stale (2017-2018 data)

The repo is architecturally interesting (proves informal transit graph-routing is feasible in Elixir) but contributes zero routes to this project.

---

## Routes Extracted

**0 routes** — not applicable (wrong city, data inaccessible).
