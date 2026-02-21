# Bazaar EV Engine — Design Doc

**Date**: 2026-02-21
**Status**: Design
**Goal**: Transform the Bazaar coach from a vibes-based advisor into a computational EV (expected value) engine that recommends the highest-EV move at every decision point.

## Problem Statement

The current coach does what any experienced human player does: pattern match on "good items" and "good builds." It says "buy Pufferfish because it's S-tier" — advice any Diamond player already knows. It provides zero computational advantage over human intuition.

What a human **cannot** do is:
- Compute P(finding Shipwreck in next 5 shops) given items already seen and merchant tier distribution
- Simulate combat to determine that buying Beach Ball increases DPS from 47 to 63 (+34%)
- Calculate that saving 8g for tomorrow's Silver merchant has higher EV than buying today's B-tier item
- Evaluate all possible board configurations from current shop and rank by win probability
- Track the remaining item pool and compute exact reroll probabilities

The Bazaar is a **sequential decision problem with computable mechanics**. It should be treated like chess or poker, not like a vibes conversation.

## Why This Is Computable

The Bazaar has several properties that make it amenable to exact computation:

| Property | Implication |
|----------|-------------|
| **Deterministic combat** | Given two boards, outcome is fully simulatable. Items trigger on fixed cooldowns. No micro or reaction time. |
| **Known item pools** | Vanessa has 127 items. Track what's been seen. Compute remaining pool probabilities. |
| **Finite action space** | At any shop: buy A, buy B, buy C, sell X, reroll, skip. ~10-15 actions to evaluate. |
| **Fixed merchant progression** | Bronze Day 1, Silver Day 3, Gold Day 7, Diamond Day 9. Known tier distribution. |
| **Quantifiable combat mechanics** | Burn = N*(N+1)/2 total damage. Poison = N/sec persistent. Haste = 2x speed. All computable. |
| **Gold as scarce resource** | Every decision has an opportunity cost measured in gold. EV = power_gained / gold_spent vs alternatives. |

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    EV ENGINE                             │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ Game State   │  │ Probability  │  │ Combat         │  │
│  │ Model        │──│ Engine       │  │ Simulator      │  │
│  │              │  │              │  │                │  │
│  │ • Board      │  │ • Item pool  │  │ • Tick-based   │  │
│  │ • Gold/Inc   │  │ • P(item X)  │  │ • DPS calc     │  │
│  │ • Day/Hour   │  │ • P(merchant)│  │ • Win prob     │  │
│  │ • Items seen │  │ • Reroll EV  │  │ • Board power  │  │
│  └──────┬───────┘  └──────┬───────┘  └───────┬────────┘  │
│         │                 │                   │           │
│         └────────┬────────┴───────────┬───────┘           │
│                  │                    │                    │
│           ┌──────▼──────┐    ┌───────▼─────────┐         │
│           │ EV          │    │ Pro Player       │         │
│           │ Calculator  │◄───│ Pattern Match    │         │
│           │             │    │                  │         │
│           │ • Buy EV    │    │ • State→Decision │         │
│           │ • Sell EV   │    │ • Win rate data  │         │
│           │ • Reroll EV │    │ • Strategy tags  │         │
│           │ • Skip EV   │    │                  │         │
│           └──────┬──────┘    └──────────────────┘         │
│                  │                                        │
│           ┌──────▼──────┐                                 │
│           │ Move Ranker │                                 │
│           │             │                                 │
│           │ Rank all    │                                 │
│           │ actions by  │                                 │
│           │ EV, output  │                                 │
│           │ best move   │                                 │
│           └─────────────┘                                 │
└──────────────────────────────────────────────────────────┘
```

## Layer 1: Structured Item Data

All item data must be machine-computable, not prose descriptions. Convert from markdown to structured JSON.

### Schema

```json
{
  "id": "pufferfish",
  "name": "Pufferfish",
  "hero": "vanessa",
  "size": "medium",
  "types": ["aquatic", "friend", "haste", "poison"],
  "trigger": "cooldown",
  "tiers": {
    "bronze": {
      "cooldown": 7.0,
      "effects": [
        { "type": "poison", "value": 3, "target": "enemy" },
        { "type": "self_trigger", "condition": "on_haste", "description": "Activates when gaining Haste" }
      ]
    },
    "silver": {
      "cooldown": 6.0,
      "effects": [
        { "type": "poison", "value": 6, "target": "enemy" }
      ]
    },
    "gold": {
      "cooldown": 5.0,
      "effects": [
        { "type": "poison", "value": 9, "target": "enemy" }
      ]
    },
    "diamond": {
      "cooldown": 4.0,
      "effects": [
        { "type": "poison", "value": 12, "target": "enemy" }
      ]
    }
  },
  "enchantment_priority": ["toxic", "shiny", "turbo"],
  "merchants": ["jay_jay", "aila", "nautica"]
}
```

### Effect Types

Standardize all item effects into computable types:

| Effect Type | Fields | Example |
|-------------|--------|---------|
| `damage` | `value`, `target` | Deal 40 damage |
| `burn` | `value`, `target` | Apply 10 Burn |
| `poison` | `value`, `target` | Apply 6 Poison |
| `heal` | `value`, `target` | Heal 20 |
| `shield` | `value`, `target` | Gain 30 Shield |
| `haste` | `targets`, `count`, `duration` | Haste 2 items for 3s |
| `slow` | `targets`, `count`, `duration` | Slow 1 enemy item 3s |
| `freeze` | `targets`, `count`, `duration` | Freeze 1 enemy item 2s |
| `multicast` | `value` | Multicast: 3 |
| `crit_bonus` | `value` | +10% Crit Chance |
| `ammo` | `value` | 4 Ammo |
| `charge` | `value`, `target` | Charge adjacent items 2s |
| `cooldown_reduction` | `value`, `target` | Adjacent items -15% cooldown |
| `conditional` | `condition`, `effect` | When using Weapons: +5 damage |
| `scaling` | `trigger`, `stat`, `per_stack` | +2 Poison per Haste gained |
| `buff_type` | `item_type`, `stat`, `value` | Weapons gain +5 damage |
| `passive_trigger` | `condition`, `effect` | When using left Weapon: deal 10 damage |

### Data Location

```
projects/bazaar-coach/data/
├── items/
│   ├── vanessa.json          # All 127 Vanessa items, structured
│   ├── dooley.json           # Future heroes
│   └── _schema.json          # Item schema definition
├── merchants/
│   ├── merchant-pools.json   # Which merchants sell which items
│   └── tier-schedule.json    # Merchant tier → day availability
├── mechanics/
│   ├── combat-rules.json     # Tick rate, Burn formula, Poison rules, etc.
│   └── economy-rules.json    # Reroll costs, sell prices, income rules
└── meta/
    └── opponent-archetypes.json  # Reference opponent boards by day
