# Game State Model

The complete state of a Bazaar run at any discrete decision point. This is what the EV engine needs to parse from a screenshot or reconstruct from conversation history.

## Decision Points

There are **four types** of decision points. Every hour except PvP presents **3 options** — the player picks one.

| Decision Type | When It Happens | What You Choose |
|---------------|-----------------|-----------------|
| **Event choice** | Hours 1, 2, 4, 5 (non-PvE, non-PvP) | Pick 1 of 3 events. Events include: shops (merchants), free items, skill trainers, enchantment stations, gold/XP rewards, special encounters |
| **PvE choice** | Hour 3 | Pick 1 of 3 PvE monster encounters. You see monster info and rewards before choosing. No Prestige risk — PvE losses are free |
| **Shop** | When you pick a merchant event | Buy/sell/reroll within that merchant's shop. ~3 items shown, can buy multiple if you can afford them |
| **Level-up / Upgrade** | On XP threshold | Pick from offered rewards (skill choice, item upgrade target, enchantment, etc.) |

### Day Structure

Each day follows this sequence:

```
PvP Fight (auto, results from previous day's board)
  │
  ├─ Hour 1: Pick 1 of 3 events
  ├─ Hour 2: Pick 1 of 3 events
  ├─ Hour 3: Pick 1 of 3 PvE encounters
  ├─ Hour 4: Pick 1 of 3 events
  ├─ Hour 5: Pick 1 of 3 events
  │
PvP Fight (next day boundary)
```

One of the 3 options each hour is typically an economic/free option (free item, gold, XP). Shops (merchants) are one possible event type — they are not guaranteed every hour.

## State Schema

### Run State

Top-level stats visible on the game screen.

| Field | Type | Description |
|-------|------|-------------|
| `hero` | string | Which hero (Vanessa, Dooley, Pygmalien, Mak, Stelle, Jules) |
| `day` | int | Current day number (1+) |
| `hour` | int | Current hour within the day (1-5) |
| `gold` | int | Current gold available to spend |
| `income` | int | Gold gained at start of each day |
| `prestige` | int | Run HP. Starts at 20. Lost on PvP losses (cost = day number). Reaches 0 → Fate's Crossroads → next loss ends run. Essentially unrecoverable. |
| `health` | int | Per-fight combat HP |
| `max_health` | int | Maximum combat HP |
| `level` | int | Current level (determines board slots, unlock thresholds) |
| `xp` | int | Current XP toward next level (8 XP per level). Sources: 1/hour auto, PvE performance, events |
| `wins` | int | Total PvP wins this run |
| `losses` | int | Total PvP losses this run |

### Board

Single horizontal row. **Position matters** — adjacency effects, left/right targeting, and "leftmost/rightmost" item triggers are real mechanics.

| Field | Type | Description |
|-------|------|-------------|
| `slots_total` | int | Total board size in slot-units. Starts at 4, maxes at 10 by Level 4 |
| `slots_used` | int | Currently occupied slots |
| `items` | array | Ordered list of items left-to-right |

Each board item:

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Item name |
| `size` | S/M/L | Small = 1 slot, Medium = 2 slots, Large = 3 slots |
| `tier` | string | bronze / silver / gold / diamond / legendary |
| `enchantment` | string? | Enchantment applied (fiery, toxic, turbo, etc.) or null |
| `position` | int | Slot index (0 = leftmost). Determines adjacency. |
| `types` | array | Item types (weapon, aquatic, friend, tech, etc.) |
| `ammo` | int? | Current ammo if applicable, null otherwise |

### Stash

Off-board storage. Items here are **inactive** — they don't participate in combat.

| Field | Type | Description |
|-------|------|-------------|
| `slots_total` | int | Always 10 size-units |
| `slots_used` | int | Currently occupied |
| `items` | array | Same fields as board items (minus position) |

### Skills

Passive abilities that persist for the entire run. Always visible on the game screen.

| Field | Type | Description |
|-------|------|-------------|
| `skills` | array | All skills currently held |

Each skill:

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Skill name |
| `tier` | string | bronze / silver / gold / diamond / legendary |
| `source` | string? | Where acquired (level-up trainer, event, PvE drop) |
| `effect` | string | What the skill does (passive buff, trigger condition, etc.) |

