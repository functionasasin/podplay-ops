---
name: game-state
description: Capture and read the current game screen before making any recommendation. Invoke automatically when user asks for advice.
user-invocable: true
disable-model-invocation: false
---

# Game State from Screenshot

Capture The Bazaar's game window and analyze the current board state.

## Steps

1. **Capture the screen** — Run the capture script:
   ```
   python projects/bazaar-coach/tools/screen-capture.py
   ```
   - If it fails with "Window not found", tell the user The Bazaar needs to be open
   - The script saves to `projects/bazaar-coach/.screenshots/latest.png`

2. **Read the screenshot** — Use the Read tool on `projects/bazaar-coach/.screenshots/latest.png`
   - Claude's vision will see the game state in the image

3. **Extract game state** using the current-state skill's framework:
   - All board items (names, types, sizes, tiers, cooldowns)
   - Weapons vs non-weapons, aquatic items, friends, status effects
   - Stash/backpack contents
   - Active skills and enchantments
   - Key stats: Gold, income, prestige, day/hour, HP, regen
   - What the board needs: primary engine, weakest slot, highest marginal impact

4. **Give recommendations** — Proceed with the coaching advice the user asked for.

## Important

- ALWAYS capture a fresh screenshot before giving advice — don't rely on stale state
- If the user just wants to chat about strategy without needing current state, skip the capture
- The capture script finds The Bazaar window wherever it is on screen
