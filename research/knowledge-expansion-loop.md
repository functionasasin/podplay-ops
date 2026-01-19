# Knowledge Expansion Loop: Fixed-Point Iteration for an Evolving Knowledge Base

## Vision

An Obsidian-style knowledge base that grows itself. You seed it with initial content (meeting notes, trip plans, project docs), and a loop continuously discovers entities worth expanding, researches them, creates linked notes, and commits. The process runs until it converges - when there's nothing new worth researching, or when expansion yields diminishing returns.

**The dream:** Drop a note about a Japan trip, walk away, come back to find interconnected notes about every resort, every tea shop, every logistical service - all with backlinks, all committed incrementally, all traceable through git history.

---

## Core Concept: Fixed-Point Iteration

In mathematics, fixed-point iteration repeatedly applies a function until the output equals the input:

```
x₀ → f(x₀) = x₁ → f(x₁) = x₂ → ... → f(xₙ) = xₙ (convergence)
```

Applied to knowledge:

```
Knowledge₀ → Expand(Knowledge₀) = Knowledge₁ → Expand(Knowledge₁) = Knowledge₂ → ...
```

**Convergence** occurs when `Expand(Knowledgeₙ) ≈ Knowledgeₙ` - meaning expansion produces nothing substantially new.

### Why This Works

1. **Bounded domain** - Any topic has finite depth worth exploring
2. **Diminishing returns** - Each expansion yields fewer new entities
3. **Natural stopping** - When everything links to existing notes, you're done
4. **Progressive refinement** - Early iterations catch big gaps, later ones refine

---

## The Ralph Wiggum Adaptation

Ralph Wiggum is traditionally used for code tasks: "run tests until they pass."

```bash
while :; do cat PROMPT.md | claude-code; done
```

For knowledge expansion, we adapt this:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    KNOWLEDGE EXPANSION RALPH LOOP                           │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                         PROMPT.md                                    │  │
│   │                                                                      │  │
│   │  "You are a knowledge expansion agent. Your job is to:              │  │
│   │   1. Scan the knowledge base for unexpanded entities                │  │
│   │   2. Pick ONE entity to expand (smallest useful unit)               │  │
│   │   3. Research it (web search, fetch pages, synthesize)              │  │
│   │   4. Create/update notes with backlinks                             │  │
│   │   5. Update the expansion frontier                                  │  │
│   │   6. Commit your changes                                            │  │
│   │   7. Exit                                                           │  │
│   │                                                                      │  │
│   │  If nothing to expand, write CONVERGED to /status/converged.txt"    │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                     │                                       │
│                                     ▼                                       │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                       BASH LOOP                                      │  │
│   │                                                                      │  │
│   │   while [ ! -f /status/converged.txt ]; do                          │  │
│   │       cat PROMPT.md | claude-code                                    │  │
│   │       sleep 5  # Brief pause between iterations                     │  │
│   │   done                                                               │  │
│   │   echo "Knowledge base converged after $iterations iterations"      │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Differences from Code-Ralph

| Aspect | Code Ralph | Knowledge Ralph |
|--------|------------|-----------------|
| Stop condition | Tests pass | Nothing left to expand |
| Unit of work | Fix one failing test | Expand one entity |
| Progress signal | Test output | New notes created |
| Convergence | All tests green | Frontier exhausted |
| Iteration time | Minutes | Variable (web research) |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         KNOWLEDGE EXPANSION SYSTEM                          │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────────┐
                              │   SEED CONTENT   │
                              │                  │
                              │ • Trip itinerary │
                              │ • Meeting notes  │
                              │ • Project docs   │
                              └────────┬─────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            ENTITY EXTRACTOR                                 │
