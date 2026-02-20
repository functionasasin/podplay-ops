#!/usr/bin/env python3
"""Analyze pacing metrics from transcription.json for the anime recap reverse-ralph loop."""

import json
import statistics
import sys

with open("raw/transcription.json") as f:
    data = json.load(f)

segments = data["segments"]
episode_markers = data["episode_markers"]
pauses = data["metrics"]["significant_pauses"]

# ============================================================
# 1. SEGMENT-LEVEL METRICS
# ============================================================
narration_segs = [s for s in segments if not s.get("is_anime_dialogue")]
anime_segs = [s for s in segments if s.get("is_anime_dialogue")]

seg_durations = [s["end"] - s["start"] for s in narration_segs]
seg_word_counts = [len(s["text"].split()) for s in narration_segs]
seg_wpm = []
for s in narration_segs:
    dur = s["end"] - s["start"]
    words = len(s["text"].split())
    if dur > 0:
        seg_wpm.append(words / dur * 60)

print("=== SEGMENT-LEVEL STATS ===")
print(f"Total narration segments: {len(narration_segs)}")
print(f"Segment duration: mean={statistics.mean(seg_durations):.2f}s, median={statistics.median(seg_durations):.2f}s, "
      f"min={min(seg_durations):.2f}s, max={max(seg_durations):.2f}s, stdev={statistics.stdev(seg_durations):.2f}s")
print(f"Words per segment: mean={statistics.mean(seg_word_counts):.1f}, median={statistics.median(seg_word_counts):.0f}, "
      f"min={min(seg_word_counts)}, max={max(seg_word_counts)}")
print(f"Per-segment WPM: mean={statistics.mean(seg_wpm):.1f}, median={statistics.median(seg_wpm):.1f}, "
      f"stdev={statistics.stdev(seg_wpm):.1f}")

# ============================================================
# 2. WINDOWED WPM (30-second windows)
# ============================================================
total_dur = data["metrics"]["total_video_duration"]
window_sizes = [30, 60, 300]  # 30s, 1min, 5min

for window_size in window_sizes:
    window_label = f"{window_size}s" if window_size < 60 else f"{window_size//60}min"
    windows = []
    for start in range(0, int(total_dur), window_size):
        end = start + window_size
        word_count = 0
        speaking_time = 0
        for s in narration_segs:
            # Overlap between segment and window
            overlap_start = max(s["start"], start)
            overlap_end = min(s["end"], end)
            if overlap_start < overlap_end:
                overlap_frac = (overlap_end - overlap_start) / (s["end"] - s["start"]) if (s["end"] - s["start"]) > 0 else 0
                word_count += len(s["text"].split()) * overlap_frac
                speaking_time += overlap_end - overlap_start
        wpm = word_count / (window_size / 60) if window_size > 0 else 0
        windows.append({
            "start": start,
            "end": end,
            "words": word_count,
            "speaking_time": speaking_time,
            "wpm": wpm,
            "density": speaking_time / window_size  # fraction of window that has narration
        })

    wpm_vals = [w["wpm"] for w in windows if w["words"] > 0]
    density_vals = [w["density"] for w in windows if w["words"] > 0]

    print(f"\n=== {window_label.upper()} WINDOW WPM ===")
    print(f"Windows: {len(windows)} total, {len(wpm_vals)} with content")
    if wpm_vals:
        print(f"WPM: mean={statistics.mean(wpm_vals):.1f}, median={statistics.median(wpm_vals):.1f}, "
              f"min={min(wpm_vals):.1f}, max={max(wpm_vals):.1f}, stdev={statistics.stdev(wpm_vals):.1f}")
        print(f"Density: mean={statistics.mean(density_vals):.3f}, min={min(density_vals):.3f}, max={max(density_vals):.3f}")

    # Print per-window data for 30s windows (for charting)
    if window_size == 30:
        print("\nPer-30s-window WPM:")
        for w in windows:
            time_str = f"{int(w['start']//60):02d}:{int(w['start']%60):02d}"
            bar = "#" * int(w["wpm"] / 5)
            print(f"  {time_str} | WPM: {w['wpm']:6.1f} | density: {w['density']:.2f} | {bar}")

# ============================================================
# 3. INTER-SEGMENT GAP ANALYSIS
# ============================================================
gaps = []
for i in range(1, len(segments)):
    gap = segments[i]["start"] - segments[i-1]["end"]
    if gap > 0.01:  # ignore tiny overlaps or zero gaps
        gaps.append({
            "start": segments[i-1]["end"],
            "end": segments[i]["start"],
            "duration": gap,
            "after_seg": i-1,
            "before_seg": i
        })

