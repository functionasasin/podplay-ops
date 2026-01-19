# People

```dataview
TABLE
  businesses as "Works At",
  locations as "Based In",
  last_contact as "Last Contact",
  tags as "Tags"
FROM "entities/people"
SORT last_contact DESC
```

## Recently Met

```dataview
TABLE
  met_through as "Met Through",
  last_contact as "Last Contact"
FROM "entities/people"
WHERE last_contact
SORT last_contact DESC
LIMIT 10
```