```

## Layer 2: Game State Model

Structured representation populated from screenshot analysis.

```json
{
  "run": {
    "hero": "vanessa",
    "day": 5,
    "hour": 3,
    "gold": 14,
    "income": 7,
    "prestige": 16,
    "health": 200,
    "max_health": 200,
    "level": 7,
    "wins": 2,
    "losses": 1
  },
  "board": [
    {
      "item_id": "pufferfish",
      "tier": "silver",
      "enchantment": "toxic",
      "position": 0,
      "ammo": null
    },
    {
      "item_id": "jellyfish",
      "tier": "bronze",
      "enchantment": null,
      "position": 1,
      "ammo": null
    },
    {
      "item_id": "beach_ball",
      "tier": "bronze",
      "enchantment": null,
      "position": 2,
      "ammo": null
    }
  ],
  "stash": [],
  "shop": {
    "merchant": "jay_jay",
    "merchant_tier": "silver",
    "items": [
      { "item_id": "catfish", "tier": "bronze", "price": 8, "enchantment": null },
      { "item_id": "bayonet", "tier": "bronze", "price": 5, "enchantment": null },
      { "item_id": "handaxe", "tier": "bronze", "price": 4, "enchantment": null }
    ],
    "reroll_cost": 4
  },
  "history": {
    "items_seen": ["pufferfish", "jellyfish", "beach_ball", "lighter", "bayonet"],
    "items_purchased": ["pufferfish", "jellyfish", "beach_ball"],
    "merchants_seen": ["jay_jay", "aila", "kina", "jay_jay"],
    "rerolls_this_shop": 0
  }
}
```

### State Tracking Across the Run

The engine should maintain cumulative state across multiple screenshots/queries within a run. Key fields to track:

- **items_seen**: Every item offered in every shop. Informs probability calculations.
- **merchants_seen**: Every merchant encountered. Informs merchant distribution model.
- **decisions_made**: What was bought/sold/skipped and why. Enables retrospective analysis.
- **combat_results**: Win/loss and approximate board power of opponents faced. Calibrates opponent model.

## Layer 3: Probability Engine

### Item Pool Probability

Given:
- Hero item pool: 127 items (Vanessa), distributed across sizes and types
- Current day → merchant tier distribution
- Items at Diamond → removed from pool
- Merchant specialization → narrows pool

Calculate:
- `P(item X | merchant M, tier T)` = items matching M's specialization at tier T / total items in M's pool
- `P(item X in next shop)` = Σ over possible merchants × P(item X | merchant)
- `P(item X within N shops)` = 1 - (1 - P(item X in single shop))^N
- `P(finding upgrade for item Y)` = P(seeing same item at same or lower tier)

### Merchant Appearance Probability

Model which merchants appear at each hour/day. Inputs:
- Day determines which tiers are available (Bronze always, Silver from Day 3, Gold from Day 7, Diamond from Day 9)
- Hours 0, 1, 3, 4 can have merchants (Hour 2 is PvE, Hour 5 is PvP)
- Multiple merchants can appear per hour (choose one)

### Reroll EV

```
EV(reroll) = P(shop contains item with power_delta > threshold)
             × E[power_delta | item is good enough]
             - reroll_cost
