#!/usr/bin/env python3
"""Process audio-rms.txt and loudnorm output into audio-levels.json"""

import json
import re
import sys
import statistics

def parse_rms_file(path):
    """Parse ffmpeg astats RMS output into time-series data."""
    frames = []
    current_time = None
    current_rms = None

    with open(path) as f:
        for line in f:
            line = line.strip()
            if line.startswith("frame:"):
                # Extract pts_time
                m = re.search(r'pts_time:([\d.]+)', line)
                if m:
                    current_time = float(m.group(1))
            elif line.startswith("lavfi.astats.Overall.RMS_level="):
                val = line.split("=")[1]
                try:
                    current_rms = float(val)
                except ValueError:
                    current_rms = None
                if current_time is not None and current_rms is not None:
                    frames.append({"time": current_time, "rms_db": current_rms})
                    current_time = None
                    current_rms = None

    return frames

def compute_stats(frames):
    """Compute overall statistics from frame-level RMS."""
    rms_values = [f["rms_db"] for f in frames if f["rms_db"] > -100]  # filter silence

    if not rms_values:
        return {}

    return {
        "total_frames": len(frames),
        "non_silent_frames": len(rms_values),
        "duration_seconds": frames[-1]["time"] if frames else 0,
        "rms_mean_db": round(statistics.mean(rms_values), 2),
        "rms_median_db": round(statistics.median(rms_values), 2),
        "rms_stdev_db": round(statistics.stdev(rms_values), 2) if len(rms_values) > 1 else 0,
        "rms_min_db": round(min(rms_values), 2),
        "rms_max_db": round(max(rms_values), 2),
        "rms_p10_db": round(sorted(rms_values)[len(rms_values)//10], 2),
        "rms_p90_db": round(sorted(rms_values)[9*len(rms_values)//10], 2),
    }

def compute_time_segments(frames, segment_duration=60):
    """Compute per-minute average RMS to show loudness over time."""
    segments = []
    current_segment_start = 0
    current_segment_values = []

    for f in frames:
        if f["time"] >= current_segment_start + segment_duration:
            if current_segment_values:
                non_silent = [v for v in current_segment_values if v > -100]
                avg = statistics.mean(non_silent) if non_silent else -100
                segments.append({
                    "start_time": current_segment_start,
                    "end_time": current_segment_start + segment_duration,
                    "avg_rms_db": round(avg, 2),
                    "sample_count": len(non_silent)
                })
            current_segment_start += segment_duration
            current_segment_values = []
        current_segment_values.append(f["rms_db"])

    # Last partial segment
    if current_segment_values:
        non_silent = [v for v in current_segment_values if v > -100]
        avg = statistics.mean(non_silent) if non_silent else -100
        segments.append({
            "start_time": current_segment_start,
            "end_time": frames[-1]["time"],
            "avg_rms_db": round(avg, 2),
            "sample_count": len(non_silent)
        })

    return segments

def find_silence_regions(frames, threshold_db=-60, min_duration=0.5):
    """Find regions of silence (below threshold for min_duration)."""
    silences = []
    silence_start = None

    for f in frames:
        if f["rms_db"] < threshold_db:
            if silence_start is None:
                silence_start = f["time"]
        else:
            if silence_start is not None:
                duration = f["time"] - silence_start
                if duration >= min_duration:
                    silences.append({
                        "start": round(silence_start, 2),
                        "end": round(f["time"], 2),
                        "duration": round(duration, 2)
                    })
                silence_start = None

    return silences

def find_loud_peaks(frames, threshold_db=-10, window=100):
    """Find notably loud moments."""
    peaks = []
    i = 0
    while i < len(frames):
        if frames[i]["rms_db"] > threshold_db:
            # Find the peak in this region
            peak_idx = i
            while i < len(frames) and frames[i]["rms_db"] > threshold_db:
                if frames[i]["rms_db"] > frames[peak_idx]["rms_db"]:
                    peak_idx = i
                i += 1
            peaks.append({
                "time": round(frames[peak_idx]["time"], 2),
                "rms_db": round(frames[peak_idx]["rms_db"], 2)
            })
        else:
            i += 1
    return peaks

def compute_dynamic_range_segments(frames, segment_duration=300):
    """Compute dynamic range per 5-minute segment."""
    segments = []
    current_start = 0
    current_values = []

    for f in frames:
        if f["time"] >= current_start + segment_duration:
            if current_values:
                non_silent = [v for v in current_values if v > -100]
                if non_silent:
                    segments.append({
                        "start_time": current_start,
                        "end_time": current_start + segment_duration,
                        "dynamic_range_db": round(max(non_silent) - min(non_silent), 2),
                        "max_db": round(max(non_silent), 2),
                        "min_db": round(min(non_silent), 2)
                    })
            current_start += segment_duration
            current_values = []
        current_values.append(f["rms_db"])

    return segments

def main():
    print("Parsing RMS data...")
    frames = parse_rms_file("raw/audio-rms.txt")
    print(f"  Parsed {len(frames)} frames")

    print("Computing statistics...")
    stats = compute_stats(frames)

    print("Computing per-minute segments...")
    minute_segments = compute_time_segments(frames, 60)

    print("Finding silence regions...")
    silences = find_silence_regions(frames)

    print("Finding loud peaks...")
    peaks = find_loud_peaks(frames)

    print("Computing dynamic range segments...")
    dynamic_range = compute_dynamic_range_segments(frames, 300)

    # Load loudnorm data if available
    loudnorm = {}
    try:
        with open("raw/loudnorm.json") as f:
            loudnorm = json.load(f)
    except FileNotFoundError:
        pass

    result = {
        "overall_stats": stats,
        "loudnorm": loudnorm,
        "per_minute_rms": minute_segments,
        "silence_regions": silences[:50],  # cap to keep JSON manageable
        "silence_count": len(silences),
        "loud_peaks": peaks[:100],
        "loud_peak_count": len(peaks),
        "dynamic_range_per_5min": dynamic_range,
    }

    with open("raw/audio-levels.json", "w") as f:
        json.dump(result, f, indent=2)

    print(f"Written to raw/audio-levels.json")
    print(f"  Duration: {stats.get('duration_seconds', 0):.1f}s")
    print(f"  Mean RMS: {stats.get('rms_mean_db', 'N/A')} dB")
    print(f"  Silence regions: {len(silences)}")
    print(f"  Loud peaks: {len(peaks)}")

if __name__ == "__main__":
    main()
