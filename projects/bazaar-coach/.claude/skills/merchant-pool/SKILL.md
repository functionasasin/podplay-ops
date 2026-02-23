---
name: merchant-pool
description: Auto-load the item pool and probabilities for a specific merchant, day, and hero. Triggers when user mentions a merchant name with a day number.
user-invocable: true
disable-model-invocation: false
---

# Merchant Pool Lookup

When the user mentions a merchant and a day number (e.g., "Day 2 Mittel", "what does Kina have on Day 5"), load the correct item pool filtered by day-available tiers and compute probabilities.

## Step 1: Parse Context

Extract from the conversation:
- **Merchant name**: Match against known merchants (Jay Jay, Aila, Kina, Colt, Mittel, Tok's Clocks, Kev's Armory, Ande, Nautica)
- **Day number**: The current game day
- **Hero**: Default to Vanessa (only hero with KB data)

## Step 2: Look Up Merchant

Read `mechanics/merchants.md` to get:
- **Pool rule**: What items this merchant sells (e.g., "medium items", "non-Weapon items", "Ammo items")
- **Merchant tier**: Bronze/Silver/Gold/Diamond
- **First appears**: Day X
- **Reroll cost**: X gold

If the day is BEFORE the merchant's "First appears" day, tell the user this merchant isn't available yet.

## Step 3: Determine Tiers in Pool

Map the day number to available item starting tiers:

| Day   | Tiers Available             |
|-------|-----------------------------|
| 1-2   | Bronze                      |
| 3-6   | Bronze, Silver              |
| 7-8   | Bronze, Silver, Gold        |
| 9+    | Bronze, Silver, Gold, Diamond |

## Step 4: Load and Filter Item Pool

Based on the merchant's pool rule, read the correct item file(s) from `items/by-hero/`:

| Merchant | Pool Rule | Files to Read |
|----------|-----------|---------------|
| Mittel | Medium items | `vanessa-medium.md` |
| Ande | Small items | `vanessa-small.md` |
| Jay Jay | All items | All three vanessa item files |
| Aila | All items | All three vanessa item files |
| Kina | Non-Weapon items | All three, exclude items with "Weapon" in Types |
| Colt | Ammo items | All three, include only items with "Ammo" in Types |
| Tok's Clocks | Haste/Slow/Cooldown items | All three, include items with "Haste", "Slow", or "Cooldown" in Types |
| Kev's Armory | Shield/Health items | All three, include items with "Shield" or "Heal" in Types |
| Nautica | Aquatic items | All three, include items with "Aquatic" in Types |

From each file, extract every item entry and read its `- **Starting Tier**:` field. **Only include items where Starting Tier is in the day's available tiers** (from Step 3).

## Step 5: Compute Probabilities

With the filtered pool of N items and 3 items shown per shop:

1. **P(specific item per shop)** = 3/N
2. **P(specific item after K rerolls)** = 1 - ((N-3)/N)^(K+1)
3. **P(see ≥1 from group of G items)** = 1 - C(N-G, 3) / C(N, 3)
   where C(a,b) = a! / (b! × (a-b)!)

Group items by rating (S/A/B/C/D) and compute P(see ≥1) for each group.

## Step 6: Output

Use this exact format:

```
## [Merchant] — Day [X] ([Hero])
[Merchant tier] merchant | 3 items shown | [X]g reroll

**Pool**: [N] items ([breakdown by starting tier, e.g., "15 Bronze + 8 Silver"])
**New this day**: [items whose Starting Tier matches the NEWEST tier unlocked on this day, if any]

| Rating | Count | P(see ≥1) | Items |
|--------|-------|-----------|-------|
| S      | [n]   | [X]%      | [names] |
| A      | [n]   | [X]%      | [names] |
| B      | [n]   | [X]%      | [names] |

P(specific item): [X]% per shop | [X]% with 1 reroll | [X]% with 2 rerolls

### S-Tier Items
- **[Name]** ([Starting Tier]) — [brief: cooldown, key effect]
- ...

### A-Tier Items
- **[Name]** ([Starting Tier]) — [brief: cooldown, key effect]
- ...

### New This Day ([Tier] unlocked)
- **[Name]** ([Rating]) — [brief: cooldown, key effect]
- ...
```

If no new items unlocked on this day (same tiers as yesterday), omit the "New this day" line and section.

## Important

- ALWAYS read the actual item files — don't guess starting tiers from memory
- The pool grows on Days 3, 7, and 9 when new tiers unlock — probabilities change
- For general merchants (Jay Jay, Aila), the pool is MUCH larger — probabilities per item are lower
- Specialized merchants (Mittel, Ande) have smaller pools — higher odds of specific items
- Include the Starting Tier in parentheses next to each item name so the user can see which tier it comes from
