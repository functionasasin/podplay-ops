# Merchant Pool Skill Design

**Date**: 2026-02-23
**Scope**: Vanessa only (extend to other heroes later)

## Problem

When asking "what can I see at Mittel on Day 2?", the KB doesn't have explicit starting tier data on items, so Claude has to guess from scaling value counts — leading to wrong pool sizes and wrong probabilities. No skill exists to auto-load the correct filtered item pool for a given merchant + day + hero combo.

## Solution: Three changes

### 1. Data Layer: Add `Starting Tier` to every item entry

Every item in `items/by-hero/vanessa-small.md`, `vanessa-medium.md`, `vanessa-large.md` gets an explicit field:

```markdown
## Anchor
- **Size**: Medium | **Types**: Aquatic, Weapon, Damage, Haste
- **Starting Tier**: Gold
- **Cooldown**: 13.0s
```

**Data source**: Scrape from thebazaar.wiki.gg for each Vanessa item.

### 2. Merchant Knowledge: Complete `mechanics/merchants.md`

Add a reference table at the top:

```markdown
## Items Per Shop

All merchants show **3 items** per shop visit. Rerolling replaces all 3.

## Tier Availability by Day

| Day   | Tiers Available                    |
|-------|------------------------------------|
| 1-2   | Bronze                             |
| 3-6   | Bronze + Silver                    |
| 7-8   | Bronze + Silver + Gold             |
| 9+    | Bronze + Silver + Gold + Diamond   |
```

Each known merchant entry gets completed with:
- `Items per shop: 3`
- `First appears: Day X`
- `Reroll cost: Xg`
- Pool filtering rule (e.g. "medium items", "non-Weapon items", "Ammo items")

### 3. Skill: `merchant-pool` (auto-trigger)

A SKILL.md at `.claude/skills/merchant-pool/SKILL.md` that auto-triggers when conversation mentions a merchant + day context.

#### Trigger conditions

- User mentions a merchant name (Mittel, Jay Jay, Aila, Kina, Colt, Tok's Clocks, Kev's Armory, Ande, Nautica)
- AND a day number or day context is present
- Hero defaults to Vanessa (only hero with data)

#### Steps

1. **Parse context**: Extract merchant name, day number, hero
2. **Look up merchant**: Read `mechanics/merchants.md` for merchant type, first-appears day, reroll cost
3. **Validate**: If day < first-appears day, tell user merchant isn't available yet
4. **Determine tiers in pool**: Map day number to available tiers (Day 1-2 = Bronze only, Day 3-6 = Bronze+Silver, Day 7-8 = +Gold, Day 9+ = +Diamond)
5. **Load item pool**: Based on merchant type, read the correct item file(s):
   - Mittel (medium) → `items/by-hero/vanessa-medium.md`
   - Ande (small) → `items/by-hero/vanessa-small.md`
   - Jay Jay / Aila (general) → all three files
   - Kina (non-weapon) → all three, filter out Weapon type
   - Colt (ammo) → all three, filter to Ammo type
   - Tok's Clocks (speed) → all three, filter to Haste/Slow/Cooldown types
   - Kev's Armory (defense) → all three, filter to Health/Shield types
6. **Filter by starting tier**: Only include items where `Starting Tier` is at or below the highest tier unlocked for that day
7. **Calculate probabilities**:
   - Pool size (N)
   - P(specific item) = 3/N
   - P(specific item after K rerolls) = 1 - ((N-3)/N)^(K+1)
   - P(any S-tier) = 1 - C(N-S, 3) / C(N, 3)
   - P(any A+-tier) = same formula with S+A count
8. **Output formatted result**

#### Output format

```
## Mittel — Day 3 (Vanessa)
Bronze merchant | 3 items shown | 2g reroll

**Pool**: 25 items (23 Bronze + 2 Silver)
**New this day**: Cauterizing Blade (A), Oni Mask (A)

| Rating | Count | Items | P(see ≥1) |
|--------|-------|-------|-----------|
| S (4)  | 4     | ...   | 41%       |
| A (14) | 14    | ...   | 95%       |
| B (7)  | 7     | ...   | 68%       |

P(specific item): 12.0% per shop | 22.6% with 1 reroll

### S-Tier Items
- **Bladed Hoverboard** — Passive. Deals 30 Damage when using adjacent items.
- ...

### A-Tier Items
- ...

### New This Day (Silver unlocked)
- **Cauterizing Blade** (A) — 5s CD. Deal 20 Damage. Burn 2. Quest: Slow or Haste path.
- **Oni Mask** (A) — 10s CD. Burn 6. When you Crit, Burn items gain +4 Burn.
```

The "New this day" section highlights items that just entered the pool because their starting tier unlocked on this day — helps decide whether to wait a day for a specific item.

## Implementation Order

1. Scrape starting tiers from thebazaar.wiki.gg for all Vanessa items (~130)
2. Add `Starting Tier:` field to every item in the three vanessa item files
3. Complete merchant entries in `mechanics/merchants.md`
4. Create `.claude/skills/merchant-pool/SKILL.md`
5. Test: "Day 2 Mittel" should auto-load correct Bronze-only medium pool with probabilities
