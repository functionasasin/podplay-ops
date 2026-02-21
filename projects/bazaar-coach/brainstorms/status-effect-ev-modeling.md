# Brainstorm: Status Effect EV Modeling

**Date**: 2026-02-21
**Problem**: Status effects (Burn, Poison, Slow, Haste, Crit, Shield, Freeze, Charge) are non-linear. A human looks at "Burn 10" and intuits "that's a lot of damage." An EV engine needs to convert these into a single comparable number. How?

---

## The Core Problem

Direct damage is trivial to value: "Deal 40 Damage" on a 5s cooldown = 8 DPS. Done.

But status effects are context-dependent and non-linear:
- **Burn 10** = 55 total damage (quadratic), but Shield halves it
- **Poison 5** = 5 DPS forever... but "forever" depends on fight length, and it stacks
- **Slow 1 item 3s** = depends entirely on WHICH item gets slowed
- **Haste 2 items 3s** = depends on which items get hasted and their cooldowns
- **Crit** = multiplicative with everything else

A naive approach of "Burn 10 = 55 damage = equivalent to 55 direct damage" is wrong because it ignores fight context, application frequency, stacking, and counter-play.

---

## Effect-by-Effect Analysis

### 1. Burn — Quadratic Decay

**Mechanics** (confirmed from KB):
- Ticks **2x/sec** (every 0.5s)
- Each tick: deal damage = current_burn, then burn -= 1
- Total unmitigated: **N × (N+1) / 2**
- Duration: **N/2 seconds** (N ticks × 0.5s/tick)
- Shield **halves** damage per tick
- Heal cleanses Burn equal to **5% of heal amount**
- Stacks additively

**Why it's non-linear**: The marginal value of +1 Burn increases with existing Burn.

| Starting Burn | +10 Burn Added | New Total Damage | Marginal Damage from +10 |
|---------------|---------------|------------------|--------------------------|
| 0             | 10            | 55               | 55                       |
| 10            | 20            | 210              | 155                      |
| 20            | 30            | 465              | 255                      |
| 30            | 40            | 820              | 355                      |
| 50            | 60            | 1,830            | 555                      |

Going from 0→10 Burn gives 55 damage. Going from 50→60 gives 555. **Burn has increasing returns to scale.** This means the more Burn you already have, the more valuable additional Burn is.

**EV Formula Proposal — Burn DPS**:
```
For an item that applies B Burn every C seconds:

Burn resolves in B/2 seconds.
If C > B/2 (item slower than burn duration):
  Stacks don't overlap. Each application = B*(B+1)/2 damage.
  Effective DPS = B*(B+1) / (2*C)

If C < B/2 (item faster than burn duration):
  Stacks overlap! At steady state, residual burn R remains when next application hits.
  R = B - 2*C (burn remaining after C seconds at 2 ticks/sec)
  New burn = R + B
  This compounds. Steady-state average burn level ≈ B²/(2*C) [needs sim to confirm]
  Effective DPS ≈ steady_state_burn × 2 (since it ticks 2x/sec)
```

**Key insight**: Burn items that apply on overlapping timers create super-linear stacking. Two Burn items together are worth more than the sum of their parts.

**Against Shield**:
```
effective_burn_dps = burn_dps × 0.5 (while shield exists)
                   = burn_dps × 1.0 (after shield is depleted)
```
Need to model how fast shield depletes from other damage sources, then burn shifts from half to full damage.

**EV conversion for board comparison**:
```
burn_ev(item) = Σ over fight duration:
  per_application_damage(B, shield_active) / C
  × crit_multiplier(1 + crit_chance)
  × multicast_multiplier
  × haste_multiplier (2 if hasted, 0.5 if slowed, 1 otherwise)
```

### 2. Poison — Infinite Accumulator

**Mechanics**:
- Ticks **1x/sec** (every 1.0s)
- Each tick: deal damage = current_poison (does NOT decay)
- **Bypasses Shield entirely**
- Heal cleanses 5% of heal amount from Poison
- Regen reduces Poison before damage each tick
- Stacks additively

**Why it's non-linear**: Poison accumulates. Each application permanently raises the DPS for the rest of the fight.

**For an item applying P Poison every C seconds over a fight of length F**:

```
Applications: k = floor(F/C) + 1 (including t=0)

At time t between application i and i+1:
  poison_level = i × P (ignoring cleansing)

Total Poison damage over fight:
  = P × C × [k × (k-1) / 2] + P × k × remainder
  ≈ P × F² / (2 × C)   [simplified for long fights]
```

