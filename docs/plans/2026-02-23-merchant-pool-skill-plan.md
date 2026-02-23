# Merchant Pool Skill Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Auto-load the correct item pool with probabilities when a merchant + day + hero is mentioned in conversation.

**Architecture:** Three changes — (1) scrape and add explicit `Starting Tier:` to all 130 Vanessa item entries, (2) complete merchant data in `mechanics/merchants.md`, (3) create `merchant-pool` auto-trigger skill. No code/tests — this is KB data + skill markdown.

**Tech Stack:** Python (scraper script), Markdown (KB files, skill), thebazaar.wiki.gg (data source)

---

### Task 1: Write the tier scraper script

**Files:**
- Create: `projects/bazaar-coach/tools/scrape-item-tiers.py`

**Step 1: Create the scraper**

Write a Python script that:
1. Reads item names from the three vanessa item files by parsing `## ItemName` headers
2. For each item, fetches `https://thebazaar.wiki.gg/wiki/{ItemName}` (URL-encode spaces as `_`)
3. Extracts the "Starting Tier" value from the page (search for "Starting Tier" text followed by Bronze/Silver/Gold/Diamond)
4. Outputs a JSON mapping: `{"Anchor": "Gold", "Katana": "Bronze", ...}`
5. Saves to `projects/bazaar-coach/items/data/vanessa-tiers.json`

```python
#!/usr/bin/env python3
"""Scrape starting tiers for all Vanessa items from thebazaar.wiki.gg.

Usage:
    python projects/bazaar-coach/tools/scrape-item-tiers.py

Output:
    projects/bazaar-coach/items/data/vanessa-tiers.json
"""

import json
import re
import sys
import time
import urllib.request
import urllib.parse
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
ITEMS_DIR = REPO_ROOT / "items" / "by-hero"
OUTPUT_DIR = REPO_ROOT / "items" / "data"
OUTPUT_FILE = OUTPUT_DIR / "vanessa-tiers.json"
WIKI_BASE = "https://thebazaar.wiki.gg/wiki/"

ITEM_FILES = [
    ITEMS_DIR / "vanessa-small.md",
    ITEMS_DIR / "vanessa-medium.md",
    ITEMS_DIR / "vanessa-large.md",
]


def extract_item_names(filepath: Path) -> list[str]:
    """Parse ## headers from a markdown item file."""
    names = []
    with open(filepath) as f:
        for line in f:
            m = re.match(r"^## (.+)$", line.strip())
            if m:
                names.append(m.group(1))
    return names


def fetch_starting_tier(item_name: str) -> str | None:
    """Fetch the starting tier for an item from the wiki."""
    slug = item_name.replace(" ", "_").replace("'", "%27")
    url = WIKI_BASE + urllib.parse.quote(slug, safe="_")
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "BazaarCoachScraper/1.0"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            html = resp.read().decode("utf-8")
    except Exception as e:
        print(f"  ERROR fetching {item_name}: {e}", file=sys.stderr)
        return None

    # Look for "Starting Tier" followed by a tier name
    # Wiki format varies but the tier always appears near "Starting Tier"
    patterns = [
        r"Starting Tier[:\s]*</[^>]+>\s*<[^>]+>(\w+)",  # HTML table format
        r"Starting Tier[:\s]*(Bronze|Silver|Gold|Diamond)",  # plain text
        r"starting.tier[^<]*?(Bronze|Silver|Gold|Diamond)",  # loose match
    ]
    for pattern in patterns:
        m = re.search(pattern, html, re.IGNORECASE)
        if m:
            tier = m.group(1).capitalize()
            if tier in ("Bronze", "Silver", "Gold", "Diamond"):
                return tier

    print(f"  WARNING: Could not find starting tier for {item_name}", file=sys.stderr)
    return None


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    all_items: list[str] = []
    for f in ITEM_FILES:
        names = extract_item_names(f)
        print(f"{f.name}: {len(names)} items")
        all_items.extend(names)

    print(f"\nTotal items to scrape: {len(all_items)}\n")

    tiers: dict[str, str] = {}
    failed: list[str] = []

    for i, name in enumerate(all_items):
        print(f"[{i+1}/{len(all_items)}] {name}...", end=" ", flush=True)
        tier = fetch_starting_tier(name)
        if tier:
            tiers[name] = tier
            print(tier)
        else:
            failed.append(name)
            print("FAILED")
        time.sleep(0.5)  # rate limit

    with open(OUTPUT_FILE, "w") as f:
        json.dump(tiers, f, indent=2, sort_keys=True)

    print(f"\nDone. {len(tiers)} tiers scraped, {len(failed)} failed.")
    print(f"Output: {OUTPUT_FILE}")
    if failed:
        print(f"Failed items: {', '.join(failed)}")


if __name__ == "__main__":
    main()
```