│                                                                             │
│   Scans content → Identifies expandable entities:                          │
│   • Proper nouns (places, companies, people)                               │
│   • Technical terms (Yamato Takkyubin, Chasen, Shinkansen)                 │
│   • Services mentioned but not explained                                   │
│   • References without links                                               │
│                                                                             │
│   Output: /frontier/entities.md                                            │
│                                                                             │
│   ```                                                                       │
│   ## Unexpanded Entities                                                   │
│   - [ ] Togari Onsen (from: trips/japan-trip-itinerary.md)                │
│   - [ ] Nozawa Onsen (from: trips/japan-trip-itinerary.md)                │
│   - [ ] Yamato Takkyubin (from: trips/japan-trip-itinerary.md)            │
│   - [ ] Ippodo Tea (from: trips/japan-shopping-list.md)                   │
│   - [ ] Toyosu Market (from: trips/japan-shopping-list.md)                │
│   ```                                                                       │
└────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           EXPANSION LOOP                                    │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │  1. READ FRONTIER                                                    │  │
│   │     - Load /frontier/entities.md                                     │  │
│   │     - Find first unchecked entity                                    │  │
│   │     - If none: write CONVERGED, exit                                 │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                       │                                     │
│                                       ▼                                     │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │  2. RESEARCH                                                         │  │
│   │     - Web search for entity                                          │  │
│   │     - Fetch relevant pages                                           │  │
│   │     - Synthesize key information                                     │  │
│   │     - If no useful info found: mark as "unresearchable"             │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                       │                                     │
│                                       ▼                                     │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │  3. CREATE/UPDATE NOTE                                               │  │
│   │     - Write to /knowledge/{category}/{entity-slug}.md               │  │
│   │     - Add backlinks to source documents                              │  │
│   │     - Update source documents with forward links                     │  │
│   │     - Extract NEW entities discovered during research                │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                       │                                     │
│                                       ▼                                     │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │  4. UPDATE FRONTIER                                                  │  │
│   │     - Mark current entity as [x] done                                │  │
│   │     - Add newly discovered entities as [ ] pending                   │  │
│   │     - Record in /frontier/expansion-log.md                          │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                       │                                     │
│                                       ▼                                     │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │  5. COMMIT & EXIT                                                    │  │
│   │     - git add -A                                                     │  │
│   │     - git commit -m "expand: {entity-name}"                         │  │
│   │     - Exit (loop will restart)                                       │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          EXPANDED KNOWLEDGE BASE                            │
│                                                                             │
│   /knowledge/                                                               │
│   ├── places/                                                               │
│   │   ├── togari-onsen.md         ← backlinks to japan-trip-itinerary.md  │
│   │   ├── nozawa-onsen.md         ← backlinks + discovered: fire festival │
│   │   └── suruga-bay.md           ← discovered from spider crab research  │
│   ├── services/                                                             │
│   │   └── yamato-takkyubin.md     ← backlinks to japan-trip-itinerary.md  │
│   ├── products/                                                             │
│   │   ├── chasen.md               ← backlinks to japan-shopping-list.md   │
│   │   └── matcha-grades.md        ← discovered from chasen research       │
│   └── companies/                                                            │
│       └── ippodo-tea.md           ← backlinks + discovered: Uji region    │
│                                                                             │
│   /frontier/                                                                │
│   ├── entities.md                 ← current expansion queue                │
│   └── expansion-log.md            ← history of all expansions              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## The Atomic Research Unit

Each iteration does exactly ONE thing: expand a single entity. This is critical for:

1. **Clean git history** - Each commit is one expansion
2. **Resumability** - Crash anywhere, pick up where you left off
3. **Observability** - Easy to see what was researched when
4. **Token efficiency** - Don't boil the ocean in one session