# Also capture overlaps (negative gaps)
overlaps = []
for i in range(1, len(segments)):
    gap = segments[i]["start"] - segments[i-1]["end"]
    if gap < -0.01:
        overlaps.append(abs(gap))

print("\n=== INTER-SEGMENT GAPS ===")
if gaps:
    gap_durations = [g["duration"] for g in gaps]
    print(f"Total gaps: {len(gaps)}")
    print(f"Gap duration: mean={statistics.mean(gap_durations):.3f}s, median={statistics.median(gap_durations):.3f}s, "
          f"max={max(gap_durations):.3f}s")

    # Distribution of gap sizes
    micro = [g for g in gap_durations if g < 0.5]
    short = [g for g in gap_durations if 0.5 <= g < 1.5]
    medium = [g for g in gap_durations if 1.5 <= g < 3.0]
    long_ = [g for g in gap_durations if g >= 3.0]
    print(f"Gap size distribution:")
    print(f"  Micro (<0.5s): {len(micro)} ({len(micro)/len(gaps)*100:.1f}%)")
    print(f"  Short (0.5-1.5s): {len(short)} ({len(short)/len(gaps)*100:.1f}%)")
    print(f"  Medium (1.5-3.0s): {len(medium)} ({len(medium)/len(gaps)*100:.1f}%)")
    print(f"  Long (3.0s+): {len(long_)} ({len(long_)/len(gaps)*100:.1f}%)")

    # Longest gaps
    sorted_gaps = sorted(gaps, key=lambda g: g["duration"], reverse=True)
    print(f"\nTop 10 longest gaps:")
    for g in sorted_gaps[:10]:
        time_str = f"{int(g['start']//60):02d}:{int(g['start']%60):02d}"
        print(f"  {time_str}: {g['duration']:.2f}s")

if overlaps:
    print(f"\nSegment overlaps: {len(overlaps)} (SRT artifacts)")
    print(f"  Mean overlap: {statistics.mean(overlaps):.3f}s")

# ============================================================
# 4. PER-EPISODE PACING
# ============================================================
print("\n=== PER-EPISODE PACING ===")
ep_data = []
for i, marker in enumerate(episode_markers):
    ep_start = marker["timestamp"]
    if i + 1 < len(episode_markers):
        ep_end = episode_markers[i + 1]["timestamp"]
    else:
        ep_end = total_dur - 28  # Exclude outro (~28s)

    ep_words = 0
    ep_speaking = 0
    for s in narration_segs:
        overlap_start = max(s["start"], ep_start)
        overlap_end = min(s["end"], ep_end)
        if overlap_start < overlap_end:
            frac = (overlap_end - overlap_start) / (s["end"] - s["start"]) if (s["end"] - s["start"]) > 0 else 0
            ep_words += len(s["text"].split()) * frac
            ep_speaking += overlap_end - overlap_start

    ep_duration = ep_end - ep_start
    ep_wpm = ep_words / (ep_duration / 60) if ep_duration > 0 else 0
    ep_density = ep_speaking / ep_duration if ep_duration > 0 else 0

    ep_data.append({
        "episode": marker["episode"],
        "start": ep_start,
        "end": ep_end,
        "duration": ep_duration,
        "words": ep_words,
        "wpm": ep_wpm,
        "density": ep_density
    })

    print(f"  Ep {marker['episode']:2d}: {ep_duration:6.1f}s ({ep_duration/60:.1f}min) | "
          f"{ep_words:5.0f} words | {ep_wpm:5.1f} WPM | density: {ep_density:.3f}")

ep_wpms = [e["wpm"] for e in ep_data]
print(f"\nPer-episode WPM: mean={statistics.mean(ep_wpms):.1f}, median={statistics.median(ep_wpms):.1f}, "
      f"min={min(ep_wpms):.1f} (ep {ep_data[ep_wpms.index(min(ep_wpms))]['episode']}), "
      f"max={max(ep_wpms):.1f} (ep {ep_data[ep_wpms.index(max(ep_wpms))]['episode']}), "
      f"stdev={statistics.stdev(ep_wpms):.1f}")

# ============================================================
# 5. BREATHING ROOM PATTERNS (anime dialogue + pauses)
# ============================================================
print("\n=== BREATHING ROOM ANALYSIS ===")
anime_moments = data["anime_dialogue_moments"]
breath_events = []