```

This requires knowing the item pool probabilities and being able to estimate power_delta for items that might appear.

### Upgrade Probability

```
P(upgrade item X) = P(seeing item X at current tier in next N shops)
```

Factor in:
- Multiple copies needed (Bronze→Silver needs 1 dup, Silver→Gold needs another)
- Day progression (higher tier merchants have different pools)
- Whether to actively seek upgrades vs wait for natural appearance

## Layer 4: Combat Simulator

### Tick-Based Simulation

```
INITIALIZE:
  For each item on both boards:
    Set cooldown_remaining = item.cooldown
    Set ammo_remaining = item.ammo (if applicable)
    Apply start_of_combat effects

LOOP (tick = 0.1s increments):
  For each item (sorted by priority):
    If frozen: skip
    If hasted: advance cooldown by 0.2s (2x speed)
    Else if slowed: advance cooldown by 0.05s (0.5x speed)
    Else: advance cooldown by 0.1s

    If cooldown_remaining <= 0:
      If ammo_remaining == 0: skip (item depleted)
      TRIGGER item:
        Apply effects × multicast
        If crit (roll against crit_chance): double all effects
        Consume 1 ammo (if applicable)
        Reset cooldown_remaining = item.cooldown

  Apply Burn ticks (every 0.5s):
    damage = current_burn_stacks
    If shielded: damage *= 0.5
    Apply damage to health
    burn_stacks -= 1 (if tick boundary)

  Apply Poison ticks (every 1.0s):
    damage = current_poison_stacks
    Apply damage to health (bypasses shield)

  Apply Regen ticks (every 1.0s):
    heal = regen_value
    If crit: heal *= 2
    Reduce poison by regen_value
    Apply heal (cap at max_health)

  Check win condition: if either player health <= 0, end

RETURN:
  winner, time_to_kill, damage_dealt, damage_taken
```

### Board Power Score

Normalize combat results into a single score:

```
board_power = f(DPS, effective_HP, time_to_kill_vs_reference)
```

Where `reference` is a set of representative opponent boards at the current day level. The reference boards come from:
1. Known meta builds at each day's power level
2. Pro player game states extracted from transcripts
3. Empirical calibration over time

### Win Probability

```
win_prob(board_A, day) = Σ P(opponent_archetype_i at day)
                         × win_prob(board_A vs archetype_i)
```

Where opponent archetypes are representative boards weighted by meta frequency.

## Layer 5: EV Calculator

For each possible action at the current decision point:

### Buy Item X (cost: N gold)

```
new_board = optimize_position(current_board + item_X)
power_delta = board_power(new_board) - board_power(current_board)
remaining_gold = gold - cost

