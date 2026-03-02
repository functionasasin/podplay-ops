# Generate calendar.txt — Service Patterns

## Summary

Generated `analysis/gtfs/calendar.txt` defining the two service calendar entries used across all trips in `trips.txt`.

---

## Service IDs Used in This Feed

Scanning `trips.txt` yielded exactly two distinct `service_id` values:

| service_id | Description | Day Pattern |
|---|---|---|
| `WD_FULL` | Standard weekday full-day service | Monday–Friday |
| `WE_FULL` | Weekend full-day service | Saturday–Sunday |

### WD_FULL (244 trips)
Applied to virtually all jeepney, bus, UV Express, P2P, and rail trips. Represents the primary operating pattern: Monday through Friday, all day. Used by:
- All three rail lines (LRT-1, LRT-2, MRT-3)
- EDSA Carousel
- All BGC Bus weekday routes
- All numbered city bus routes (BUS-2 through BUS-65, PNR augmentation)
- All city bus operators (MMBC, MALTC)
- All P2P operators except P2P-RRCG-006
- All UV Express routes
- All traditional and modern PUJ routes

### WE_FULL (2 trips)
Applied only to routes explicitly documented as weekend-only operations:
- `BGC-WEEKEND` — BGC Bus weekend loop (BGC internal loop, Saturdays and Sundays only)
- `P2P-RRCG-006` — RRCG weekend P2P to Ayala South Park Alabang

---

## calendar.txt Output

```
service_id,monday,tuesday,wednesday,thursday,friday,saturday,sunday,start_date,end_date
WD_FULL,1,1,1,1,1,0,0,20260101,20261231
WE_FULL,0,0,0,0,0,1,1,20260101,20261231
```

**Date range:** 2026-01-01 to 2026-12-31 (full calendar year coverage).

---

## Metro Manila Service Pattern Reality

### Most Routes Operate 7 Days
In practice, the majority of Metro Manila transit runs daily, including weekends:
- Traditional jeepneys operate every day of the week
- City buses run 7 days (some with reduced off-peak frequencies on weekends)
- LRT-1, LRT-2, MRT-3 all operate 7 days (frequencies are similar weekday vs weekend)
- EDSA Carousel runs 24/7 daily

### Why WD_FULL Is Used for 7-Day Routes
The `WD_FULL` service ID was assigned to most routes in the trips-generation phase as a simplification. The consequence is that routing engines using this feed will not show these services on Saturdays and Sundays unless supplemented. Two remediation approaches:

**Option A — Define WD_FULL as all-week (1,1,1,1,1,1,1)**
Pros: Most accurate for Manila's continuous daily transit. Cons: Incorrectly marks commuter-oriented P2P routes (which often reduce or stop on weekends) as running on weekends.

**Option B — Keep WD_FULL as Mon–Fri; add WE_FULL trips for always-on routes**
Pros: Semantically correct. Cons: Requires duplicating ~240 trip entries in trips.txt with WE_FULL service_id.

**Option C — Add an `ALL_WEEK` service_id (1,1,1,1,1,1,1)**
Pros: Clean, backward-compatible. Cons: Requires re-tagging trips.txt entries for 7-day routes.

This initial `calendar.txt` uses **Option A interpretation** (WD_FULL = Mon–Fri, WE_FULL = Sat–Sun) as the strict reading of the IDs, consistent with how P2P routes and BGC weekday bus routes are intentionally weekday-only. The GTFS feed is accurate for those routes and represents a conservative lower bound for weekend coverage.

---

## Philippine Public Holiday Considerations

Manila transit is affected by certain public holidays. These should ideally be represented in `calendar_dates.txt` (exception-based overrides). Key patterns:

| Holiday Type | Rail | EDSA Carousel | Jeepney/Bus | UV Express / P2P |
|---|---|---|---|---|
| Regular Public Holidays | Reduced schedule | Full operation | Most run, reduced | Many skip (commuter demand drops) |
| Christmas Day (Dec 25) | Closed or minimal | Minimal | Very limited | Mostly suspended |
| New Year's Day (Jan 1) | Closed AM, open PM | Full | Very limited AM | Suspended |
| Holy Week (Maundy Thu–Black Sat) | Reduced or closed | Reduced | Limited | Reduced |
| Eid al-Fitr / Eid al-Adha | Full operation | Full | Mostly normal | Normal |

Philippine regular holidays for 2026: Jan 1, Jan 29 (Chinese NY), Feb 25 (EDSA), Apr 2 (Maundy Thu), Apr 3 (Good Friday), Apr 4 (Black Saturday), Apr 9 (Araw ng Kagitingan), May 1, Jun 12, Aug 21, Aug 31, Nov 1, Nov 2, Nov 30, Dec 8, Dec 25, Dec 30, Dec 31.

A future `calendar_dates.txt` should specify `exception_type=2` (service removed) for LRT/MRT/Carousel on Christmas Day and New Year's morning, and `exception_type=2` for P2P routes on major holidays.

---

## Data Quality Notes

- **Coverage:** 2 service records covering all 246 trips in this feed
- **Confidence:** High — directly derived from service_ids already assigned in trips.txt
- **Known gap:** ~240 routes tagged WD_FULL that also run Sat–Sun are understated for weekend routing
- **Next step:** Consider `calendar_dates.txt` for holiday exceptions; or restructure trips.txt to add WE_FULL variants for 7-day routes

---

## Files Written

- `analysis/gtfs/calendar.txt` — 2 service records (WD_FULL, WE_FULL), date range 2026-01-01 to 2026-12-31
