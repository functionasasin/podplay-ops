# Merchants

Merchants sell items during shop hours. Each merchant has a specialty and tier that determines what they offer.

## How to Look Up Merchant Info

When you encounter an unknown merchant:
1. Search KB first: `Grep` for merchant name in this file
2. If not found, check **bazaardb.gg**: `https://bazaardb.gg/search?c=merchants&q={name}`
3. If not found, check **thebazaar.wiki.gg**: `https://thebazaar.wiki.gg/wiki/{Name}`
4. To find what items a specific merchant sells for a hero, search: `"{merchant name}" {hero name} items` on bazaardb.gg or howbazaar.gg

## How to Find What Items Appear at a Merchant

Many item pages list which merchants sell them. To find a merchant's full inventory:
- On bazaardb.gg, each item card lists its merchant sources
- On howbazaar.gg/merchants, you can filter by hero and merchant
- Individual item wiki pages often list: "As {Hero}, you can find this item at {merchant list}"

## Shop Mechanics

All merchants show **3 items** per shop visit. Rerolling replaces all 3 with new random draws from the same pool.

## Tier Availability by Day

The day determines which item starting tiers can appear at ANY merchant:

| Day   | Item Tiers Available             |
|-------|----------------------------------|
| 1-2   | Bronze                           |
| 3-6   | Bronze + Silver                  |
| 7-8   | Bronze + Silver + Gold           |
| 9+    | Bronze + Silver + Gold + Diamond |

A Bronze merchant on Day 7 can show Bronze, Silver, AND Gold-start items.

## Merchant Tier and Day Availability

| Merchant Tier | First Appears | Reroll Cost |
|---------------|---------------|-------------|
| Bronze        | Day 1         | 2 gold      |
| Silver        | Day 3         | 4 gold      |
| Gold          | Day 7         | 6 gold      |
| Diamond       | Day 9         | 8 gold      |

## Known Merchants

### Jay Jay
- **Type**: General — "Sells Items"
- **Tier**: Bronze
- **First appears**: Day 1
- **Items per shop**: 3
- **Reroll cost**: 2 gold
- **Pool rule**: All items from hero's pool (excluding Monster items)
- **Note**: Good target for Generosity skill — sell items here to discount purchases.

### Aila
- **Type**: General — "Sells Items"
- **Tier**: Bronze
- **First appears**: Day 1
- **Items per shop**: 3
- **Reroll cost**: 2 gold
- **Pool rule**: All items from hero's pool (excluding Monster items)
- **Note**: Similar to Jay Jay, broad item pool.

### Kina
- **Type**: Non-Weapon — "Sells non-Weapon items"
- **Tier**: Bronze
- **First appears**: Day 1
- **Items per shop**: 3
- **Reroll cost**: 2 gold
- **Pool rule**: All non-Weapon items from hero's pool
- **Inventory**: Tools, Aquatic items, Apparel, Relics, etc. No weapons.

### Colt
- **Type**: Ammo — "Sells items with Ammo"
- **Tier**: Silver
- **First appears**: Day 3
- **Items per shop**: 3
- **Reroll cost**: 4 gold
- **Pool rule**: Items with Ammo type from hero's pool
- **Inventory**: Ammo weapons and Ammo support items.

### Mittel
- **Type**: Medium items — "Sells medium items"
- **Tier**: Bronze
- **First appears**: Day 2
- **Items per shop**: 3
- **Reroll cost**: 2 gold
- **Pool rule**: All Medium-size items from hero's pool

### Tok's Clocks
- **Type**: Speed — "Sells Haste, Slow and Cooldown items"
- **Tier**: Silver
- **First appears**: Day 3
- **Items per shop**: 3
- **Reroll cost**: 4 gold
- **Pool rule**: Items with Haste, Slow, or Cooldown types from hero's pool
- **Inventory**: Haste enablers, Slow items, Cooldown reduction items.

### Kev's Armory
- **Type**: Defense — "Sells Health, Shield items"
- **Tier**: Silver
- **First appears**: Day 3
- **Items per shop**: 3
- **Reroll cost**: 4 gold
- **Pool rule**: Items with Shield or Heal types from hero's pool
- **Inventory**: Shields, heals, defensive items.

### Ande
- **Type**: Small items — "Sells small items"
- **Tier**: Bronze
- **First appears**: Day 1
- **Items per shop**: 3
- **Reroll cost**: 2 gold
- **Pool rule**: All Small-size items from hero's pool

### Nautica
- **Type**: Aquatic — "Sells Aquatic items"
- **Tier**: Silver
- **First appears**: Day 3
- **Items per shop**: 3
- **Reroll cost**: 4 gold
- **Pool rule**: Items with Aquatic type from hero's pool
- **Note**: Sold Beach Ball, Fishing Rod, Ambergris (Aquatic items observed)
