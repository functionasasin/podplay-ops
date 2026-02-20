# Keywords and Definitions

## Damage Keywords

### Damage
Direct damage to the enemy player's health (or shield if active). The most straightforward offensive mechanic.

### Burn
Decaying damage over time. Ticks **twice per second**. Each tick deals damage equal to current Burn value, then Burn **decreases by 1**.

- **Stacking**: Additive. Multiple Burn sources stack together.
- **vs Shield**: Shield **halves** Burn damage per tick.
- **vs Heal**: Healing cleanses Burn equal to **5% of the heal amount**.
- **vs Lifesteal**: Lifesteal does NOT cleanse Burn.
- **Total damage formula**: For N Burn, total unmitigated damage = N * (N + 1) / 2.
  - 10 Burn = 55 total damage
  - 20 Burn = 210 total damage
  - 50 Burn = 1,275 total damage
  - 100 Burn = 5,050 total damage
- **Key interaction**: Burns through fast but Shield slows it down by halving tick damage.

### Poison
Stable damage over time. Ticks **once per second**. Each tick deals damage equal to current Poison value. Poison does NOT decay on its own.

- **Stacking**: Additive. Multiple Poison sources stack.
- **vs Shield**: Poison **bypasses Shield entirely** -- damages health directly.
- **vs Heal**: Healing cleanses Poison equal to **5% of the heal amount**.
- **vs Lifesteal**: Lifesteal does NOT cleanse Poison.
- **vs Regen**: Regen reduces Poison by its amount before Poison deals damage each tick.
- **Key interaction**: The counter to Shield-heavy builds. Only removed by healing.

### Lifesteal
When dealing damage, recover health equal to the damage dealt. **Lifesteal does NOT count as healing** -- it will not cleanse Poison or Burn.

### Crit Chance
The probability that an item with a cooldown will critically hit. A critical hit **doubles** the item's active effects: Damage, Heal, Shield, Regeneration, Burn, and Poison.

- Default crit chance is 0% unless granted by items, skills, or enchantments
- The Deadly enchantment adds +50% crit chance

## Defensive Keywords

### Shield
Absorbs incoming damage before health is reduced.

- **vs Burn**: Reduces Burn damage by **50%** per tick.
- **vs Poison**: Shield is **completely bypassed** by Poison.
- **vs Damage**: Absorbs direct damage on a 1:1 basis.
- Shield does not regenerate on its own -- must be granted by items/skills.

### Heal
Restores health up to Max Health. Cannot overheal.

- Cleanses Poison and Burn equal to **5% of the heal amount**.
- Different from Lifesteal (Lifesteal doesn't cleanse).
- Different from Regen (Regen is a per-second passive).

### Regen (Regeneration)
Passive healing that triggers **once per second**, restoring health equal to the Regen value.

- **Can crit** (doubled healing on crit).
- Reduces Poison by its amount before Poison deals damage each second.
- Can be granted permanently (from events) or temporarily (from items).

## Speed Keywords

### Haste
Items with Haste charge **twice as fast**. Effectively halves the item's cooldown. Extremely powerful on slow, high-impact items.

### Slow
Items with Slow charge at **half speed**. Effectively doubles the item's cooldown. Applied to enemy items to reduce their DPS.

### Freeze
Frozen items **do not charge and cannot activate**. The strongest form of item disruption. Completely shuts down an item for the duration.

- Items with the **Flying** status have Freeze duration halved.
- Items with the **Radiant** enchantment are immune to Freeze.

### Charge
Instantly advances an item's cooldown timer. Can be used to force an item to trigger sooner. Some items charge other items when they activate.

## Item State Keywords

### Ammo
Some items (especially weapons) have limited Ammo. When Ammo runs out, the item **stops charging** and cannot activate for the rest of the fight. Ammo **refills after each fight**.

- Items and skills can reload Ammo mid-fight
- Some effects increase max Ammo

### Destroy
Destroyed items are **completely disabled** on the board. They cannot activate and all passive effects are negated. A destroyed item is essentially dead for the fight.

### Repair
Restores one of your Destroyed items, making it functional again. The counter to Destroy effects.

### Flying
Certain abilities cause items to start Flying. While Flying, all **Slow and Freeze effects applied to the item have their duration halved**. A defensive status against control effects.

## Effect Keywords

### Multicast
When an item with Multicast triggers, its effect happens **multiple times**. Effectively multiplies output per activation. Granted by the Shiny enchantment or specific items/skills.

### Transform
Randomly changes the selected item into another item of the **same size**. The new item retains the former **enchantment if applicable**. Legendary items cannot be Transformed.

### Upgrade
Increases an item's quality tier (Bronze -> Silver -> Gold -> Diamond). Improves effectiveness and sell value. See [upgrades.md](upgrades.md) for details.

### Quest
Quest items require you to **fulfill specific conditions** during your run to unlock additional abilities. Once the quest is complete, the item gains powerful bonus effects.

## Interaction Summary Table

| Attacker    | vs Shield        | vs Heal          | vs Regen         |
|-------------|------------------|------------------|------------------|
| Damage      | Blocked 1:1      | Heals back HP    | Heals passively  |
| Burn        | Halved per tick  | Cleanses 5%      | --               |
| Poison      | Bypasses Shield  | Cleanses 5%      | Reduces Poison   |
| Lifesteal   | N/A (you gain HP)| Does NOT cleanse  | --               |

| Disruptor   | vs Normal Item   | vs Flying Item   | vs Radiant Item  |
|-------------|------------------|------------------|------------------|
| Freeze      | Full duration    | Half duration    | Immune           |
| Slow        | Full duration    | Half duration    | Immune           |
| Destroy     | Fully disabled   | Fully disabled   | Immune           |