**Step 2: Run the scraper**

Run: `python projects/bazaar-coach/tools/scrape-item-tiers.py`
Expected: JSON file at `projects/bazaar-coach/items/data/vanessa-tiers.json` with 130 entries. Some may fail — note failures for manual lookup.

**Step 3: Fix any failures**

For any items that failed to scrape, manually look up on thebazaar.wiki.gg and add to the JSON file.

**Step 4: Commit**

```bash
git add projects/bazaar-coach/tools/scrape-item-tiers.py projects/bazaar-coach/items/data/vanessa-tiers.json
git commit -m "feat(bazaar-coach): scrape starting tiers for all Vanessa items"
```

---

### Task 2: Add `Starting Tier:` to vanessa-small.md

**Files:**
- Modify: `projects/bazaar-coach/items/by-hero/vanessa-small.md`
- Reference: `projects/bazaar-coach/items/data/vanessa-tiers.json`

**Step 1: Read the JSON tier data**

Load `vanessa-tiers.json` to get the correct tier for each item.

**Step 2: Add Starting Tier line to every item entry**

For each item in `vanessa-small.md`, add a `- **Starting Tier**: X` line immediately after the `- **Size**:` line. Example:

Before:
```markdown
## Ambergris
- **Size**: Small | **Types**: Aquatic, Economy, Heal, Value, Relic
- **Cooldown**: 7.0s
```

After:
```markdown
## Ambergris
- **Size**: Small | **Types**: Aquatic, Economy, Heal, Value, Relic
- **Starting Tier**: Bronze
- **Cooldown**: 7.0s
```

Do this for all 52 items. Use the Edit tool for each item — match the `- **Size**:` line and insert the `- **Starting Tier**:` line after it.

**Step 3: Verify**

Run: `grep -c "Starting Tier" projects/bazaar-coach/items/by-hero/vanessa-small.md`
Expected: `52`

**Step 4: Commit**

```bash
git add projects/bazaar-coach/items/by-hero/vanessa-small.md
git commit -m "feat(bazaar-coach): add Starting Tier to all Vanessa small items"
```

---

### Task 3: Add `Starting Tier:` to vanessa-medium.md

**Files:**
- Modify: `projects/bazaar-coach/items/by-hero/vanessa-medium.md`
- Reference: `projects/bazaar-coach/items/data/vanessa-tiers.json`

**Step 1: Add Starting Tier line to every item entry**

Same pattern as Task 2. For each of the 57 items, add `- **Starting Tier**: X` after the `- **Size**:` line.

Two items already have `- **Starting Tier**: Silver` (Cauterizing Blade, Oni Mask). Verify these match the scraped data. If they already exist, skip them.

**Step 2: Verify**

Run: `grep -c "Starting Tier" projects/bazaar-coach/items/by-hero/vanessa-medium.md`
Expected: `57`

**Step 3: Commit**

```bash
git add projects/bazaar-coach/items/by-hero/vanessa-medium.md
git commit -m "feat(bazaar-coach): add Starting Tier to all Vanessa medium items"
```

---

### Task 4: Add `Starting Tier:` to vanessa-large.md

**Files:**
- Modify: `projects/bazaar-coach/items/by-hero/vanessa-large.md`
- Reference: `projects/bazaar-coach/items/data/vanessa-tiers.json`

**Step 1: Add Starting Tier line to every item entry**

Same pattern as Tasks 2-3. For each of the 21 items. One item already has `- **Starting Tier**: Gold` (Stealth Glider).

**Step 2: Verify**

Run: `grep -c "Starting Tier" projects/bazaar-coach/items/by-hero/vanessa-large.md`
Expected: `21`

**Step 3: Commit**

```bash
git add projects/bazaar-coach/items/by-hero/vanessa-large.md
git commit -m "feat(bazaar-coach): add Starting Tier to all Vanessa large items"
```

---

### Task 5: Complete merchants.md

**Files:**
- Modify: `projects/bazaar-coach/mechanics/merchants.md`

**Step 1: Add shop mechanics section at top**

After the "Merchant Tier and Day Availability" section heading, replace the TODO with:

```markdown
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
```

