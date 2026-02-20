#!/usr/bin/env python3
"""Process PySceneDetect CSV output into scenes.json with statistics."""
import csv
import json
import statistics
import sys

csv_path = "raw/jaranime-parasyte-Scenes.csv"
output_path = "raw/scenes.json"

scenes = []
with open(csv_path, "r") as f:
    reader = csv.reader(f)
    # Skip the timecode list line (line 1)
    next(reader)
    # Read header
    header = next(reader)
    for row in reader:
        if not row or not row[0].strip():
            continue
        scene = {
            "scene_number": int(row[0]),
            "start_frame": int(row[1]),
            "start_timecode": row[2],
            "start_time_seconds": float(row[3]),
            "end_frame": int(row[4]),
            "end_timecode": row[5],
            "end_time_seconds": float(row[6]),
            "length_frames": int(row[7]),
            "length_timecode": row[8],
            "length_seconds": float(row[9]),
        }
        scenes.append(scene)

# Calculate statistics
durations = [s["length_seconds"] for s in scenes]
total_duration = scenes[-1]["end_time_seconds"] if scenes else 0

stats = {
    "total_scenes": len(scenes),
    "total_duration_seconds": total_duration,
    "total_duration_minutes": total_duration / 60,
    "scenes_per_minute": len(scenes) / (total_duration / 60) if total_duration > 0 else 0,
    "duration_stats": {
        "mean": statistics.mean(durations),
        "median": statistics.median(durations),
        "min": min(durations),
        "max": max(durations),
        "stdev": statistics.stdev(durations) if len(durations) > 1 else 0,
        "mode": None,  # Will be set below
    },
    "duration_distribution": {},
    "duration_percentiles": {},
}

# Duration distribution in buckets
buckets = {
    "< 0.5s": 0,
    "0.5-1s": 0,
    "1-2s": 0,
    "2-3s": 0,
    "3-5s": 0,
    "5-10s": 0,
    "10-20s": 0,
    "20-30s": 0,
    "30-60s": 0,
    "> 60s": 0,
}

for d in durations:
    if d < 0.5:
        buckets["< 0.5s"] += 1
    elif d < 1:
        buckets["0.5-1s"] += 1
    elif d < 2:
        buckets["1-2s"] += 1
    elif d < 3:
        buckets["2-3s"] += 1
    elif d < 5:
        buckets["3-5s"] += 1
    elif d < 10:
        buckets["5-10s"] += 1
    elif d < 20:
        buckets["10-20s"] += 1
    elif d < 30:
        buckets["20-30s"] += 1
    elif d < 60:
        buckets["30-60s"] += 1
    else:
        buckets["> 60s"] += 1

stats["duration_distribution"] = buckets

# Percentiles
sorted_durations = sorted(durations)
n = len(sorted_durations)
for p in [10, 25, 50, 75, 90, 95, 99]:
    idx = int(n * p / 100)
    stats["duration_percentiles"][f"p{p}"] = sorted_durations[min(idx, n - 1)]

# Find the 10 shortest and 10 longest scenes
shortest = sorted(scenes, key=lambda s: s["length_seconds"])[:10]
longest = sorted(scenes, key=lambda s: s["length_seconds"], reverse=True)[:10]

# Analyze pacing over time: divide video into 5-minute segments
segment_duration = 300  # 5 minutes
segments = []
current_start = 0
while current_start < total_duration:
    segment_end = min(current_start + segment_duration, total_duration)
    segment_scenes = [
        s for s in scenes
        if s["start_time_seconds"] >= current_start and s["start_time_seconds"] < segment_end
    ]
    segment_durations = [s["length_seconds"] for s in segment_scenes]
    if segment_durations:
        segments.append({
            "start_minutes": current_start / 60,
            "end_minutes": segment_end / 60,
            "scene_count": len(segment_scenes),
            "avg_duration": statistics.mean(segment_durations),
            "median_duration": statistics.median(segment_durations),
            "cuts_per_minute": len(segment_scenes) / ((segment_end - current_start) / 60),
        })
    current_start = segment_end

output = {
    "metadata": {
        "source": csv_path,
        "detection_threshold": 27,
        "tool": "PySceneDetect 0.6.7.1",
        "method": "detect-content",
    },
    "statistics": stats,
    "pacing_over_time": segments,
    "shortest_scenes": shortest,
    "longest_scenes": longest,
    "scenes": scenes,
}

with open(output_path, "w") as f:
    json.dump(output, f, indent=2)

print(f"Processed {len(scenes)} scenes")
print(f"Total duration: {total_duration:.1f}s ({total_duration/60:.1f} min)")
print(f"Scenes per minute: {stats['scenes_per_minute']:.1f}")
print(f"Mean duration: {stats['duration_stats']['mean']:.3f}s")
print(f"Median duration: {stats['duration_stats']['median']:.3f}s")
print(f"Min: {stats['duration_stats']['min']:.3f}s, Max: {stats['duration_stats']['max']:.3f}s")
print(f"Stdev: {stats['duration_stats']['stdev']:.3f}s")
print(f"\nDuration distribution:")
for bucket, count in buckets.items():
    pct = count / len(durations) * 100
    bar = "#" * int(pct / 2)
    print(f"  {bucket:>8s}: {count:4d} ({pct:5.1f}%) {bar}")
print(f"\nPacing over time (5-min segments):")
for seg in segments:
    print(f"  {seg['start_minutes']:5.1f}-{seg['end_minutes']:5.1f} min: {seg['scene_count']:4d} scenes, "
          f"avg {seg['avg_duration']:.2f}s, {seg['cuts_per_minute']:.1f} cuts/min")