# Opportunity cost: what else could this gold buy?
future_shop_ev = E[best_item_power_delta in remaining shops today] × P(can afford it)
opportunity_cost = future_shop_ev × (cost / remaining_gold_before)

# Synergy trajectory: does this item unlock future power?
trajectory_bonus = Σ P(finding synergy_item_i) × power_delta_with_synergy_i

EV_buy = power_delta + trajectory_bonus - opportunity_cost
EV_per_gold = EV_buy / cost
```

### Sell Item Y (gain: M gold)

```
new_board = current_board - item_Y
power_delta = board_power(new_board) - board_power(current_board)  # Usually negative
gold_gained = sell_value(Y)
future_buy_ev = E[best_purchasable_item_power_delta] × P(good_item_in_remaining_shops)

EV_sell = power_delta + (gold_gained × future_buy_ev_per_gold)
```

### Reroll (cost: R gold)

```
pool = remaining_items_for_merchant(current_merchant)
for each item_i in pool:
  p_i = P(item_i appears in rerolled shop)
  ev_i = EV_buy(item_i) if EV_buy(item_i) > 0 else 0

EV_reroll = Σ (p_i × ev_i) - R
```

### Skip (save gold)

```
future_value = Σ over remaining hours today and future days:
  P(merchant_at_hour) × E[best_item_ev | can_afford_with_saved_gold]
  - E[best_item_ev | can_afford_without_saved_gold]

EV_skip = future_value
```

### Move Ranking

Sort all actions by EV. Present the top actions with:
- EV score and EV/gold
- Win rate delta
- Key reasoning (which synergy, which probability drove the decision)
- Confidence level (how sensitive is the recommendation to model assumptions)

## Layer 6: Pro Player Pattern Matching

### Structured Transcript Tags

When extracting knowledge from pro player transcripts, tag each decision with:

```json
{
  "player": "kripparrian",
  "video_id": "abc123",
  "timestamp": "14:32",
  "game_state": {
    "hero": "vanessa",
    "day": 5,
    "build_archetype": "poison_haste",
    "board_power_estimate": "medium",
    "gold": 12,
    "key_items": ["pufferfish", "jellyfish"]
  },
  "decision": {
    "action": "skip",
    "reasoning": "saving for silver merchant tomorrow, nothing in shop advances the build",
    "alternatives_considered": ["buy bayonet"]
  },
  "outcome": {
    "final_wins": 8,
    "run_result": "good"
  }
}
```

### Pattern Matching

When evaluating moves, query the transcript database:
1. Find decisions where game state is similar (same hero, similar day, similar build, similar gold)
2. Weight by player skill and run outcome
3. Surface as supporting evidence: "Kripp faced a similar state 3 times and skipped 2/3, with 75% win rate on skips vs 50% on buys"

This is a **secondary signal**, not the primary driver. The EV calculation is primary. Pro patterns serve as:
- Sanity check on the model
- Coverage for edge cases the model doesn't handle well
- Training data for calibrating the model

## Output Format

### Standard Move Recommendation

```
┌─ DAY 5 | HOUR 3 | 14g | Poison/Haste Build ──────────────┐
│                                                             │
│  BOARD: [Silver Pufferfish†] [Bronze Jellyfish] [Bronze BB] │
│  † = Toxic enchantment                                      │
│  Board Power: 47.2 DPS | Win Rate: 58% vs Day 5 meta       │
│                                                             │
│  SHOP (Jay Jay, Silver):                                    │
│  ┌──────────────┬────────┬─────────┬───────────────────────┐│
│  │ Action       │ WR Δ   │ EV/Gold │ Key Factor            ││
│  ├──────────────┼────────┼─────────┼───────────────────────┤│
│  │ Buy Catfish  │ +14.2% │ +1.78   │ Haste-scaling Poison  ││
│  │ 8g           │        │         │ DPS: 47→68 (+44%)     ││
│  ├──────────────┼────────┼─────────┼───────────────────────┤│
│  │ Skip         │ +6.3%  │ +0.45   │ Save for Day 6 Silver ││
│  │ save 14g     │        │         │ P(Shipwreck D6-10)=34%││
│  ├──────────────┼────────┼─────────┼───────────────────────┤│
│  │ Reroll       │ +4.8%  │ +1.20   │ P(A+ item)=12%       ││
│  │ 4g           │        │         │ P(Shipwreck)=2.1%     ││
│  ├──────────────┼────────┼─────────┼───────────────────────┤│
│  │ Buy Bayonet  │ +3.1%  │ +0.62   │ Off-archetype, weak   ││
│  │ 5g           │        │         │ No Poison/Haste syn.  ││
│  └──────────────┴────────┴─────────┴───────────────────────┘│
│                                                             │
│  >>> BUY CATFISH (highest EV by 1.5x margin)               │
│  Confidence: HIGH — clear best action                       │
│  Pro match: Rhapsody bought Catfish in similar spot (2/2    │
│  times observed, both 8+ win runs)                          │
└─────────────────────────────────────────────────────────────┘
```

### Upgrade Decision

```
LEVEL UP — Choose upgrade target:
┌────────────────────┬─────────┬──────────────────────────┐
│ Upgrade            │ WR Δ    │ Impact Analysis          │
├────────────────────┼─────────┼──────────────────────────┤
│ Pufferfish S→G     │ +11.3%  │ Poison 6→9/cast (+50%)   │
│                    │         │ CD 6.0→5.0s (+20% freq)  │
│                    │         │ Net DPS: +38%            │
├────────────────────┼─────────┼──────────────────────────┤
│ Beach Ball B→S     │ +7.8%   │ Haste targets 2→3       │
│                    │         │ Enables perma-haste on   │
│                    │         │ Catfish (if acquired)    │
├────────────────────┼─────────┼──────────────────────────┤
│ Jellyfish B→S      │ +4.1%   │ Poison 3→5 (+67%)       │
│                    │         │ But lower base impact    │
└────────────────────┴─────────┴──────────────────────────┘