**Step 2: Complete each merchant entry**

Update each merchant to include `Items per shop`, `Reroll cost`, `First appears`, and `Pool rule`:

```markdown
### Jay Jay
- **Type**: General — "Sells Items"
- **Tier**: Bronze
- **First appears**: Day 1
- **Items per shop**: 3
- **Reroll cost**: 2 gold
- **Pool rule**: All items from hero's pool (excluding Monster items)
- **Note**: Good target for Generosity skill — sell items here to discount purchases.
```

Repeat for all merchants. For Ande and Nautica (with TODO tiers), look up on thebazaar.wiki.gg to fill in the data.

**Step 3: Verify**

Read the file and confirm every merchant has `First appears`, `Items per shop`, `Reroll cost`, and `Pool rule`.

**Step 4: Commit**

```bash
git add projects/bazaar-coach/mechanics/merchants.md
git commit -m "feat(bazaar-coach): complete merchant data with shop mechanics and day availability"
```

---

### Task 6: Create the merchant-pool skill

**Files:**
- Create: `projects/bazaar-coach/.claude/skills/merchant-pool/SKILL.md`

**Step 1: Write the SKILL.md**

```markdown
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

Based on the merchant's pool rule, read the correct item file(s):

| Merchant | Pool Rule | Files to Read |
|----------|-----------|---------------|
| Mittel | Medium items | `items/by-hero/vanessa-medium.md` |
| Ande | Small items | `items/by-hero/vanessa-small.md` |
| Jay Jay | All items | All three vanessa item files |
| Aila | All items | All three vanessa item files |
| Kina | Non-Weapon items | All three, exclude items with "Weapon" in Types |
| Colt | Ammo items | All three, include only items with "Ammo" in Types |
| Tok's Clocks | Haste/Slow/Cooldown items | All three, include items with "Haste", "Slow", or "Cooldown" in Types |
| Kev's Armory | Shield/Health items | All three, include items with "Shield" or "Heal" in Types |
| Nautica | Aquatic items | All three, include items with "Aquatic" in Types |

From each file, extract every item entry and read its `Starting Tier` field. **Only include items where Starting Tier is in the day's available tiers** (from Step 3).

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

**Pool**: [N] items ([breakdown by starting tier, e.g., "23 Bronze + 2 Silver"])
**New this day**: [items whose Starting Tier matches the NEWEST tier unlocked on this day, if any]

| Rating | Count | P(see ≥1) | Items |
|--------|-------|-----------|-------|
| S      | [n]   | [X]%      | [names] |
| A      | [n]   | [X]%      | [names] |
| B      | [n]   | [X]%      | [names] |

P(specific item): [X]% per shop | [X]% with 1 reroll | [X]% with 2 rerolls

### S-Tier Items
- **[Name]** — [brief: cooldown, key effect]
- ...

### A-Tier Items
- **[Name]** — [brief: cooldown, key effect]
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
```

**Step 2: Verify skill is discoverable**

Run: `ls projects/bazaar-coach/.claude/skills/merchant-pool/SKILL.md`
Expected: File exists.

**Step 3: Commit**

```bash
git add projects/bazaar-coach/.claude/skills/merchant-pool/SKILL.md
git commit -m "feat(bazaar-coach): create merchant-pool auto-trigger skill"
```

---

### Task 7: Smoke test the skill

**Files:**
- Reference: All files modified in Tasks 1-6

**Step 1: Test "Day 2 Mittel"**

Simulate the skill manually:
1. Read `mechanics/merchants.md` — Mittel is Bronze, medium items, Day 2+, 2g reroll
2. Day 2 → Bronze-only tiers available
3. Read `items/by-hero/vanessa-medium.md`
4. Count items where `Starting Tier: Bronze` — record the count
5. Compute: P(specific) = 3/N, P(any S-tier) = 1 - C(N-S,3)/C(N,3)
6. Verify the output makes sense

**Step 2: Test "Day 7 Mittel"**

1. Day 7 → Bronze + Silver + Gold tiers available
2. Count items where Starting Tier is Bronze, Silver, or Gold
3. Verify pool is larger than Day 2 pool
4. Verify "New this day" shows Gold-start items

**Step 3: Test "Day 3 Ande"**

1. Ande is small items
2. Day 3 → Bronze + Silver
3. Read `vanessa-small.md`, count Bronze + Silver starting tier items
4. Verify output

**Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix(bazaar-coach): smoke test fixes for merchant-pool skill"
```
