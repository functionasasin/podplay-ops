# Trips

## Upcoming

```dataview
TABLE
  dates as "When",
  destinations as "Where",
  status as "Status",
  people as "With"
FROM "entities/trips"
WHERE status != "completed"
SORT dates[0] ASC
```

## Past

```dataview
TABLE
  dates as "When",
  destinations as "Where",
  people as "With"
FROM "entities/trips"
WHERE status = "completed"
SORT dates[0] DESC
LIMIT 10
```