Skills are:
- **Permanent** once acquired (cannot be lost or sold)
- **Tiered** like items (bronze through legendary)
- Acquired from **level-up skill trainers** (levels 2, 5, 7, 8, 11, 14, 17, 19, 23) and **random events**
- Capacity is ~10 skills over a full run
- Often build-defining (e.g., Final Dose for Poison, Augmented Weaponry for Weapons)

### Current Decision

What the player is looking at right now.

**If event choice (most hours):**

| Field | Type | Description |
|-------|------|-------------|
| `type` | "event_choice" | |
| `options` | array[3] | Three events to choose between |

Each option:

| Field | Type | Description |
|-------|------|-------------|
| `event_type` | string | shop, free_item, skill_trainer, enchantment, gold_reward, xp_reward, special_event |
| `description` | string | What's visible about this option |
| `merchant` | object? | If shop: merchant name, tier, visible items |

**If PvE choice (hour 3):**

| Field | Type | Description |
|-------|------|-------------|
| `type` | "pve_choice" | |
| `encounters` | array[3] | Three monster encounters to choose between |

Each encounter:

| Field | Type | Description |
|-------|------|-------------|
| `monster` | string | Monster name |
| `tier` | string | Difficulty tier |
| `rewards` | object | Expected gold, XP, possible drops |
| `can_win` | bool? | Engine's assessment of whether current board beats this |

**If shop (inside a merchant event):**

| Field | Type | Description |
|-------|------|-------------|
| `type` | "shop" | |
| `merchant` | string | Merchant name (Jay Jay, Aila, Nautica, etc.) |
| `merchant_tier` | string | bronze / silver / gold / diamond |
| `items` | array | Items available for purchase |
| `reroll_cost` | int | Gold cost to reroll this shop |

Each shop item:

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Item name |
| `tier` | string | bronze / silver / gold / diamond |
| `price` | int | Gold cost |
| `enchantment` | string? | Pre-applied enchantment or null |
| `size` | S/M/L | Item size |

**If level-up / upgrade:**

| Field | Type | Description |
|-------|------|-------------|
| `type` | "level_up" | |
| `level` | int | Level being reached |
| `options` | array | Choices offered (skill picks, upgrade targets, items, enchantments) |

### Run History

Cumulative state maintained across the entire run. Critical for probability calculations.

| Field | Type | Description |
|-------|------|-------------|
| `items_seen` | array | Every item offered in every shop (feeds item pool probability) |
| `items_purchased` | array | Items bought (with day/gold cost) |
| `items_sold` | array | Items sold and when |
| `merchants_seen` | array | Every merchant encountered (name + tier + day) |
| `events_encountered` | array | Events seen and choices made |
| `pve_results` | array | PvE encounters fought, outcomes, drops |
| `skills_acquired` | array | Skills gained and when |
| `pvp_results` | array | Win/loss record with Prestige changes |

## What's NOT in Game State (Opponent Info)

PvP opponents are **blind** — you cannot see their board before a fight. This means:
- Opponent modeling is purely **predictive** (archetype distributions by day/meta)
- No reactive positioning against specific opponent items
- Win probability estimates are against expected opponent distributions, not known boards

## Board Layout Rules

- Single horizontal row of slots
- Small items occupy 1 slot, Medium 2, Large 3
- Board starts at 4 slots (Level 1), grows to 10 slots (Level 4)
- Player manually places items — **positioning is a real decision**
- Adjacency effects apply to items in neighboring slots
- "Leftmost" and "rightmost" item effects depend on actual position
- Board can be rearranged freely during non-combat phases

## Prestige Rules

- Start: 20 Prestige
- Loss cost: equal to current day number (Day 1 loss = -1, Day 10 loss = -10)
- Recovery: essentially none (Arken's Ring is extremely rare edge case)
- At 0: Fate's Crossroads event (one-time reprieve with 3 options)
- After Fate's Crossroads: next PvP loss ends the run
- **Implication**: Early losses are cheap, late losses are devastating. The engine must factor Prestige into EV — a risky play that might lose you a Day 8 fight costs 8 Prestige, which could end the run.