# Pauses
for p in pauses:
    breath_events.append({
        "type": "pause",
        "start": p["start"],
        "end": p["end"],
        "duration": p["duration"]
    })

# Anime dialogue moments (each cluster)
# Group consecutive anime dialogue within 10s of each other
ad_clusters = []
current_cluster = None
for ad in anime_moments:
    if current_cluster is None:
        current_cluster = {"start": ad["timestamp"], "end": ad["timestamp"] + 3, "moments": [ad]}
    elif ad["timestamp"] - current_cluster["end"] < 10:
        current_cluster["end"] = ad["timestamp"] + 3
        current_cluster["moments"].append(ad)
    else:
        ad_clusters.append(current_cluster)
        current_cluster = {"start": ad["timestamp"], "end": ad["timestamp"] + 3, "moments": [ad]}
if current_cluster:
    ad_clusters.append(current_cluster)

for cluster in ad_clusters:
    breath_events.append({
        "type": "anime_dialogue",
        "start": cluster["start"],
        "end": cluster["end"],
        "duration": cluster["end"] - cluster["start"],
        "moment_count": len(cluster["moments"])
    })

breath_events.sort(key=lambda e: e["start"])

print(f"Total breathing events: {len(breath_events)}")
print(f"  Pauses: {len(pauses)}")
print(f"  Anime dialogue clusters: {len(ad_clusters)}")

# Time between breathing events
if len(breath_events) > 1:
    inter_breath = []
    for i in range(1, len(breath_events)):
        gap = breath_events[i]["start"] - breath_events[i-1]["end"]
        inter_breath.append(gap)

    print(f"\nTime between breathing events:")
    print(f"  Mean: {statistics.mean(inter_breath):.1f}s ({statistics.mean(inter_breath)/60:.1f}min)")
    print(f"  Median: {statistics.median(inter_breath):.1f}s ({statistics.median(inter_breath)/60:.1f}min)")
    print(f"  Min: {min(inter_breath):.1f}s")
    print(f"  Max: {max(inter_breath):.1f}s ({max(inter_breath)/60:.1f}min)")
    print(f"  Stdev: {statistics.stdev(inter_breath):.1f}s")

# ============================================================
# 6. NARRATION SPEED VARIATION (WPM per 30s, look at variance)
# ============================================================
print("\n=== SPEED CONSISTENCY ===")
# Coefficient of variation of 30s window WPM
windows_30s = []
for start in range(0, int(total_dur), 30):
    end = start + 30
    word_count = 0
    for s in narration_segs:
        overlap_start = max(s["start"], start)
        overlap_end = min(s["end"], end)
        if overlap_start < overlap_end:
            overlap_frac = (overlap_end - overlap_start) / (s["end"] - s["start"]) if (s["end"] - s["start"]) > 0 else 0
            word_count += len(s["text"].split()) * overlap_frac
    wpm = word_count / 0.5  # 30s = 0.5 min
    if word_count > 5:  # filter near-empty windows
        windows_30s.append(wpm)

cv = statistics.stdev(windows_30s) / statistics.mean(windows_30s) * 100
print(f"30s-window WPM coefficient of variation: {cv:.1f}%")
print(f"  (Lower = more consistent. 5-10% = very consistent, 10-20% = moderate, >20% = variable)")

# First half vs second half
mid = len(windows_30s) // 2
first_half = windows_30s[:mid]
second_half = windows_30s[mid:]
print(f"\nFirst half avg WPM: {statistics.mean(first_half):.1f}")
print(f"Second half avg WPM: {statistics.mean(second_half):.1f}")
print(f"Acceleration: {(statistics.mean(second_half) - statistics.mean(first_half)) / statistics.mean(first_half) * 100:.1f}%")

# ============================================================
# 7. SENTENCE LENGTH PROXY (words between major connectors)
# ============================================================
print("\n=== SENTENCE/PHRASE LENGTH ===")
# Use segment text to estimate sentence lengths
all_text = " ".join(s["text"] for s in narration_segs)
# Split on periods, question marks, exclamation points
import re
sentences = re.split(r'[.!?]+', all_text)
sentences = [s.strip() for s in sentences if s.strip() and len(s.strip().split()) >= 2]
sent_lengths = [len(s.split()) for s in sentences]

print(f"Estimated sentence count: {len(sentences)}")
print(f"Words per sentence: mean={statistics.mean(sent_lengths):.1f}, median={statistics.median(sent_lengths):.0f}, "
      f"min={min(sent_lengths)}, max={max(sent_lengths)}, stdev={statistics.stdev(sent_lengths):.1f}")

