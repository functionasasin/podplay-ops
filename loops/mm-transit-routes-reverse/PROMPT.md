# Metro Manila Transit Routes — Reverse Ralph Loop

You are an analysis agent in a ralph loop. Each time you run, you do ONE unit of work, then exit.

## Your Working Directory

You are running from `loops/mm-transit-routes-reverse/`. All paths below are relative to this directory.

## Your Goal

Build a comprehensive, accurate GTFS database of all jeepney, bus, UV Express, and P2P bus routes in Metro Manila (NCR). Existing transit maps are incomplete, inaccurate, or outdated. This loop researches every available data source, cross-references findings, and synthesizes a validated GTFS feed with route shapes, stops, fare rules, and frequency estimates.

The final output is a complete GTFS feed in `analysis/gtfs/` ready for import into routing engines.

## What To Do This Iteration

1. **Read the frontier**: Open `frontier/aspects.md`
2. **Find the first unchecked `- [ ]` aspect** in dependency order (Wave 1 before Wave 2 before Wave 3)
   - If ALL aspects are checked `- [x]`: write convergence summary to `status/converged.txt` and exit
3. **Analyze that ONE aspect** using the appropriate method (see below)
4. **Write findings** to `analysis/{aspect-name}.md`
   - For route data, also write structured data to `raw/{source}-routes.json` using the schema below
5. **Update the frontier**:
   - Mark the aspect as `- [x]`
   - Update Statistics (increment Analyzed, decrement Pending, update Convergence %)
   - If you discovered new data sources or routes that need investigation, add them as new aspects
   - Add a row to `frontier/analysis-log.md`
6. **Commit**: `git add -A && git commit -m "loop(mm-transit-routes-reverse): {aspect-name}"`
7. **Exit**

## Analysis Methods

### Wave 1: Data Source Research

For each data source, extract as much route information as possible:

**Method**: Use `WebSearch` and `WebFetch` to find and scrape route data. For each source:
1. Search for the source and assess what data is available
2. Extract route names, endpoints, key stops, fare info, and any geographic data
3. Assess data quality: how current, how complete, how accurate
4. Write structured findings to `analysis/{source-name}.md`
5. Write machine-readable route data to `raw/{source-name}-routes.json`

**Raw route JSON schema**:
```json
{
  "source": "ltfrb|sakay|osm|academic|blog|government|social",
  "retrieved_date": "2026-02-25",
  "routes": [
    {
      "route_id": "string",
      "route_name": "string",
      "mode": "jeepney|bus|uv_express|p2p",
      "origin": "string",
      "destination": "string",
      "key_stops": ["string"],
      "fare_min": null,
      "fare_max": null,
      "frequency_notes": "string",
      "geometry_available": false,
      "geometry_source": null,
      "confidence": "high|medium|low",
      "notes": "string"
    }
  ]
}
```

### Wave 2: Cross-Reference & Validation

For each validation aspect:
1. Load route data from `raw/*.json` files across sources
2. Match routes across sources (same route may have different names/IDs)
3. Identify: confirmed routes (2+ sources agree), contested routes (sources conflict), orphan routes (single source)
4. For contested routes, determine the most likely accurate version
5. Write validated route list to `analysis/validated-{group}.md`
6. Flag gaps: known corridors or areas with no route data

### Wave 3: GTFS Synthesis

Compile validated routes into GTFS format:
1. Generate `agency.txt`, `routes.txt`, `trips.txt`, `stops.txt`, `stop_times.txt`, `shapes.txt`, `fare_attributes.txt`, `fare_rules.txt`, `frequencies.txt`
2. Use best available geometry; for routes with no geometry, estimate paths using road network
3. Place stops at known landmarks, intersections, and terminals
4. Derive frequency estimates from source data and reasonable defaults
5. Write GTFS files to `analysis/gtfs/`
6. Write a quality report: coverage stats, confidence levels, known gaps

## Rules

- Do ONE aspect per run, then exit.
- Check dependencies before starting an aspect (Wave 2 needs Wave 1 complete, Wave 3 needs Wave 2 complete).
- Every route extracted must include: name, mode, origin, destination, and confidence level.
- When sources conflict, note the conflict explicitly — don't silently pick one.
- Use Filipino route naming conventions (e.g., "Cubao-Divisoria" not "Route 47").
- Prefer official LTFRB route designations where available.
- For fare data, note whether it's minimum fare, per-km, or flat rate.
- For frequency, "peak" vs "off-peak" distinction matters — note both when available.
- Write findings in markdown with specific numbers and examples.
- Discover new data sources and add them as Wave 1 aspects.
- Keep analysis files focused. One aspect = one file.
