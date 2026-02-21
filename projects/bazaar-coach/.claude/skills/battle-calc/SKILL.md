---
name: battle-calc
description: Calculate battle outcomes in The Bazaar. Use when comparing boards, evaluating PvE encounters, or deciding whether to take a fight.
user-invocable: true
allowed-tools: Read, Grep, Glob, WebFetch, WebSearch
argument-hint: [enemy-name or description]
---

# Battle Outcome Calculator

Calculate whether the user's current board wins or loses a fight, and at what second they die or kill the opponent.

## Steps

1. **Gather user board state**: Read the current board from conversation context — items, tiers, sizes, positions, skills, enchantments. If unclear, ask.

2. **Gather enemy board state**: Look up enemy items/stats from the KB first (`mechanics/`, `items/`), then online (thebazaar.wiki.gg, bazaardb.gg) if needed. For PvE monsters, find their HP, items, skills, and tier.

3. **Calculate enemy DPS to user**:
   - Sum all fight-start effects (Burn, Poison, Damage, Shield)
   - Calculate per-second damage from cooldown-based items
   - Use Burn formula: N Burn ticks 2x/sec, each tick deals current value then decreases by 1. Total = N*(N+1)/2. Account for new Burn being added (stacking keeps it topped up)
   - Use Poison formula: ticks 1x/sec, does NOT decay. Stacks additively.
   - Account for Slow/Freeze/Haste effects on cooldowns
   - Note any threshold triggers (e.g., "when enemy below 50% HP, Burn 15")

4. **Calculate user DPS to enemy**:
   - Same process for user's board
   - Account for stacking buffs (e.g., Sharkclaws adds +X damage to weapons PER TRIGGER, cumulative for the fight)
   - Account for Haste from Beach Ball, Zoarcid, etc. (Haste = items charge 2x fast)
   - Account for Crit chance and double damage on crit
   - Track damage ramp-up over time (early seconds vs late seconds differ hugely)

5. **Calculate user HP timeline**:
   - Start with user's Max HP + any Regen
   - Subtract enemy damage per second (accounting for Shield, Heal, Regen)
   - Find the second at which user HP hits 0
   - Note any death prevention (Life Preserver)

6. **Calculate enemy HP timeline**:
   - Start with enemy's Max HP
   - Subtract user damage per second (accounting for enemy Shield, Heal, Regen)
   - Find the second at which enemy HP hits 0

7. **Compare**: Who dies first? By how much? Is it close or a blowout?

## Output Format

```
ENEMY: [Name] — [HP] HP
  Items: [list with tiers]
  Skills: [list]
  DPS breakdown: [itemized]

YOUR BOARD: [HP] HP
  Items: [list with tiers]
  Skills: [list]
  DPS breakdown: [itemized]

TIMELINE:
  t=0s:  [fight start effects]
  t=3s:  [key triggers]
  t=5s:  [state check]
  t=10s: [state check]
  ...continue until someone dies

RESULT: [WIN/LOSE] at ~[X] seconds
  Your HP remaining: [X] (or time of death: [X]s)
  Enemy HP remaining: [X] (or time of death: [X]s)
  Confidence: [HIGH/MEDIUM/LOW] — [reason if not high]
```

## Important Notes

- Always check `mechanics/keywords.md` for exact Burn/Poison/Haste/Slow formulas
- Sharkclaws and similar "for the fight" buffs STACK per trigger — don't treat as flat
- Haste doubles charge speed, Slow halves it
- Freeze completely stops an item
- Beach Ball/Astrolabe haste multiple items — account for cascading speed increases
- If you don't know the user's HP, ask before calculating
- Be conservative — if the fight is close, recommend against taking it
- Account for Clamera/Slow disrupting enemy items at fight start
