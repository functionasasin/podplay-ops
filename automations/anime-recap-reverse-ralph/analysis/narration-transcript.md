# Narration Transcript Analysis

## Summary

The JarAnime Parasyte recap contains 1,636 subtitle segments across 75.3 minutes. Narration dominates at 1,611 segments (98.5%) with 10,916 words at an average pace of 73.9 WPM. Only 25 segments (1.5%) are anime dialogue moments marked with `>>` prefixes.

## Data

- **Source**: `jaranime-parasyte.en-orig.srt` (auto-generated YouTube captions, parsed into `raw/transcription.json`)
- **Total segments**: 1,636
- **Narration segments**: 1,611 (98.5%)
- **Anime dialogue segments**: 25 (1.5%)
- **Total word count**: 11,084
- **Narration word count**: 10,916
- **Total duration**: 4,517s (75.3 min)
- **Average WPM**: 73.9

### Sample — Opening (Hook)
```
[0.1s] How well do you know your neighbor, your co-workers, even your best friend?
[5.9s] Well, you might start secondguessing yourself after watching Parasite: The Maxim,
[11.1s] the anime that takes its main character from being an unsuspecting average Joe like this.
[20.3s] >> Are you okay?
[22.7s] >> To a creature from your sci-fi thriller, Nightmares.
[31.0s] Now that's a transformation. I've got a good one for you today. So, let's get into it.
```

### Sample — Middle (Episode 10 recap)
```
[2309.5s] where his friend is before it's too late. In the 10th episode, Yuko fights
[2315.0s] for her life. She throws the chemical bottle at Shimada, and when the liquid
[2319.9s] hits his bare skin, it burns.
```

### Sample — Ending (Outro)
```
[4505.3s] looking for another anime to fill the migysized hole in your heart?
[4509.4s] Make sure to check out some of my other videos that you see right here.
[4512.6s] And in the meantime, peace.
```

## Patterns

1. **Low WPM relative to typical narration** — 73.9 WPM is significantly slower than typical speech (130-150 WPM) or podcast narration (150-170 WPM). This is auto-generated captions though, so the real WPM is likely higher — the SRT segments overlap and are broken mid-sentence, which deflates the calculated rate.
2. **Overlapping timestamps** — SRT segments overlap (e.g., segment ending at 5.9s while next starts at 2.4s), indicating YouTube's auto-caption chunking. Real Whisper output with word-level timestamps would give more accurate pacing data.
3. **Anime dialogue is rare but strategic** — Only 1.5% of segments are anime dialogue (marked with `>>`). These 25 moments are carefully chosen — emotional reactions, funny moments, or plot-critical lines.
4. **Clear structural markers** — "Let's get into it" transitions from hook to recap. "Peace" closes the video. Episode numbers are explicitly mentioned ("In the 10th episode").
5. **Conversational tone** — Contractions, direct address ("I've got a good one for you today"), pop culture references, emotional reactions.

## Spec Implications

- **Whisper with word-level timestamps** should be used for real analysis rather than SRT parsing — SRT segments are too coarse for accurate pacing metrics
- **WPM target** for the forward engine's TTS should be calibrated from Whisper output, not SRT-derived stats. Expect 140-160 WPM actual narration speed.
- **Anime dialogue ratio**: ~1.5% of total segments, ~25 moments across 24 episodes (~1 per episode). The forward engine should target roughly 1 anime dialogue moment per episode covered.
- **Script structure**: Hook question → anime dialogue teaser → "Let's get into it" → chronological recap → outro with channel plug. This pattern should be templatized in the spec.
- **Note**: This analysis used SRT parsing. Whisper transcription would provide more accurate word-level timestamps for pacing-metrics analysis. Consider re-running with Whisper when GPU is available.