**Example**: Pufferfish Silver (6 Poison, 6s CD) over a 20-second fight:
```
Applications: t=0 (6), t=6 (12), t=12 (18), t=18 (24)
k = 4 applications

Poison timeline:
  t=0-5:   6 poison  → 6×6  = 36 damage
  t=6-11:  12 poison → 12×6 = 72 damage
  t=12-17: 18 poison → 18×6 = 108 damage
  t=18-20: 24 poison → 24×2 = 48 damage (only 2 seconds left)

Total: 36 + 72 + 108 + 48 = 264 damage over 20s
Average DPS: 264/20 = 13.2 DPS
```

Compare: a weapon doing 6 direct damage every 6s = 1 DPS. The same "6" as Poison is worth **13x more** over a 20s fight.

**But fight length matters enormously**:
| Fight Length | Poison 6 / 6s CD Total Damage | Effective DPS |
|-------------|------------------------------|---------------|
| 5s          | 6×5 = 30                     | 6.0           |
| 10s         | 6×4 + 12×4 = 72             | 7.2           |
| 20s         | 264 (see above)              | 13.2          |
| 30s         | ~720                         | 24.0          |
| 60s         | ~3,300                       | 55.0          |

**Key insight**: Poison's EV is **quadratic in fight length**. Short fights → Poison is mediocre. Long fights → Poison is absurdly broken. This is why Poison builds often run defensive items to stall.

**Against Shield**: Irrelevant. Poison bypasses Shield. This makes Poison uniquely valuable against Shield-heavy opponents — it's literally unblockable damage.

**Against Heal/Regen**: This is Poison's counter.
```
effective_poison_per_tick = poison_level - regen_level
If opponent heals H every T seconds:
  poison_cleansed_per_heal = 0.05 × H
  effective_poison_growth = P/C - (0.05 × H)/T
  If this is negative, Poison can't outscale the healing
```

**EV conversion**:
```
poison_ev(item) = Σ over assumed fight duration:
  accumulating_poison_dps(P, C, t)
  × crit_multiplier
  × multicast_multiplier
  × haste_multiplier
  - estimated_cleansing(opponent_heal, opponent_regen)
```

### 3. Slow — Enemy DPS Reducer

**Mechanics**:
- Slowed items charge at **half speed** (effectively doubles their cooldown)
- Duration-based (e.g., "Slow 1 item 3 seconds")
- Targets enemy items (usually random or specific)

**EV conversion**:
```
Slow removes enemy DPS for the duration.

If you Slow the enemy's best item (X DPS) for S seconds every C seconds:
  enemy_dps_reduction = X × (S / C) × 0.5
  (0.5 because Slow halves speed, not stops it)

Wait — Slow halves charge speed, so during S seconds of slow, the item
produces half its normal output. DPS reduction = X × 0.5 × (S / C)

If you Slow a random item:
  average_enemy_item_dps = total_enemy_dps / num_enemy_items
  dps_reduction = average_enemy_item_dps × 0.5 × (S / C)
```

**Key insight**: Slow's value depends entirely on the opponent's board. Slowing a 50 DPS Lighthouse for 3s is game-changing. Slowing a 2 DPS Coral is nothing. For EV purposes, model against "average opponent DPS per item."

**But Slow also triggers other effects**: Many Vanessa items trigger "When you Slow" — Lighthouse charges, Darkwater Anglerfish charges, Cauterizing Blade gains damage. So Slow has **trigger value** beyond the DPS reduction itself.

```
slow_ev(item) = enemy_dps_reduction + trigger_value
  trigger_value = Σ (items that trigger on Slow) × their_per_trigger_value
```

### 4. Haste — Own DPS Multiplier

**Mechanics**:
- Hasted items charge at **2x speed** (effectively halves cooldown)
- Duration-based (e.g., "Haste 2 items 3 seconds")
- Targets your own items

**EV conversion**:
```
If you Haste your best item (X DPS) for H seconds every C seconds:
  own_dps_increase = X × 1.0 × (H / C)
  (1.0 because Haste doubles speed, so item produces double output during H seconds)

For hasting random items:
  average_item_dps = total_own_dps / num_own_items
  dps_increase = average_item_dps × 1.0 × (H / C) × items_hasted
```

**Key insight**: Haste on a 1 DPS item = +1 DPS. Haste on a 20 DPS item = +20 DPS. **Haste is a multiplier, and multipliers are only as good as what they multiply.** This is why Haste is critical in Poison builds — it doubles Pufferfish output AND triggers Pufferfish's passive.

