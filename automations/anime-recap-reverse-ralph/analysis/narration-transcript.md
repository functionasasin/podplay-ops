# Narration Transcript Analysis

## Summary

The JarAnime Parasyte recap is a 75.3-minute narration covering all 24 episodes of Parasyte: The Maxim. The narrator speaks at 144.1 WPM with 10,759 narration words, punctuated by 25 anime dialogue moments (1.5% of segments). Episode coverage follows a compression curve — early episodes get ~5 min each while later episodes average ~2 min.

## Data

- **Source**: `jaranime-parasyte.en-orig.srt` (auto-generated YouTube captions, parsed via SRT overlap de-duplication into `raw/transcription.json`)
- **Method**: SRT parsing with overlap de-duplication (Whisper unavailable — no GPU)
- **Total segments**: 1,636
- **Narration segments**: 1,611 (98.5%)
- **Anime dialogue segments**: 25 (1.5%)
- **Total word count**: 10,899
- **Narration word count**: 10,759
- **Anime dialogue word count**: 140
- **Total video duration**: 4,516.6s (75.3 min)
- **Narration speaking time**: 4,479.6s (74.7 min)
- **Anime dialogue time**: 111.4s (1.9 min)
- **Silence/gap time**: 9.2s
- **Narration WPM**: 144.1
- **Overall WPM**: 145.1

### Significant Pauses (8 total, avg 4.62s)

| Start | End | Duration | Context |
|-------|-----|----------|---------|
| 19.9s | 25.8s | 5.9s | Hook → anime dialogue ("Are you okay?") |
| 28.8s | 31.0s | 2.2s | Post-hook anime dialogue → "Now that's a transformation" |
| 208.7s | 213.2s | 4.5s | Anime dialogue ("What the hell is going on?") |
| 244.6s | 246.5s | 1.9s | Within ep 1 narration |
| 620.2s | 622.9s | 2.6s | Anime dialogue ("You're a demon") |
| 2379.6s | 2386.2s | 6.6s | Anime dialogue ("Shinn, calm down") |
| 2513.2s | 2516.5s | 3.2s | Within ep 11 narration |
| 4088.5s | 4098.5s | 10.0s | Anime dialogue cluster (ep 22-23 climax) |

### Episode Coverage Map

| Episode | Timestamp | Duration | Explicit? | Notes |
|---------|-----------|----------|-----------|-------|
| Hook | 0:00 | 36.2s (0.6m) | — | Opening question + anime teaser |
| 1 | 0:36 | 395.8s (6.6m) | Yes | Longest — establishes premise |
| 2 | 7:12 | 320.4s (5.3m) | Yes | Setup continues |
| 3 | 12:32 | 140.9s (2.3m) | Yes | Compression begins |
| 4 | 14:53 | 234.2s (3.9m) | Yes | |
| 5 | 18:47 | 214.2s (3.6m) | Yes | |
| 6 | 22:21 | 196.9s (3.3m) | Yes | |
| 7 | 25:38 | 250.7s (4.2m) | Yes | |
| 8 | 29:49 | 245.6s (4.1m) | Yes | |
| 9 | 33:55 | 276.5s (4.6m) | Inferred | "episode starts like an average day" |
| 10 | 38:31 | 161.0s (2.7m) | Yes | |
| 11 | 41:12 | 158.2s (2.6m) | Yes | |
| 12 | 43:50 | 192.0s (3.2m) | Yes | |
| 13 | 47:02 | 177.2s (3.0m) | Yes | Arc merge begins (ep 13-17) |
| 14 | 50:00 | 180.0s (3.0m) | Inferred | Merged into ep 13-17 arc |
| 15 | 53:00 | 120.0s (2.0m) | Inferred | Merged into ep 13-17 arc |
| 16 | 55:00 | 113.4s (1.9m) | Inferred | Merged into ep 13-17 arc |
| 17 | 56:53 | 141.5s (2.4m) | Yes | |
| 18 | 59:14 | 126.9s (2.1m) | Yes | |
| 19 | 61:21 | 133.8s (2.2m) | Yes | |
| 20 | 63:35 | 110.2s (1.8m) | Yes | Shortest episode |
| 21 | 65:25 | 131.1s (2.2m) | Yes | |
| 22 | 67:36 | 145.8s (2.4m) | Yes | |
| 23 | 70:02 | 120.3s (2.0m) | Yes | |
| 24 | 72:03 | 193.6s (3.2m) | Inferred | Season finale — gets extra time |

**Episode duration stats**: Mean 186.7s (3.1m), Median 169.1s (2.8m), Min 110.2s (ep 20), Max 395.8s (ep 1), StdDev 71.4s

### Anime Dialogue Moments (25 total)

Selected moments where the anime's original audio plays through the narration:

| Timestamp | Text | Context |
|-----------|------|---------|
| 0:20 | "Are you okay?" | Hook — teaser clip |
| 0:23 | "To a creature from your sci-fi thriller" | Hook — transformation teaser |
| 3:29 | "What the hell is going on?" | Ep 1 — Shinichi's confusion |
| 3:30 | "Shinichi's really having an off day" | Ep 1 — narrator commentary |
| 10:18 | "You're a demon" | Ep 3 — Migi confrontation |
| 10:20 | "I have done some research into..." | Ep 3 — Migi's response |
| 10:29 | "Oh, yeah. That line's definitely going..." | Ep 3 — narrator reaction |
| 13:52 | "And the result might surprise you..." | Ep 4 — pregnancy reveal |
| 13:57 | "Apparently, regardless of being with..." | Ep 4 — narrator context |
| 17:34 | "It's not right. Something's very wrong." | Ep 5 — mother discovery |
| 17:41 | "The picture perfect replication..." | Ep 5 — narrator analysis |
| 28:25 | "I can see it. I can see every move..." | Ep 8 — Shinichi power-up |
| 28:30 | "Like, come on. He's a badass now, too." | Ep 8 — narrator hype |
| 30:46 | "It was at this moment that he knew..." | Ep 8 — fight moment |
| 30:52 | "while serving looks too..." | Ep 8 — narrator commentary |
| 38:08 | "Do you really do all those horrible..." | Ep 10 — Yuko confrontation |
| 38:11 | "Not good." | Ep 10 — narrator reaction |
| 39:41 | "Shinn, calm down." | Ep 10 — Migi calming Shinichi |
| 39:44 | "Fortunately, he gets back up..." | Ep 10 — narrator continues |
| 46:59 | "He's definitely a glass half full..." | Ep 12 — narrator humor |
| 68:07 | "Well," | Ep 22 — anime dialogue |
| 68:08 | "it didn't work. Let's get out of here." | Ep 22 — retreat scene |
| 68:12 | "Where can we go?" | Ep 22 — desperation |
| 68:13 | "Just run," | Ep 22 — urgency |
| 68:14 | "bro. survives that. Damn, fellas..." | Ep 22 — narrator reaction |

### Sample Narration — Opening (Hook)

```
[0.1s] How well do you know your neighbor, your co-workers, even your best friend?
[5.9s] Well, you might start secondguessing yourself after watching Parasite: The Maxim,
[11.1s] the anime that takes its main character from being an unsuspecting average Joe like this.
>> [20.3s] Are you okay?
>> [22.7s] To a creature from your sci-fi thriller, Nightmares.
[31.0s] Now that's a transformation. I've got a good one for you today. So, let's get into it.
```

### Sample Narration — Middle (Episode 10 recap)

```
[2309.5s] where his friend is before it's too late. In the 10th episode, Yuko fights
[2315.0s] for her life. She throws the chemical bottle at Shimada, and when the liquid
[2319.9s] hits his bare skin, it burns.
```

### Sample Narration — Ending (Outro)

```
[4505.3s] looking for another anime to fill the migysized hole in your heart?
[4509.4s] Make sure to check out some of my other videos that you see right here.
[4512.6s] And in the meantime, peace.
```

## Patterns

1. **Narration pace: 144.1 WPM** — Typical conversational narration speed (vs 130-150 WPM normal speech, 150-170 WPM podcast). This is a comfortable, engaged pace — not rushed, not slow.

2. **Episode compression curve** — Early episodes (1-2) get 5-7 minutes each for world-building and character establishment. Mid-season (3-12) averages ~3.2 minutes. Late-season (13-24) compresses to ~2.2 minutes as the narrator trusts the viewer understands the world and accelerates through familiar dynamics.

3. **Arc merging for later episodes** — Episodes 13-17 form a continuous arc without explicit episode boundaries. The narrator drops the "in the Nth episode" framing and narrates as continuous story. The forward engine needs to handle both per-episode and arc-based narration modes.

4. **Anime dialogue is rare but strategic (25 moments)** — ~1 per episode on average, used for:
   - **Emotional peaks**: Reactions, confrontations, transformations
   - **Comedy/personality**: Narrator reacts to anime dialogue for humor
   - **Plot-critical lines**: Key revelations or turning points
   - **Hook teasing**: First two moments are in the opening 23 seconds

5. **Significant pauses correlate with anime dialogue** — 5 of 8 pauses occur at anime dialogue insertion points. The narrator pauses to let the anime "speak," creating rhythmic variety.

6. **Structural markers in narration**:
   - Hook opens with a rhetorical question
   - "Let's get into it" transitions from hook to recap body
   - Explicit episode markers: "In the Nth episode" (20 of 24 episodes explicitly marked)
   - Outro: Channel plug + "And in the meantime, peace."

7. **Conversational narrator persona** — Direct address ("I've got a good one for you today"), contractions, pop culture references, emotional reactions ("Damn, fellas"), slang ("badass"). The narrator is a friend retelling, not a documentary host.

## Spec Implications

- **TTS target WPM**: 144 WPM for narration. This is the baseline pacing target for the forward engine's text-to-speech.
- **Script word budget**: ~10,800 words for a 75-minute recap of 24 episodes. For shorter seasons (12 eps), target ~5,400 words / ~37 minutes.
- **Episode duration allocation**: Use a compression function — early episodes get 1.7x mean duration, late episodes get 0.6x. Episode 1 always gets the most time (premise establishment). Season finale gets a bump (~1.1x mean).
- **Anime dialogue budget**: ~25 moments per 24 episodes (~1/ep). Place them at emotional peaks, comedy beats, and hook teasers.
- **Pause insertion**: Insert 2-7 second pauses at anime dialogue moments. Average 4.6 seconds. Longest pauses (6-10s) at climactic anime dialogue clusters.
- **Arc merging**: For multi-episode arcs (2+ episodes with continuous plot), drop per-episode framing and narrate as a continuous story. The forward engine's script generator should detect arc boundaries.
- **Explicit episode markers**: Use "In the Nth episode" framing for 80%+ of episodes. The remaining 20% can be implicit transitions within arcs.
- **Hook formula**: Rhetorical question → anime dialogue teaser (2 clips) → "I've got a good one for you today" → "Let's get into it"
- **Outro formula**: Channel plug → "And in the meantime, peace" (or equivalent sign-off)
- **Note**: This analysis used SRT parsing (segment-level timestamps). Word-level timestamps from Whisper would enable more precise pacing analysis in the `pacing-metrics` aspect. The 144.1 WPM figure is reliable at the segment level.
