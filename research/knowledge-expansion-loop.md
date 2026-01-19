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
│   3. LLM JUDGES "NOT RELEVANT"                                             │
│      └── Remaining entities judged too tangential to seed                  │
│          (LLM decides, not hop count)                                      │
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

## Breadth-First Expansion with LLM Relevance Control

No hard depth limits. Instead: **breadth-first exploration** with **LLM-based relevance judgment**.

### Why Breadth-First?

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      BREADTH-FIRST EXPANSION ORDER                          │
│                                                                             │
│   Wave 1 (all entities from seed):                                         │
│   ├── Togari Onsen                                                         │
│   ├── Nozawa Onsen                                                         │
│   ├── Yamato Takkyubin                                                     │
│   ├── Ippodo Tea                                                           │
│   ├── Toyosu Market                                                        │
│   └── ... (all 23 from seed)                                               │
│                                                                             │
│   Wave 2 (all entities discovered in wave 1):                              │
│   ├── Nozawa Fire Festival (from Nozawa Onsen)                            │
│   ├── Uji region (from Ippodo Tea)                                        │
│   ├── Suruga Bay (from spider crab research)                              │
│   └── ... (all discovered entities)                                        │
│                                                                             │
│   Wave 3 (all entities discovered in wave 2):                              │
│   ├── Dosojin deity (from Nozawa Fire Festival)                           │
│   ├── Matcha grades (from Uji region)                                     │
│   └── ...                                                                   │
│                                                                             │
│   Breadth-first ensures you cover the obvious stuff before going deep.     │
│   All ski resorts before all fire festival traditions.                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### LLM-Based Relevance (Not Hop Count)

The problem with hard depth limits:
- "Nozawa Fire Festival" at depth 2 is **extremely relevant** (happens during your trip dates!)
- "Joetsu Shinkansen" at depth 1 might be **less relevant** (you already know trains exist)

Hop count doesn't equal relevance. **The LLM should decide.**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     LLM RELEVANCE JUDGMENT                                  │
│                                                                             │
│   For each discovered entity, the LLM asks:                                │
│                                                                             │
│   "Given the ORIGINAL seed content (Japan snowboarding trip),              │
│    is this entity worth expanding?"                                        │
│                                                                             │
│   │                                                                         │
│   ├── EXPAND: Would help the user plan/enjoy/execute the trip             │
│   │   • Nozawa Fire Festival → YES (timing matters!)                       │
│   │   • Togari terrain parks → YES (affects riding plans)                  │
│   │   • Chasen craftsmanship → YES (buying one, good to know quality)     │
│   │                                                                         │
│   ├── SKIP: Interesting but not actionable for THIS trip                  │
│   │   • History of Uji tea farming → SKIP (nice to know, not useful)      │
│   │   • Shinto shrine etiquette → SKIP (not visiting shrines)             │
│   │   • Spider crab biology → SKIP (just need to transport it)            │
│   │                                                                         │
│   └── DEFER: Might be relevant, revisit if nothing better                 │
│       • Regional train timetables → DEFER (only if needed)                │
│                                                                             │
│   This is JUDGMENT, not algorithm. The LLM maintains context of what      │
│   the seed content is actually about.                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### The Prompt Carries the Constraint

The relevance filter lives in the expansion prompt, not in code:

```markdown
## Your Relevance Filter

When you discover new entities during research, ask:

"Would knowing more about this help the user with their ORIGINAL goal?"

For this knowledge base, the seed content is about:
- A Japan snowboarding trip (Jan 21 - Feb 13)
- Buying tea equipment and a live spider crab
- Logistics (luggage shipping, transport, accommodations)

Expand entities that are ACTIONABLE or DECISION-RELEVANT.
Skip entities that are merely INTERESTING or EDUCATIONAL.

Examples:
✓ "Nozawa Fire Festival" - timing could affect trip plans
✓ "Togari night skiing hours" - affects daily schedule
✓ "Live crab airline policies" - critical for the mission
✗ "History of bamboo whisks" - interesting but won't change what you buy
✗ "Shinto traditions" - not visiting temples
✗ "Japanese spider crab mating habits" - not relevant to transport

When in doubt, ask: "Would the user be annoyed if I spent tokens on this?"
```

### Expansion Depth is Also LLM-Judged

Two layers of judgment:
1. **Whether** to expand (relevance to seed)
2. **How much** to expand (practical utility)