**Haste also triggers**: Pufferfish activates on any Haste gained. So:
```
haste_ev(item) = dps_increase + trigger_value
  trigger_value = pufferfish_activation_ev × num_haste_triggers
```

### 5. Freeze — Hard Disable

**Mechanics**:
- Frozen items **completely stop charging** and cannot activate
- Duration-based
- Flying halves Freeze duration
- Radiant enchantment = immune

**EV conversion**:
```
freeze_ev = enemy_item_dps × freeze_duration / application_cooldown
```

Freeze is strictly better than Slow (100% reduction vs 50% reduction), but rarer and often shorter duration.

### 6. Crit — Universal Multiplier

**Mechanics**:
- Doubles ALL active effects: Damage, Heal, Shield, Regen, Burn, Poison
- Base crit = 0% unless granted
- Deadly enchantment = +50%

**EV conversion**:
```
crit_multiplier = 1 + crit_chance

For an item with 20% crit:
  effective_output = base_output × 1.2
```

**Key insight**: Crit is multiplicative with everything else. 20% crit on a Burn 10 item means expected Burn per activation = 12 (10 × 1.2). But because Burn is quadratic, the expected total damage is:
```
E[damage] = 0.8 × 10×11/2 + 0.2 × 20×21/2
          = 0.8 × 55 + 0.2 × 210
          = 44 + 42 = 86

NOT: 12 × 13 / 2 = 78 (wrong! can't take expected value before applying quadratic)
```

**This is critical**: For non-linear effects, you can't just multiply the expected input. You have to compute expected OUTPUT. The crit doubles burn THEN the quadratic applies, so critting on Burn is worth more than the linear crit multiplier suggests.

```
Correct formula for Burn with crit:
E[burn_damage] = (1 - crit) × B(B+1)/2 + crit × (2B)(2B+1)/2
               = (1 - crit) × B(B+1)/2 + crit × (4B² + 2B)/2
               = (1 - crit) × B(B+1)/2 + crit × (2B² + B)

Compare to naive: (B × (1+crit)) × (B × (1+crit) + 1) / 2

At B=10, crit=0.2:
  Correct: 0.8 × 55 + 0.2 × 210 = 86
  Naive:   12 × 13 / 2 = 78
  Error: 10% undervaluation
```

### 7. Shield — Damage Absorption

**Mechanics**:
- Absorbs direct damage 1:1
- Halves Burn damage per tick
- Bypassed entirely by Poison
- Doesn't regenerate unless granted

**EV as effective HP**:
```
shield_ev = shield_amount × effectiveness_multiplier

Where effectiveness depends on what the opponent deals:
  vs pure Direct Damage: multiplier = 1.0
  vs Burn-heavy: multiplier = 2.0 (shields last twice as long vs burn)
  vs Poison-heavy: multiplier = 0.0 (shield does nothing vs poison)
  vs mixed: weighted average
```

### 8. Charge — Cooldown Acceleration

**Mechanics**:
- Instantly advances an item's cooldown by X seconds

**EV conversion**:
```
charge_ev = (charge_seconds / target_cooldown) × target_damage_per_activation

If you charge a 10s CD item by 3s:
  = (3/10) × damage = 0.3 extra activations worth
```

---

## The Meta-Problem: Fight Length Assumption

Almost every EV calculation above depends on **assumed fight length**. This is the single biggest modeling challenge.

| Fight Length | Favors |
|-------------|--------|
| 5-10s | Direct damage, burst, Ammo weapons |
| 15-20s | Burn (has time to tick), balanced builds |
| 25-40s | Poison (accumulation), Haste loops |
| 40s+ | Poison completely dominates |

**Proposed approach**: Don't assume a single fight length. Model a **distribution**:

```
fight_length_distribution(day, board_power_delta):
  If you're much stronger: skew short (10-15s)
  If evenly matched: medium (15-25s)
  If you're weaker: skew long (25-40s)
  If opponent has strong defense: very long (30-50s)

ev(effect) = Σ P(fight_length = L) × ev(effect | fight_length = L)
```

Calibrate the distribution from pro game data — extract fight lengths from transcripts/recordings.

**Alternative**: Use "damage within first 15 seconds" + "sustained DPS after 15 seconds" as two separate metrics. This captures both burst and sustain without assuming a single fight length.

---

## The Stacking Problem: Synergy is Multiplicative

