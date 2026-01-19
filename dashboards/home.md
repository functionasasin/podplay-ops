# Knowledge Base Home

## Quick Links

- [[people|People]]
- [[places|Places]]
- [[businesses|Businesses]]
- [[trips|Trips]]
- [[projects|Projects]]
- [[ideas|Ideas]]
- [[events|Events]]

## Upcoming Trips & Events

```dataview
TABLE
  type as "Type",
  dates as "When",
  choice(type = "trip", destinations, location) as "Where",
  status as "Status"
FROM "entities/trips" OR "entities/events"
WHERE status != "completed" AND status != "attended" AND status != "skipped"
SORT dates[0] ASC
LIMIT 5
```

## Recent Activity

```dataview
TABLE
  type as "Type",
  file.mtime as "Modified"
FROM "entities"
SORT file.mtime DESC
LIMIT 10
```

## Active Projects

```dataview
LIST
FROM "entities/projects"
WHERE status = "active"
SORT file.mtime DESC
```

## Ideas Brewing

```dataview
LIST
FROM "entities/ideas"
WHERE status = "seed" OR status = "exploring"
SORT file.mtime DESC
LIMIT 5
```
