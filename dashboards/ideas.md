# Ideas

## Seeds & Exploring

```dataview
TABLE
  status as "Status",
  related_places as "Places",
  related_people as "People",
  tags as "Tags"
FROM "entities/ideas"
WHERE status = "seed" OR status = "exploring"
SORT file.mtime DESC
```

## Ready to Act

```dataview
TABLE
  related_places as "Places",
  related_people as "People",
  tags as "Tags"
FROM "entities/ideas"
WHERE status = "ready"
SORT file.mtime DESC
```

## Shelved

```dataview
TABLE
  tags as "Tags"
FROM "entities/ideas"
WHERE status = "shelved"
SORT file.mtime DESC
```