### What Makes a Good Entity to Expand?

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ENTITY SCORING                                      │
│                                                                             │
│   High Priority (expand first):                                            │
│   ├── Mentioned multiple times across documents                            │
│   ├── Service/place you'll actually use (practical value)                  │
│   ├── Unique/specific (not generic like "hotel" but "Resort Inn Murata")  │
│   └── Has clear research potential (company, place, concept)               │
│                                                                             │
│   Low Priority (expand later):                                             │
│   ├── Generic terms                                                        │
│   ├── Already well-understood concepts                                     │
│   └── Tangentially related                                                 │
│                                                                             │
│   Skip/Mark Unresearchable:                                                │
│   ├── Too generic ("Japan", "snowboarding")                               │
│   ├── No useful info found after research attempt                         │
│   └── Personal/private entities (can't web research)                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## The Frontier: Managing What to Expand

The frontier is the heart of the convergence mechanism. It tracks:

```markdown
# Expansion Frontier

## Statistics
- Total entities discovered: 47
- Expanded: 31
- Pending: 12
- Unresearchable: 4
- Convergence progress: 66%

## Pending Entities (ordered by priority)

### High Priority
- [ ] Nozawa Fire Festival (from: knowledge/places/nozawa-onsen.md)
- [ ] Tokoname-yaki pottery (from: knowledge/products/kyusu-teapot.md)

### Normal Priority
- [ ] Madarao Kogen tree runs (from: trips/japan-trip-itinerary.md)
- [ ] Joetsu Shinkansen (from: trips/japan-trip-itinerary.md)

### Low Priority
- [ ] Japanese customs for live seafood (from: trips/japan-shopping-list.md)

## Recently Expanded
- [x] Nozawa Onsen → discovered 3 new entities
- [x] Ippodo Tea → discovered 2 new entities
- [x] Yamato Takkyubin → no new entities (converging)

## Unresearchable
- [~] Sansan Backpackers Yuzawa (insufficient public info)
- [~] Resort Inn Murata (minimal online presence)
```

---

## Convergence: When Does It Stop?

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CONVERGENCE DETECTION                                │
│                                                                             │
│   The system converges when ANY of these are true:                         │
│                                                                             │
│   1. FRONTIER EXHAUSTED                                                     │
│      └── No pending entities remain                                        │
│          (all either expanded or marked unresearchable)                    │
│                                                                             │
│   2. DISCOVERY RATE COLLAPSE                                               │
│      └── Last N expansions discovered 0 new entities                       │
│          (expanding but finding nothing new)                               │
│                                                                             │
│   3. DEPTH LIMIT REACHED                                                   │
│      └── Entities are N hops from original seed content                    │
│          (prevent infinite tangent chains)                                 │
│                                                                             │
│   4. MANUAL CONVERGENCE                                                    │
│      └── User adds /status/converged.txt                                   │
│          (satisfied with current state)                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Visualizing Convergence

```
Discovery Rate Over Time (entities found per expansion)

     │
   4 │  ●
     │   ●
   3 │    ●  ●
     │        ●
   2 │         ●  ●
     │              ●
   1 │               ●  ●  ●
     │                       ●  ●
   0 │─────────────────────────────●──●──●  ← converging
     └────────────────────────────────────────
       1  2  3  4  5  6  7  8  9  10 11 12 13  iterations

When the line flatlines at 0-1 new entities, convergence is near.
```

---

## Depth Control: Preventing Infinite Expansion

Without limits, expansion could spiral forever (Nozawa → Fire Festival → Shinto traditions → Japanese mythology → ...).

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DEPTH TRACKING                                    │
│                                                                             │
│   Seed content (depth 0):                                                  │
│   └── japan-trip-itinerary.md                                              │
│       └── japan-shopping-list.md                                           │
│                                                                             │
│   Depth 1 (directly mentioned):                                            │
│   └── Togari Onsen                                                         │
│   └── Nozawa Onsen                                                         │
│   └── Yamato Takkyubin                                                     │
│   └── Ippodo Tea                                                           │
│                                                                             │
│   Depth 2 (discovered from depth 1):                                       │
│   └── Nozawa Fire Festival (from Nozawa Onsen)                            │
│   └── Uji region tea history (from Ippodo Tea)                            │
│   └── Takkyubin pricing/booking (from Yamato Takkyubin)                   │
│                                                                             │
│   Depth 3 (discovered from depth 2):                                       │
│   └── Dosojin deity (from Nozawa Fire Festival)  ← maybe stop here?       │
│   └── Matcha grades explained (from Uji region)                           │
│                                                                             │
│   Depth 4+ (probably too tangential):                                      │
│   └── Shinto shrine practices (from Dosojin)  ← too far from trip         │
│                                                                             │
│   RECOMMENDATION: Default max depth = 2-3 hops from seed                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Concrete Example: Japan Trip Expansion

Starting with your existing Japan trip files, here's how expansion would unfold:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    EXPANSION SEQUENCE (SIMULATION)                          │
└─────────────────────────────────────────────────────────────────────────────┘

ITERATION 1: Initial entity extraction
├── Scans: japan-trip-itinerary.md, japan-shopping-list.md
├── Discovers 23 entities
├── Creates: /frontier/entities.md
└── Commit: "init: extract 23 entities from seed content"

ITERATION 2: Expand "Togari Onsen"
├── Web search: "Togari Onsen ski resort"
├── Research: terrain, facilities, snow record, night skiing
├── Creates: /knowledge/places/togari-onsen.md
├── Backlinks: adds [[togari-onsen]] to japan-trip-itinerary.md
├── Discovers: "Iiyama city", "Togari-Nozawaonsen Station"
└── Commit: "expand: togari-onsen"

ITERATION 3: Expand "Nozawa Onsen"
├── Web search: "Nozawa Onsen"
├── Research: famous for onsen village, fire festival, snow quality
├── Creates: /knowledge/places/nozawa-onsen.md
├── Discovers: "Nozawa Fire Festival", "Nozawa onsen etiquette", "Ogama"
└── Commit: "expand: nozawa-onsen"

ITERATION 4: Expand "Yamato Takkyubin"
├── Web search: "Yamato Takkyubin luggage service"
├── Research: how to use, pricing, booking, hotel partnerships
├── Creates: /knowledge/services/yamato-takkyubin.md
├── Discovers: minimal (service is straightforward)
└── Commit: "expand: yamato-takkyubin"

ITERATION 5: Expand "Ippodo Tea"
├── Web search: "Ippodo Tea Kyoto"
├── Research: 300-year history, product range, Tokyo location
├── Creates: /knowledge/companies/ippodo-tea.md
├── Discovers: "Uji matcha", "tea grades", "Marukyu Koyamaen"
└── Commit: "expand: ippodo-tea"

ITERATION 6: Expand "Nozawa Fire Festival"
├── Note: discovered in iteration 3, depth 2
├── Web search: "Nozawa Fire Festival January"
├── Research: dates (Jan 15!), traditions, viewing spots
├── Creates: /knowledge/events/nozawa-fire-festival.md
├── ALERT: Festival is Jan 15 - you'll be in Japan Jan 21!
├── Updates: japan-trip-itinerary.md with note about just-missed festival
└── Commit: "expand: nozawa-fire-festival"

ITERATION 7: Expand "Chasen (bamboo whisk)"
├── Web search: "chasen bamboo whisk making"
├── Research: Takayama craft tradition, tine counts, care instructions
├── Creates: /knowledge/products/chasen.md
├── Discovers: "Takayama city", "chasen craftsmen"
└── Commit: "expand: chasen"

... continues until frontier exhausted or depth limit ...

ITERATION 31: Check frontier
├── Pending entities: 2 (both depth 4, below threshold)
├── Discovery rate last 5 iterations: 0, 0, 1, 0, 0
├── Decision: CONVERGED
├── Creates: /status/converged.txt
└── Commit: "converged: 29 entities expanded, 4 unresearchable"

FINAL STATE:
├── 29 knowledge notes created
├── 47 total entities discovered
├── 4 marked unresearchable (private/minimal info)
├── 14 skipped (depth 4+, too tangential)
├── All seed documents enriched with backlinks
└── Git history shows clean expansion trail
```

---

## Note Format: Obsidian-Style with Backlinks

Each knowledge note follows a consistent format:

```markdown
# Nozawa Onsen

**Type:** Place / Ski Resort / Onsen Village
**Region:** Nagano, Japan
**Discovered from:** [[trips/japan-trip-itinerary|Japan Trip Itinerary]]
**Depth:** 1

## Overview

Nozawa Onsen is one of Japan's oldest and most atmospheric ski villages,
known equally for its skiing and its traditional hot spring baths...

## Key Facts

- **Vertical drop:** 1,085m
- **Runs:** 36 (20% beginner, 40% intermediate, 40% advanced)
- **Night skiing:** Available until 8:30 PM
- **Famous for:** Tree skiing, onsen village atmosphere, Nozawa Fire Festival

## Relevant to Your Trip

- 30 min from Resort Inn Murata
- Night skiing available (noted in itinerary)
- **Note:** Nozawa Fire Festival is Jan 15 - you arrive Jan 21, just missed it

## Discovered Entities

- [[nozawa-fire-festival]] - Major winter festival
- [[ogama]] - Natural hot spring cooking spot
- [[nozawa-onsen-etiquette]] - Public bath customs

## Sources

- https://www.nozawaski.com/
- https://www.japan-guide.com/e/e6027.html

## Backlinks

- [[trips/japan-trip-itinerary]] - Listed as day trip option
```

---

## Directory Structure After Expansion

```
/monorepo
├── claude.md
├── trips/
│   ├── japan-trip-itinerary.md      ← enriched with [[backlinks]]
│   └── japan-shopping-list.md       ← enriched with [[backlinks]]
├── knowledge/                        ← NEW: expanded knowledge
│   ├── places/
│   │   ├── togari-onsen.md
│   │   ├── nozawa-onsen.md
│   │   ├── madarao-kogen.md
│   │   ├── suruga-bay.md
│   │   └── iiyama.md
│   ├── services/
│   │   └── yamato-takkyubin.md
│   ├── companies/
│   │   ├── ippodo-tea.md
│   │   └── tsukiji-sabuchan.md
│   ├── products/
│   │   ├── chasen.md
│   │   ├── matcha-grades.md
│   │   └── kyusu-teapot.md
│   └── events/
│       └── nozawa-fire-festival.md
├── frontier/                         ← expansion state
│   ├── entities.md                   ← current queue
│   ├── expansion-log.md              ← history
│   └── convergence-stats.md          ← metrics
├── status/
│   └── converged.txt                 ← stop signal (when done)
└── research/
    └── knowledge-expansion-loop.md   ← this document
```

---

## Observability: Watching It Converge

### Git Log View

```bash
$ git log --oneline -20

a3f2c1d converged: 29 entities expanded, 4 unresearchable
b4e8d2a expand: hojicha-vs-matcha (depth 3, 0 new)
c5f9e3b expand: tokoname-yaki (depth 2, 0 new)
d6a0f4c expand: takayama-chasen (depth 2, 1 new)
e7b1a5d expand: uji-matcha-region (depth 2, 0 new)
f8c2b6e expand: nozawa-fire-festival (depth 2, 2 new)
09d3c7f expand: ippodo-tea (depth 1, 3 new)
1ae4d8a expand: yamato-takkyubin (depth 1, 0 new)
2bf5e9b expand: nozawa-onsen (depth 1, 3 new)
3ca6f0c expand: togari-onsen (depth 1, 2 new)
4db7a1d init: extract 23 entities from seed content
```

### Convergence Dashboard (frontier/convergence-stats.md)

```markdown
# Convergence Statistics

## Current Run
- Started: 2026-01-19 10:00
- Iterations: 31
- Status: CONVERGED

## Metrics

| Metric | Value |
|--------|-------|
| Entities discovered | 47 |
| Entities expanded | 29 |
| Unresearchable | 4 |
| Depth-limited | 14 |
| Avg entities/expansion | 1.2 |
| Discovery rate (last 5) | 0.2 |

## Discovery Curve

Iteration | Discovered | Cumulative
----------|------------|----------
1         | 23         | 23
2         | 2          | 25
3         | 3          | 28
5         | 3          | 34
10        | 1          | 41
15        | 1          | 44
20        | 0          | 46
25        | 1          | 47
30        | 0          | 47  ← plateau
31        | 0          | 47  ← converged
```

---

## Handling Edge Cases

### Research Fails

Sometimes web research yields nothing useful:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│   Entity: "Resort Inn Murata"                                              │
│   Status: UNRESEARCHABLE                                                   │
│                                                                             │
│   Attempts:                                                                │
│   - Web search: minimal results, no official website                       │
│   - Google Maps: exists, but no detailed info                             │
│   - Booking sites: basic listing only                                     │
│                                                                             │
│   Action: Mark as unresearchable, note in frontier                        │
│   Reason: "Small local ryokan with minimal online presence"               │
│                                                                             │
│   This is FINE - not everything needs expansion                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Circular References

Entity A mentions B, B mentions A:

```
Handling: Track what's already expanded. If entity already has a note,
don't re-expand - just add backlinks if missing.
```

### Rate Limiting / API Costs

```
Mitigations:
- Sleep between iterations (5-30 seconds)
- Use cached search results when possible
- Set daily iteration limit
- Budget alerts in convergence-stats.md
```

---

## Philosophy: Why Fixed-Point Iteration Works Here

### Traditional Knowledge Management

```
Human creates note → Human decides what to link → Human researches on demand
```

**Problem:** Human bandwidth limits growth. Notes stay siloed.

### AI-Assisted (Chat Style)

```
Human asks question → AI researches → Human saves result somewhere
```

**Problem:** Reactive, not systematic. Knowledge doesn't compound.

### Fixed-Point Expansion (This System)

```
Seed content → System identifies gaps → System fills gaps → System identifies new gaps → ... → Convergence
```

**Advantage:** Knowledge compounds automatically. The graph grows while you sleep.

### The Math Intuition

Think of your knowledge base as a function `K`:
- Input: what you know
- Output: what you should know (after expanding one entity)

Fixed-point iteration finds where `K(K(K(...K(x)...))) = x`

At that point, expanding further yields nothing new. Your knowledge base is *complete* for the given seed content and depth limit.

---

## Next Steps

This document describes the conceptual architecture. Implementation would involve:

1. **Prompt engineering** - The expansion agent prompt (most critical)
2. **Frontier management** - Simple markdown-based queue
3. **Backlink mechanics** - Consistent linking format
4. **Loop wrapper** - Bash script with stop condition
5. **Convergence tracking** - Stats file updated each iteration

No code is provided here - this is the research/design phase. The system could be built incrementally, starting with manual iterations to validate the expansion prompt before automating the loop.

---

## References

- [Ralph Wiggum Technique](https://ghuntley.com/ralph/) - Original loop concept
- [VentureBeat: Ralph Wiggum in AI](https://venturebeat.com/technology/how-ralph-wiggum-went-from-the-simpsons-to-the-biggest-name-in-ai-right-now) - Cultural context
- [HumanLayer: Brief History of Ralph](https://www.humanlayer.dev/blog/brief-history-of-ralph) - Evolution of the technique
- [Fixed-Point Iteration (Wikipedia)](https://en.wikipedia.org/wiki/Fixed-point_iteration) - Mathematical foundation
- [Obsidian](https://obsidian.md/) - Inspiration for backlink-centric notes
