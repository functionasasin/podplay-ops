# The Bazaar AI Coach — Proof of Concept

**Date**: 2026-02-20
**Status**: Design
**Type**: Proof of Concept
**Related**: [Dota Coach Design](./2026-02-20-dota-coach-design.md)

## Purpose

Validate the core hypothesis behind the Dota Coach idea: can Claude + a curated local knowledge base of markdown files give actionable coaching advice from game screenshots alone?

The Bazaar is the perfect test bed because its decision phases are untimed. No backend, no Discord bot, no capture app. The user opens Claude Code in the knowledge base directory, pastes a screenshot, and asks "what should I do?" If the advice is good, the idea works and we build the real-time Dota version.

## How It Works

```
Player is in The Bazaar shop phase
        │
        ▼
Player takes a screenshot, pastes it into Claude Code
        │
        ▼
Claude Code (running in the KB directory, CLAUDE.md loaded):
  1. Reads the screenshot (vision)
  2. Identifies: hero, current board, stash, gold, income, day, shop offerings
  3. Searches the KB: grep hero builds, read item synergies, check meta tier list
  4. Recommends: what to buy, sell, upgrade, reposition, or skip
        │
        ▼
Player follows advice (or doesn't), continues playing, screenshots again later
```

That's it. No automation. Pure human-in-the-loop validation.

## Directory Setup

Lives in this monorepo at `projects/bazaar-coach/`:

```
projects/bazaar-coach/
├── CLAUDE.md                  # Coaching persona + KB usage instructions
├── heroes/
│   ├── vanessa.md             # Aggressive multi-weapon damage dealer
│   ├── pygmalien.md           # Economy-focused, Value scaling
│   ├── dooley.md              # Core-card-centric powerhouse
│   ├── mak.md                 # Alchemist, potions and reagents
│   ├── stelle.md              # Flying/Haste mechanics
│   └── jules.md               # Multi-armed chef, unique combos
├── items/
│   ├── weapons.md             # Damage-dealing items
│   ├── shields.md             # Defensive items
│   ├── tools.md               # Utility items
│   ├── potions.md             # Consumable/reagent items
│   └── by-hero/               # Hero-specific item pools and synergies
│       ├── vanessa-items.md
│       └── ...
├── mechanics/
│   ├── economy.md             # Gold, income, sell prices, upgrade costs
│   ├── positioning.md         # Adjacency, leftmost/rightmost triggers
│   ├── enchantments.md        # 11 enchantment types and when to use each
│   ├── sizing.md              # Small/Medium/Large slot management
│   ├── upgrading.md           # Tier progression: Bronze → Silver → Gold → Diamond
│   └── keywords.md            # Status effects, triggers, all game keywords
├── strategy/
│   ├── build-archetypes.md    # Common winning build patterns per hero
│   ├── run-pacing.md          # When to spend vs save, pivot timing, power spikes by day
│   ├── shop-evaluation.md     # How to evaluate shop offerings
│   └── pve-encounters.md      # Which monsters to fight, risk/reward
└── meta/
    ├── tier-list.md           # Current hero and build tier rankings
    ├── patch-notes.md         # Latest balance changes
    └── common-mistakes.md     # What average players get wrong
```

## CLAUDE.md Content

The CLAUDE.md defines how Claude behaves when running in this directory:

- **Persona**: "You are an expert Bazaar coach. When shown a screenshot of the game, analyze the visible state and give actionable recommendations."
- **Response format**: 3-5 bullet points. Each bullet is one specific action: buy X, sell Y, reposition Z, skip this shop, upgrade W.
- **Analysis approach**: First identify the hero and current build direction from the board. Then evaluate shop offerings against that build. Check the KB for synergies, tier list, and build archetypes.
- **What to look for in screenshots**: Hero, board items (names, tiers, positions, sizes), stash contents, gold, income, day/hour, shop items and prices, prestige remaining.
- **KB search pattern**: Use Glob/Grep to find relevant files. Read hero file first, then check item synergies, then meta tier list.

## Knowledge Base Sources

Data to populate the KB from (manual curation + web scraping):

| Source | URL | What to Extract |
|--------|-----|-----------------|
| BazaarDB | bazaardb.gg | Item stats, hidden mechanics, tier lists |
| How Bazaar | howbazaar.gg | Item/skill database |
| Mobalytics | mobalytics.gg/the-bazaar | Meta builds, hero guides, beginner guides |
| The Bazaar Wiki | thebazaar.wiki.gg | Full mechanics docs, item lists, keywords |
| The Bazaar Zone | thebazaarzone.com | Tier lists, strategy guides |
| Bazaar Builds | bazaar-builds.net | Build guides, strategy articles |

The KB should capture what a top-ranked player knows — not raw data dumps but curated strategic knowledge. "When playing Vanessa, prioritize X over Y because Z" not just "item X does 5 damage."

## What Success Looks Like

The PoC succeeds if:

1. Claude can correctly read a Bazaar screenshot and identify: hero, board state, gold, shop offerings
2. Claude searches the KB and finds relevant synergies/strategies
3. Recommendations are specific and actionable ("buy Frost Staff from shop, it synergizes with your Ice build and fits your empty medium slot") not generic ("try to build synergies")
4. Recommendations align with what a high-ranked player would do in the same situation
5. Across multiple screenshots in a run, advice is coherent and adapts to the evolving build

## Steps to Build

1. **Create the directory structure** in `projects/bazaar-coach/`
2. **Write CLAUDE.md** with the coaching persona
3. **Populate the KB** — start with one hero (pick whichever you play most). Scrape/curate data from community sites into the markdown files. Focus on strategic knowledge, not raw item databases.
4. **Test it** — play a game, screenshot at each shop phase, paste into Claude Code running in the directory. See if the advice is good.
5. **Iterate** — refine CLAUDE.md prompt, fill gaps in the KB, add more heroes.

## What This Validates

If this works, it proves:
- Claude's vision can parse game UI screenshots accurately
- A markdown knowledge base searched via Glob/Grep/Read provides sufficient context
- No fine-tuning or embeddings needed — just well-organized files
- The approach generalizes to other games (Dota 2 next)

If this doesn't work, we learn:
- Whether vision accuracy is the bottleneck (can't read item names, misidentifies board state)
- Whether the KB structure needs to be different (maybe items need structured YAML, not prose)
- Whether Claude needs more context per query than tool-searched files provide