You don't need a Wikipedia article about the Joetsu Shinkansen. You need a cheat sheet:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     EXPANSION DEPTH: CHEAT SHEET VS WIKIPEDIA              │
│                                                                             │
│   JOETSU SHINKANSEN                                                        │
│                                                                             │
│   ✗ Wikipedia mode (DON'T DO THIS):                                       │
│   │  "The Jōetsu Shinkansen is a high-speed rail line connecting          │
│   │   Tokyo and Niigata, opened in 1982. It was Japan's third             │
│   │   shinkansen line and represented a major engineering feat..."        │
│   │                                                                         │
│   │   [800 words of history, engineering, cultural significance]          │
│   │                                                                         │
│   ✓ Cheat sheet mode (DO THIS):                                           │
│   │                                                                         │
│   │   # Joetsu Shinkansen                                                  │
│   │   **Route:** Tokyo Station → Echigo-Yuzawa (for Yuzawa skiing)        │
│   │   **Time:** ~70 minutes                                                │
│   │   **Cost:** ¥6,260 (reserved seat)                                    │
│   │   **Tip:** JR Pass valid. Reserve seats during peak ski season.       │
│   │   **Backlink:** [[trips/japan-trip-itinerary]]                        │
│   │                                                                         │
│   │   Done. 5 lines. Everything you need.                                  │
│   │                                                                         │
│   The question: "What would I actually look up during the trip?"           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

The prompt should encode this:

```markdown
## Expansion Depth

Write notes like cheat sheets, not encyclopedia entries.

Ask: "If I'm standing in Tokyo Station, what do I need to know?"

Include:
- Actionable facts (times, costs, routes, hours)
- Decision-relevant info (booking tips, alternatives)
- Gotchas and warnings (reservation required, cash only, etc.)

Skip:
- History and background
- Technical details
- Cultural context (unless it affects behavior)
- Anything you'd skim past looking for the practical stuff

A good note is 5-15 lines. If it's longer, you're in Wikipedia mode.
```

This keeps token spend proportional to utility. The Nozawa Fire Festival might deserve 20 lines (dates, viewing spots, crowd tips) while Joetsu Shinkansen gets 5.

### Natural Convergence Without Hard Limits

With LLM-based relevance:

```
Wave 1: 23 entities → expand all (directly from seed)
Wave 2: 15 entities discovered → LLM judges 12 relevant, 3 skipped
Wave 3: 8 entities discovered → LLM judges 4 relevant, 4 skipped
Wave 4: 2 entities discovered → LLM judges 0 relevant, 2 skipped
Wave 5: 0 entities discovered → CONVERGED
```

The system naturally stops when:
1. New discoveries aren't relevant enough to expand
2. Expansions stop yielding new discoveries
3. Both happen together = fixed point reached

**No arbitrary "depth 3" cutoff.** The LLM's judgment IS the depth control.

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

... continues until frontier exhausted or nothing relevant remains ...

ITERATION 31: Check frontier
├── Pending entities: 2 (LLM judged not relevant to trip)
├── Discovery rate last 5 iterations: 0, 0, 1, 0, 0
├── Decision: CONVERGED
├── Creates: /status/converged.txt
└── Commit: "converged: 29 entities expanded, 4 unresearchable"

FINAL STATE:
├── 29 knowledge notes created
├── 47 total entities discovered
├── 4 marked unresearchable (private/minimal info)
├── 14 skipped (LLM judged not actionable for trip)
├── All seed documents enriched with backlinks
└── Git history shows clean expansion trail
```

---

## Minimal Seed Example: Shimanami Kaido

Starting from almost nothing - just a one-line idea:

### The Seed

```markdown
# Trip Idea

1.5 weeks cycling the Shimanami Kaido. Start in Onomichi, end in Imabari.
```

That's it. 15 words. Watch it expand.

### Wave 1: Extract from Seed

```
ITERATION 1: Initial entity extraction
├── Seed content: 15 words
├── Entities found:
│   • Shimanami Kaido (the route)
│   • Onomichi (start city)
│   • Imabari (end city)
├── Creates: /frontier/entities.md with 3 entities
└── Commit: "init: extract 3 entities from seed"

Frontier: [ ] Shimanami Kaido, [ ] Onomichi, [ ] Imabari
```

### Wave 1 Expansions

```
ITERATION 2: Expand "Shimanami Kaido"
├── Research: 70km cycling route, 6 islands, 6 bridges, bike rental
├── Creates: /knowledge/routes/shimanami-kaido.md
│
│   # Shimanami Kaido
│   **Distance:** 70km (Onomichi → Imabari)
│   **Islands:** 6 (Mukaishima, Innoshima, Ikuchijima, Omishima, Hakatajima, Oshima)
│   **Terrain:** Mostly flat, bridge approaches have grades
│   **Time:** 1 day fast, 2-3 days relaxed, 1.5 weeks = very relaxed + exploration
│   **Rental:** Giant bikes at either end, drop-off included
│   **Blue Line:** Painted route on road, impossible to get lost
│   **Backlink:** [[trips/shimanami-idea]]
│
├── Discovers: 6 island names, "Giant bike rental", "blue line"
└── Commit: "expand: shimanami-kaido"

ITERATION 3: Expand "Onomichi"
├── Research: start point, how to get there, vibe
├── Creates: /knowledge/places/onomichi.md
│
│   # Onomichi
│   **Role:** Start point for Shimanami Kaido
│   **Getting there:** Shinkansen to Fukuyama (2hr from Osaka), local train 20min
│   **Vibe:** Hillside temple town, cats, retro shopping streets
│   **Stay:** Night before departure recommended (early start)
│   **Bike pickup:** Giant store near station, opens 9am
│   **Backlink:** [[trips/shimanami-idea]]
│
├── Discovers: "Fukuyama Station", "Onomichi temple walk", "cat alley"
└── Commit: "expand: onomichi"

ITERATION 4: Expand "Imabari"
├── Research: end point, what to do after, onward travel
├── Creates: /knowledge/places/imabari.md
│
│   # Imabari
│   **Role:** End point for Shimanami Kaido
│   **Known for:** Towels (seriously, it's the towel capital)
│   **Onward:** Train to Matsuyama (1hr), ferry to Hiroshima
│   **Bike drop-off:** Giant store or any rental station
│   **Don't miss:** Imabari yakitori (local style, no skewers)
│   **Backlink:** [[trips/shimanami-idea]]
│
├── Discovers: "Matsuyama", "Imabari towels", "yakitori style"
└── Commit: "expand: imabari"

Frontier after Wave 1:
[x] Shimanami Kaido
[x] Onomichi
[x] Imabari
[ ] Mukaishima        (from Shimanami)
[ ] Innoshima         (from Shimanami)
[ ] Ikuchijima        (from Shimanami)
[ ] Omishima          (from Shimanami)
[ ] Hakatajima        (from Shimanami)
[ ] Oshima            (from Shimanami)
[ ] Giant bike rental (from Shimanami)
[ ] Fukuyama Station  (from Onomichi)
[ ] Onomichi temples  (from Onomichi)
[ ] Cat alley         (from Onomichi)
[ ] Matsuyama         (from Imabari)
[ ] Imabari towels    (from Imabari)
```

### Wave 2: LLM Judges Relevance

```
ITERATION 5-10: Expand the 6 islands
├── Each island gets a cheat sheet:
│   • What's there (beaches, cafes, shrines)
│   • Where to stay (if camping/guesthouse exists)
│   • Recommended stops
│   • Distance from previous island
│
├── Ikuchijima especially rich:
│   • Setoda town (great guesthouses)
│   • Kosanji Temple (weird/beautiful)
│   • Dolce gelato (famous stop)
│   • Discovers: "Setoda", "Kosanji", "Shimanami gelato spots"
│
└── Islands expanded: 6 notes created, 8 new entities discovered

ITERATION 11: Expand "Giant bike rental"
├── Cheat sheet:
│   • Cost: ¥1,000/day + ¥1,100 drop-off fee
│   • Reservation: Not needed for regular bikes
│   • E-bikes: ¥2,500/day, reserve ahead
│   • Hours: 9am-5pm (return by 5pm or next day)
│   • Cross-rental: Pick up Onomichi, drop Imabari ✓
├── Discovers: nothing new (practical info, no entities)
└── Commit: "expand: giant-bike-rental"

ITERATION 12: LLM SKIPS "Onomichi temples"
├── Judgment: "User is cycling through, not doing temple tourism.
│   Temples are nice but not actionable for bike trip."
├── Marks as: SKIPPED (not relevant to cycling focus)
└── Commit: "skip: onomichi-temples (not trip-relevant)"

ITERATION 13: LLM SKIPS "Cat alley"
├── Judgment: "Cute but tangential. 1.5 weeks is about the route."
├── Marks as: SKIPPED
└── No commit needed (just frontier update)

ITERATION 14: Expand "Matsuyama"
├── Judgment: "Natural extension - where do you go AFTER Imabari?"
├── Cheat sheet:
│   • Dogo Onsen (oldest onsen in Japan, must-visit)
│   • 1 hour train from Imabari
│   • Good place to recover post-ride
│   • Matsuyama Castle worth a visit
├── Discovers: "Dogo Onsen"
└── Commit: "expand: matsuyama"

ITERATION 15: LLM SKIPS "Imabari towels"
├── Judgment: "Shopping tangent. Won't affect trip planning."
├── Marks as: SKIPPED
└── No commit
```

### Wave 3: Going Deeper (Selectively)

```
ITERATION 16: Expand "Setoda" (from Ikuchijima)
├── Judgment: "This is WHERE TO STAY. Critical for 1.5 week trip."
├── Cheat sheet:
│   • Best overnight stop on the route
│   • Azumi Setoda (luxury ryokan, $$$)
│   • Shimapan hostel (budget, great vibes)
│   • Shiomachi Shotengai (retro shopping street)
│   • Restaurants: Kou, Minatoya
├── Discovers: "Azumi Setoda", "Shimapan hostel"
└── Commit: "expand: setoda"

ITERATION 17: Expand "Dogo Onsen" (from Matsuyama)
├── Judgment: "Post-ride recovery. 1.5 weeks = time to soak."
├── Cheat sheet:
│   • Honkan (main building, ¥420, crowded but iconic)
│   • Annex Asuka (¥1,280, less crowded, nicer)
│   • Open 6am-11pm
│   • Bring own towel or buy there (this is Imabari towel territory)
├── Discovers: nothing new
└── Commit: "expand: dogo-onsen"

ITERATION 18: LLM SKIPS "Kosanji Temple"
├── Judgment: "It's on the route, mentioned in Ikuchijima note.
│   Doesn't need its own expansion - just a stop."
├── Marks as: SKIPPED
└── No commit

ITERATION 19-20: Expand accommodations
├── Azumi Setoda: Luxury option, ¥40,000/night, book ahead
├── Shimapan hostel: ¥3,500/night, dorms + private, bike storage
└── Commit: "expand: setoda-accommodations"

ITERATION 21: Check frontier
├── Pending: 4 entities (Fukuyama, blue line, gelato spots, etc.)
├── LLM judges all as SKIP or too granular
├── Discovery rate last 5: 0, 1, 0, 0, 0
├── Decision: CONVERGED
└── Commit: "converged: 15 entities expanded"
```

### Final State

```
From 15 words → 15 cheat sheet notes

/trips/
└── shimanami-idea.md (enriched with backlinks)

/knowledge/
├── routes/
│   └── shimanami-kaido.md
├── places/
│   ├── onomichi.md
│   ├── imabari.md
│   ├── matsuyama.md
│   ├── setoda.md
│   └── [6 island notes]
├── services/
│   └── giant-bike-rental.md
├── accommodations/
│   ├── azumi-setoda.md
│   └── shimapan-hostel.md
└── experiences/
    └── dogo-onsen.md

Stats:
├── Entities discovered: 24
├── Expanded: 15
├── Skipped: 7 (temples, cats, towels, granular stops)
├── Unresearchable: 2
└── Waves: 3 (converged on wave 3)
```

### What the LLM Learned

The expansion naturally followed the trip's PURPOSE:

```
Cycling trip → WHERE to ride (route, islands)
            → WHERE to stay (Setoda, hostels)
            → WHERE to recover (Matsuyama, Dogo Onsen)
            → HOW to do it (bike rental, logistics)

NOT → temples, cats, towels, food spots (nice but tangential)
```

From 15 words, the system built a complete trip planning resource. Each note is a cheat sheet. The LLM's judgment kept it focused on "cycling trip" not "general Japan tourism."

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
| Skipped (not relevant) | 14 |
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

At that point, expanding further yields nothing new. Your knowledge base is *complete* for the given seed content - not by arbitrary cutoff, but by the LLM's judgment of what's actually relevant.

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