Status effects compound with each other in ways that make simple addition wrong:

**Example**: Adding Pufferfish to a board with Beach Ball.
- Pufferfish alone: 6 Poison / 6s = ~13 DPS over 20s fight
- Beach Ball alone: Haste 2 items 3s / 5s CD = uptime buff, no direct damage
- Pufferfish + Beach Ball: Pufferfish gets Hasted → CD effectively ~3s → twice as many Poison applications → ~26+ DPS. PLUS Pufferfish triggers on Haste → extra activation → even more Poison.

You can't just add their individual EVs. The combo is worth more than the sum.

**Proposed approach**: Always compute board-level EV, not item-level EV.
```
item_ev(X) = board_ev(current_board + X) - board_ev(current_board)
```

This automatically captures synergies because you're comparing full boards, not isolated items. The downside is computational cost — you need to evaluate the full board for every candidate action.

---

## Proposed EV Conversion Framework

### Step 1: Normalize to "Effective Damage Per Second" (eDPS)

Convert every effect to a common unit:

| Effect | eDPS Conversion |
|--------|----------------|
| Deal D damage / C seconds | D / C |
| Burn B / C seconds | B×(B+1) / (2×C) unmitigated; ×0.5 if opponent has Shield |
| Poison P / C seconds | P×F / (2×C) where F = expected fight length (quadratic accumulation) |
| Shield S / C seconds | S / C as "negative enemy DPS" (adjusted for opponent's damage type mix) |
| Heal H / C seconds | H / C as "negative enemy DPS" + 0.05×H cleansing value |
| Haste N items for H seconds / C seconds | Σ(hasted_item_dps) × H/C |
| Slow N items for S seconds / C seconds | Σ(slowed_enemy_item_dps) × 0.5 × S/C |
| Freeze N items for Z seconds / C seconds | Σ(frozen_enemy_item_dps) × Z/C |
| Crit chance +X% | board_dps × (X/100) [multiplicative, applied globally] |

### Step 2: Adjust for Opponent Type

```
opponent_profile(day):
  Based on day and meta, estimate:
  - opponent_total_dps
  - opponent_shield_per_second
  - opponent_heal_per_second
  - opponent_poison_vulnerability (1.0 if no heal, lower if heal-heavy)
  - opponent_burn_vulnerability (1.0 if no shield, 0.5 if shield-heavy)
```

### Step 3: Compute Net Board eDPS

```
your_eDPS = Σ(item eDPS for all items, accounting for board synergies)
opponent_effective_dps = opponent_dps - your_slow/freeze_reduction
your_effective_hp = health + shield_rate × fight_length + heal_rate × fight_length

estimated_fight_outcome = your_eDPS × fight_length vs opponent_effective_dps × fight_length
```

---

## Open Questions

1. **How to handle overlapping Burn stacks precisely?** Need a simulator or closed-form for steady-state burn under repeated application with different cooldowns.

2. **Poison cleansing model**: How much healing/regen do typical opponents have at each day? This determines whether Poison accumulates indefinitely or reaches equilibrium.

3. **Haste/Slow duration vs cooldown interaction**: If Haste lasts 3s on a 5s cooldown item, does the item get exactly 1 extra tick, or is it continuous? Need to model Haste uptime precisely.

4. **Multi-target Slow/Haste**: When "Slow 2 items," is the selection random? How do we model expected value of random target selection?

5. **Trigger chains**: Slow triggers Lighthouse, which applies Burn, which triggers Slumbering Primordial. How deep do we trace? Recursive EV with diminishing returns?

6. **Crit × Burn interaction**: As shown above, crit on quadratic effects is worth more than the linear crit multiplier suggests. Do we need to compute this precisely or is the linear approximation good enough?

7. **Shield depletion timing**: Burn is halved by Shield, but Shield eventually runs out. At what point does the transition happen? Depends on all incoming damage sources simultaneously.

8. **Fight length calibration**: Where do we get real fight length data? Pro recordings? Simulation? Player surveys?

---

## Next Steps

- [ ] Build a tick-based combat simulator to validate these formulas against real game behavior
- [ ] Collect fight length data from pro player recordings
- [ ] Create opponent archetype boards for each day bracket
- [ ] Implement the eDPS conversion framework and test on known-good/bad boards
- [ ] Specifically validate: Burn stacking under overlapping applications, Poison accumulation curves, Haste uptime calculations
- [ ] Determine whether linear approximations are "good enough" or if we need exact formulas
