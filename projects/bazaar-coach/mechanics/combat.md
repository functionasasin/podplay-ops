# Combat System

## Overview

Combat in The Bazaar is **fully automated** and happens in **real-time**. When a fight starts (PvE or PvP), both players' items activate independently based on their cooldown timers. You do not control actions during combat -- all strategy happens before the fight through item selection, positioning, and board layout.

## How Combat Works

1. Both players enter the arena with their board (rug) items active
2. All items begin charging simultaneously based on their individual cooldown timers
3. When an item's cooldown completes, it **triggers automatically**, applying its effects
4. Items continue cycling through their cooldowns until one player's health reaches zero
5. The fight ends when one player is eliminated

## Cooldown System

Every active item has a **cooldown** measured in seconds (typically ranging from 1 to 13 seconds). This is the time between activations.

### Cooldown Modifiers

| Effect   | Impact                                          |
|----------|-------------------------------------------------|
| Haste    | Item charges **twice as fast** (halved cooldown) |
| Slow     | Item charges at **half speed** (doubled cooldown) |
| Freeze   | Item **stops charging entirely** and cannot activate |
| Charge   | **Instantly advances** an item's cooldown timer  |

### Cooldown Reduction

- Adjacent items can passively reduce cooldowns (e.g., Star Chart reduces adjacent items' cooldowns by 10-25%)
- Skills can provide percentage-based cooldown reduction
- Some items grant cooldown reduction conditionally (e.g., only for Aquatic items, only for Weapons)
- Selling certain items can permanently reduce cooldowns of remaining items

### Simultaneous Triggers

When multiple items' cooldowns complete at the exact same moment, the game uses a **priority system** to determine which item triggers first. This priority value is an internal stat on each item.

## Item Trigger Types

Items activate through five different trigger mechanisms:

| Trigger Type     | When It Fires                                    |
|------------------|--------------------------------------------------|
| Cooldown         | After the item's cooldown timer completes (repeating) |
| On Condition     | When a specific condition is met (e.g., "when you deal damage") |
| Start of Combat  | Once, at the very beginning of a fight           |
| Start of Day     | Once, at the beginning of each new day            |
| Each Hour        | Once per hour of the day cycle                    |

## Damage Types

### Direct Damage
Reduces enemy health immediately when an item triggers.

### Burn (Damage over Time -- Fast Decay)
- Ticks **twice per second**
- Each tick deals damage equal to current Burn value, then **decreases by 1**
- Burn stacks additively from multiple sources
- **Shield halves** Burn damage per tick
- **Healing cleanses** Burn equal to 5% of the heal amount
- **Lifesteal does NOT cleanse** Burn
- Total unmitigated damage from N burn = N*(N+1)/2 (e.g., 10 burn = 55 total damage, 50 burn = 1,275 total damage)

### Poison (Damage over Time -- Stable)
- Ticks **once per second**
- Each tick deals damage equal to current Poison value
- Poison **does NOT decay** on its own -- it persists until cleansed
- **Poison bypasses Shield entirely** -- damages health directly
- **Healing cleanses** Poison equal to 5% of the heal amount
- **Lifesteal does NOT cleanse** Poison
- Poison stacks additively from multiple sources

## Defensive Mechanics

### Shield
- Absorbs incoming damage before health is touched
- **Reduces Burn damage by 50%** per tick
- **Does NOT block Poison** -- Poison bypasses Shield entirely
- Shield does not regenerate unless specifically granted by items/skills

### Heal
- Restores health up to Max Health (cannot overheal)
- **Cleanses 5% of heal amount** from both Poison and Burn (previously 10%, may vary by patch)
- Lifesteal healing does NOT cleanse Poison or Burn

### Regeneration (Regen)
- Heals the player by the Regen amount **once per second**
- Regen **can crit** (doubled healing)
- Regen reduces Poison by its amount before Poison deals damage each tick

### Lifesteal
- When dealing damage, recover health equal to the damage dealt
- **Lifesteal does NOT count as "healing"** for cleansing purposes -- it will not remove Poison or Burn

## Health and Max Health

- Each hero starts with a base Max Health value
- Max Health increases when you level up
- Items, skills, and events can increase Max Health (some permanently, some temporarily for a fight)
- You cannot heal above Max Health

## Critical Hits

- Items with cooldowns have a **Crit Chance** stat
- A critical hit **doubles** the item's active effects: Damage, Heal, Shield, Regeneration, Burn, and Poison
- Crit Chance can be increased by skills, enchantments (Deadly), and item effects
- Regen can also crit

## Ammo System

- Some items (especially Vanessa's weapons) have an **Ammo** count
- When an item runs out of Ammo, it stops charging and cannot activate for the rest of the fight
- Ammo **refills after each fight**
- Items and skills can reload Ammo mid-fight or increase max Ammo

## Multicast

- Items with Multicast activate their effect **multiple times** when they trigger
- Multicast effectively multiplies an item's output per activation
- Can be granted by the Shiny enchantment or specific skills/items

## Positioning and Adjacency

- Items on the board interact with their **adjacent neighbors** (items directly to their left and right)
- Some items buff or trigger based on the item to their left or right
- Skills like "Left-Handed" and "Right-Handed" buff the leftmost or rightmost item on your board
- Hovering over an item in-game highlights which items it affects with a blue glow
- **Positioning is a core strategic decision** -- reorder items to maximize adjacency synergies

## Combat Tips

- Fast-cooldown items trigger more often but usually deal less per hit
- Slow-cooldown items hit harder but are vulnerable to Freeze and Slow effects
- Poison builds counter Shield-heavy opponents
- Shield builds counter Burn-heavy opponents
- Healing counters both Poison and Burn but requires sustained output
- Adjacency effects compound -- placing synergistic items next to each other is critical
