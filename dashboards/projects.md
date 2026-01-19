# Projects

## Active

```dataview
TABLE
  start_date as "Started",
  people as "People",
  places as "Location",
  tags as "Tags"
FROM "entities/projects"
WHERE status = "active"
SORT start_date DESC
```

## All Projects

```dataview
TABLE
  status as "Status",
  start_date as "Started",
  tags as "Tags"
FROM "entities/projects"
SORT status ASC, start_date DESC
```
