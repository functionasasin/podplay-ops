# Places

```dataview
TABLE
  parent as "Part Of",
  tags as "Tags"
FROM "entities/places"
SORT file.name ASC
```

## By Region

```dataview
TABLE WITHOUT ID
  file.link as "Place",
  rows.file.link as "Sub-locations"
FROM "entities/places"
WHERE parent
GROUP BY parent
```
