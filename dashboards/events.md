# Events

## Upcoming

```dataview
TABLE
  dates as "When",
  location as "Where",
  status as "Status",
  related as "Related"
FROM "entities/events"
WHERE dates[0] >= date(today)
SORT dates[0] ASC
```

## Past

```dataview
TABLE
  dates as "When",
  location as "Where",
  status as "Status"
FROM "entities/events"
WHERE dates[0] < date(today)
SORT dates[0] DESC
LIMIT 10
```