>>> UPGRADE PUFFERFISH (highest immediate + scaling value)
```

## Implementation Phases

### Phase 1: Data Foundation
- Convert Vanessa's 127 items from markdown to structured JSON
- Build merchant pool mappings
- Define combat mechanics as computable rules
- Create item effect type system

### Phase 2: Board Power Calculator (Simplified)
- Heuristic DPS calculator that accounts for cooldowns, damage, Burn/Poison formulas
- Doesn't need full tick simulation initially — approximate
- Factor in Haste/Slow effects on effective cooldown
- Calibrate against known strong vs weak boards from pro data

### Phase 3: Shop EV Calculator
- For each shop item, compute power delta vs current board
- Factor in gold cost and opportunity cost
- Compare buy vs reroll vs skip
- This is the first "useful" output — already better than vibes

### Phase 4: Probability Engine
- Track items seen across the run
- Compute P(specific item in next N shops)
- Factor into EV calculations (save gold if high P of key item soon)
- Compute reroll EV from remaining pool

### Phase 5: Full Combat Simulator
- Tick-based engine handling all mechanics
- Win probability against reference opponent boards
- Replaces heuristic DPS with precise simulation

### Phase 6: Pro Player Integration
- Structure transcript extractions with game state tags
- Pattern match current state against pro decisions
- Use as calibration data and secondary signal

## What This Changes in the Coach

The CLAUDE.md instructions shift from:
- "Search KB, find relevant strategy, give 3-5 bullets" (qualitative)

To:
- "Parse game state into structured model, run EV calculations, rank all possible actions, present the highest-EV move with quantitative justification" (computational)

The coach personality stays the same (direct, specific, no hedging). But the reasoning behind recommendations becomes **mathematical** rather than **heuristic**.

## Open Questions

1. **Opponent modeling**: How do we model what boards opponents have at each day? Start with archetypes from pro data + meta knowledge, refine over time.
2. **Combat sim accuracy**: Full tick simulation is complex. Start with DPS approximation and iteratively improve.
3. **Screenshot parsing reliability**: Vision extraction may miss item names or tiers. Need confidence scoring on parsed state.
4. **Item interaction completeness**: Some items have complex conditional effects. The JSON schema needs to handle edge cases (e.g., "when using left Weapon", "per Aquatic item on board").
5. **Runtime**: Can EV calculations complete fast enough for real-time coaching? Likely yes — action space is small (~15 options), combat sim is fast for 7-10 items.
6. **Build trajectory planning**: Current design evaluates one decision at a time. Future: multi-step lookahead ("if I buy Catfish now AND find Shipwreck by Day 8, my win rate is X").