# Distribution
short_sent = [s for s in sent_lengths if s <= 5]
med_sent = [s for s in sent_lengths if 6 <= s <= 12]
long_sent = [s for s in sent_lengths if 13 <= s <= 20]
vlong_sent = [s for s in sent_lengths if s > 20]
print(f"Sentence length distribution:")
print(f"  Short (2-5 words): {len(short_sent)} ({len(short_sent)/len(sentences)*100:.1f}%)")
print(f"  Medium (6-12 words): {len(med_sent)} ({len(med_sent)/len(sentences)*100:.1f}%)")
print(f"  Long (13-20 words): {len(long_sent)} ({len(long_sent)/len(sentences)*100:.1f}%)")
print(f"  Very long (21+ words): {len(vlong_sent)} ({len(vlong_sent)/len(sentences)*100:.1f}%)")

# ============================================================
# 8. OUTPUT SUMMARY JSON
# ============================================================
summary = {
    "global_metrics": {
        "total_duration_s": total_dur,
        "narration_duration_s": data["metrics"]["narration_speaking_time"],
        "total_words": data["metrics"]["narration_word_count"],
        "global_wpm": data["metrics"]["narration_wpm"],
        "narration_density": data["metrics"]["narration_speaking_time"] / total_dur,
    },
    "segment_stats": {
        "count": len(narration_segs),
        "duration_mean": round(statistics.mean(seg_durations), 2),
        "duration_median": round(statistics.median(seg_durations), 2),
        "duration_stdev": round(statistics.stdev(seg_durations), 2),
        "words_per_seg_mean": round(statistics.mean(seg_word_counts), 1),
        "wpm_mean": round(statistics.mean(seg_wpm), 1),
        "wpm_median": round(statistics.median(seg_wpm), 1),
        "wpm_stdev": round(statistics.stdev(seg_wpm), 1),
    },
    "windowed_wpm_30s": {
        "mean": round(statistics.mean(windows_30s), 1),
        "median": round(statistics.median(windows_30s), 1),
        "stdev": round(statistics.stdev(windows_30s), 1),
        "cv_percent": round(cv, 1),
        "first_half_mean": round(statistics.mean(first_half), 1),
        "second_half_mean": round(statistics.mean(second_half), 1),
        "acceleration_percent": round((statistics.mean(second_half) - statistics.mean(first_half)) / statistics.mean(first_half) * 100, 1),
    },
    "gaps": {
        "total_gaps": len(gaps),
        "gap_duration_mean": round(statistics.mean([g["duration"] for g in gaps]), 3) if gaps else 0,
        "gap_duration_median": round(statistics.median([g["duration"] for g in gaps]), 3) if gaps else 0,
        "micro_count": len(micro),
        "short_count": len(short),
        "medium_count": len(medium),
        "long_count": len(long_),
        "overlaps_count": len(overlaps),
    },
    "per_episode_wpm": {e["episode"]: round(e["wpm"], 1) for e in ep_data},
    "per_episode_wpm_stats": {
        "mean": round(statistics.mean(ep_wpms), 1),
        "median": round(statistics.median(ep_wpms), 1),
        "stdev": round(statistics.stdev(ep_wpms), 1),
        "min": round(min(ep_wpms), 1),
        "max": round(max(ep_wpms), 1),
    },
    "breathing_room": {
        "total_events": len(breath_events),
        "inter_breath_mean_s": round(statistics.mean(inter_breath), 1) if len(breath_events) > 1 else None,
        "inter_breath_median_s": round(statistics.median(inter_breath), 1) if len(breath_events) > 1 else None,
    },
    "sentence_stats": {
        "count": len(sentences),
        "words_mean": round(statistics.mean(sent_lengths), 1),
        "words_median": round(statistics.median(sent_lengths), 0),
        "words_stdev": round(statistics.stdev(sent_lengths), 1),
        "short_pct": round(len(short_sent)/len(sentences)*100, 1),
        "medium_pct": round(len(med_sent)/len(sentences)*100, 1),
        "long_pct": round(len(long_sent)/len(sentences)*100, 1),
        "vlong_pct": round(len(vlong_sent)/len(sentences)*100, 1),
    }
}

with open("raw/pacing-metrics.json", "w") as f:
    json.dump(summary, f, indent=2)

print("\n=== WRITTEN: raw/pacing-metrics.json ===")
