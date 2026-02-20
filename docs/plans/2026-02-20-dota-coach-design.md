# Dota Coach — AI Coaching via Claude Agent SDK

**Date**: 2026-02-20
**Status**: Design
**Type**: Product/Service

## Idea

A live AI coaching service for Dota 2. A local app screenshots the player's game every 60 seconds, sends it to a Python backend running the Claude Agent SDK, which analyzes the screenshot against a curated knowledge base of pro-level Dota 2 knowledge, and speaks 2-3 sentences of macro advice through a Discord bot in the player's voice channel.

The key insight: the knowledge base IS a codebase. Claude Agent SDK gives Claude the same tools it has in Claude Code (Glob, Grep, Read). The screenshot is just a query — Claude searches the "codebase" of Dota knowledge the same way it'd search source code. No RAG pipeline, no embeddings, no vector DB, no fine-tuning. Just well-curated markdown files and Claude's native tool use.

## Architecture

Four components:

### 1. Local Capture App

Lightweight app (Electron or Python) running on the player's machine. Screenshots the Dota 2 window every 60 seconds. Sends PNGs to the backend over WebSocket. Also handles auth and hero selection.

### 2. Coaching Backend (Python + Claude Agent SDK)

Receives screenshots, manages one `ClaudeSDKClient` session per active game. Claude has the knowledge base repo as its `cwd` with `settings_sources: ["project"]` to load the coaching persona from CLAUDE.md.

Per cycle:
1. Save screenshot to disk
2. Send to Claude session: "Here is the current game state. What should the player focus on?"
3. Claude reads the screenshot (vision), searches the KB with Glob/Grep/Read, produces 2-3 sentences
4. Send advice text to ElevenLabs TTS
5. Send audio to Discord bot for playback

Session is persistent — Claude accumulates context across the whole game, tracks the arc, avoids repeating advice. Budget capped per game (~$2-5 for 45 minutes). Tools restricted to read-only (Glob, Grep, Read).

### 3. Discord Bot (Node.js, discord.js)

Joins the player's voice channel. Plays TTS audio clips every 60 seconds. Handles slash commands (`/coach start`, `/coach stop`). Audio-only — Discord's bot API doesn't support video, which is why capture is handled locally.

### 4. Knowledge Base Builder (Offline, Ralph Loop)

Builds and maintains the knowledge base by running Claude Code on pro game footage and OpenDota API data. Uses the reverse ralph loop pattern (same as the anime recap engine in this repo).

**Wave 1 — Raw extraction**: Process pro VODs frame-by-frame, transcribe caster commentary, pull OpenDota API data (item timings, gold graphs, fight logs).

**Wave 2 — Pattern analysis**: Across many games, identify patterns per hero, per concept, per matchup. What do pros do that average players don't?

**Wave 3 — Synthesis**: Distill into curated markdown files. Refreshed each major patch.

Source material: both VODs (visual patterns matching what the live coach sees) and structured API data (precise timings, win rates, build orders).

## Knowledge Base Structure

```
dota-coach-kb/
├── CLAUDE.md                 # Coaching persona, response format, KB usage guide
├── patch/
│   └── 7.37.md              # Current patch notes and meta shifts
├── heroes/
│   └── {hero}.md            # Per-hero: power spikes, timings, matchups, role (~125 files)
├── concepts/
│   ├── laning.md
│   ├── split-pushing.md
│   ├── teamfighting.md
│   ├── vision-control.md
│   ├── objective-timing.md
│   ├── drafting.md
│   └── economy.md
├── matchups/
│   ├── carry-vs-carry/
│   └── lane-matchups/
├── meta/
│   ├── current-tier-list.md
│   ├── common-drafts.md
│   └── item-meta.md
└── pro-patterns/
    ├── early-game.md
    ├── mid-game.md
    └── late-game.md
```

CLAUDE.md defines the coaching persona, response constraints (2-3 sentences, macro-level, actionable, non-repetitive), and how Claude should search the KB.

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Backend | Python, `claude-agent-sdk` |
| Model | Claude Opus 4.6 (vision + tool use) |
| TTS | ElevenLabs (cloud) |
| Discord bot | Node.js, discord.js, @discordjs/voice |
| Local capture | Electron or Python (window screenshot) |
| KB builder | Claude Code, reverse ralph loop, FFmpeg, OpenDota API |
| KB format | Markdown files in a git repo |

## MVP Scope

One hero, one full game, end-to-end:

1. Small knowledge base for one hero (e.g., Anti-Mage)
2. Local capture app that screenshots every 60s
3. Backend with Claude Agent SDK session analyzing screenshots against the KB
4. ElevenLabs TTS producing audio
5. Discord bot playing the audio in voice channel

Success = the coach gives relevant, non-repetitive macro advice for an entire game on that hero.

## Design Decisions

- **Claude Agent SDK over raw API**: The SDK gives Claude native file system tools. The KB is searched dynamically per query, not pre-loaded into context. This scales to a large KB without context window limits.
- **Discord for voice only**: Discord bots can't receive video (API limitation). Screen capture is handled by a local app. Discord is just the audio delivery mechanism.
- **Persistent session per game**: One Claude session for the whole game. Context accumulates — Claude tracks the game arc and avoids repeating itself. ~45 turns over a 45-minute game.
- **Read-only tools**: Claude can only search and read the KB. No Bash, no Write. It's a reader, not an executor.
- **60-second interval**: Macro-level advice doesn't need to be faster. 5-10s processing time is fine within a 60s cycle. Strategic, not tactical.
- **Knowledge base as codebase**: No RAG, no embeddings. Claude searches markdown files the same way it searches source code. The structure just needs to be grep-friendly.

## Open Questions

- **Capture app platform**: Electron (cross-platform, heavier) vs Python (lighter, platform-specific window capture)?
- **Backend hosting**: Fly.io (aligned with existing infra) vs cloud VM vs serverless?
- **Cost model**: Per-game cost at ~45 Opus 4.6 calls with vision + tool use. Need to estimate and price accordingly.
- **Game state integration**: Dota 2 has a GSI (Game State Integration) API that pushes JSON data to a local HTTP server. Could supplement screenshots with precise structured data (gold, cooldowns, items). Worth adding to MVP or later?
- **Multi-user concurrency**: Each game needs its own Claude session + KB access. How many concurrent games can the backend handle?
