# Businesses

```dataview
TABLE
  category as "Category",
  location as "Location",
  people as "People",
  tags as "Tags"
FROM "entities/businesses"
SORT category ASC
```

## By Category

```dataview
TABLE WITHOUT ID
  rows.file.link as "Businesses"
FROM "entities/businesses"
GROUP BY category
```
