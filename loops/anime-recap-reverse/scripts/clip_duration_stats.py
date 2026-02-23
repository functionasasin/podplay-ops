#!/usr/bin/env python3
"""Deep statistical analysis of clip durations from scenes.json."""

import json
import math
import sys
from collections import Counter

def load_scenes(path):
    with open(path) as f:
        data = json.load(f)
    return data

def percentile(sorted_data, p):
    """Calculate percentile using linear interpolation."""
    n = len(sorted_data)
    k = (n - 1) * p / 100
    f = math.floor(k)
    c = math.ceil(k)
    if f == c:
        return sorted_data[int(k)]
    return sorted_data[f] * (c - k) + sorted_data[c] * (k - f)

def iqr_outliers(sorted_data):
    q1 = percentile(sorted_data, 25)
    q3 = percentile(sorted_data, 75)
    iqr = q3 - q1
    lower = q1 - 1.5 * iqr
    upper = q3 + 1.5 * iqr
    outliers = [x for x in sorted_data if x < lower or x > upper]
    return lower, upper, outliers

def skewness(data, mean, stdev):
    n = len(data)
    return (n / ((n-1)*(n-2))) * sum(((x - mean) / stdev)**3 for x in data)

def kurtosis(data, mean, stdev):
    n = len(data)
    k4 = sum(((x - mean) / stdev)**4 for x in data) / n
    return k4 - 3  # excess kurtosis

def main():
    data = load_scenes("raw/scenes.json")
    scenes = data["scenes"]

    durations = [s["length_seconds"] for s in scenes]
    durations_sorted = sorted(durations)
    n = len(durations)

    mean = sum(durations) / n
    variance = sum((x - mean)**2 for x in durations) / (n - 1)
    stdev = math.sqrt(variance)
    median = percentile(durations_sorted, 50)

    print("=" * 70)
    print("CLIP DURATION STATISTICAL ANALYSIS")
    print("=" * 70)

    # 1. Core descriptive statistics
    print("\n## 1. DESCRIPTIVE STATISTICS")
    print(f"  N (total clips):   {n}")
    print(f"  Mean:              {mean:.4f}s")
    print(f"  Median:            {median:.4f}s")
    print(f"  Mode range:        1.8-2.0s (see histogram)")
    print(f"  Min:               {min(durations):.3f}s")
    print(f"  Max:               {max(durations):.3f}s")
    print(f"  Range:             {max(durations) - min(durations):.3f}s")
    print(f"  Std Dev:           {stdev:.4f}s")
    print(f"  Variance:          {variance:.4f}")
    print(f"  CV (coeff var):    {(stdev/mean)*100:.1f}%")
    print(f"  Skewness:          {skewness(durations, mean, stdev):.4f}")
    print(f"  Excess Kurtosis:   {kurtosis(durations, mean, stdev):.4f}")
    print(f"  Mean/Median ratio: {mean/median:.4f} (>1 = right-skewed)")

    # 2. Percentiles (fine-grained)
    print("\n## 2. PERCENTILE TABLE")
    for p in [1, 2, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 98, 99, 99.5]:
        val = percentile(durations_sorted, p)
        print(f"  P{p:<5} = {val:.3f}s")

    # 3. Fine-grained histogram (0.2s bins)
    print("\n## 3. FINE-GRAINED HISTOGRAM (0.2s bins)")
    bins_02 = {}
    for d in durations:
        bin_start = round(math.floor(d / 0.2) * 0.2, 1)
        key = f"{bin_start:.1f}-{bin_start + 0.2:.1f}s"
        bins_02[bin_start] = bins_02.get(bin_start, 0) + 1

    for bin_start in sorted(bins_02.keys()):
        count = bins_02[bin_start]
        pct = count / n * 100
        bar = "#" * int(pct * 2)
        label = f"{bin_start:.1f}-{bin_start + 0.2:.1f}s"
        print(f"  {label:12s} | {count:4d} ({pct:5.1f}%) | {bar}")

    # 4. Standard histogram (0.5s bins)
    print("\n## 4. STANDARD HISTOGRAM (0.5s bins)")
    bins_05 = {}
    for d in durations:
        bin_start = round(math.floor(d / 0.5) * 0.5, 1)
        key = f"{bin_start:.1f}-{bin_start + 0.5:.1f}s"
        bins_05[bin_start] = bins_05.get(bin_start, 0) + 1

    cumulative = 0
    for bin_start in sorted(bins_05.keys()):
        count = bins_05[bin_start]
        cumulative += count
        pct = count / n * 100
        cum_pct = cumulative / n * 100
        bar = "#" * int(pct)
        label = f"{bin_start:.1f}-{bin_start + 0.5:.1f}s"
        print(f"  {label:12s} | {count:4d} ({pct:5.1f}%) cum={cum_pct:5.1f}% | {bar}")

    # 5. IQR and outlier analysis
    print("\n## 5. IQR AND OUTLIER ANALYSIS")
    lower, upper, outliers = iqr_outliers(durations_sorted)
    q1 = percentile(durations_sorted, 25)
    q3 = percentile(durations_sorted, 75)
    iqr = q3 - q1
    print(f"  Q1 (25th):      {q1:.3f}s")
    print(f"  Q3 (75th):      {q3:.3f}s")
    print(f"  IQR:            {iqr:.3f}s")
    print(f"  Lower fence:    {lower:.3f}s (Q1 - 1.5*IQR)")
    print(f"  Upper fence:    {upper:.3f}s (Q3 + 1.5*IQR)")
    print(f"  Outliers count: {len(outliers)} ({len(outliers)/n*100:.1f}%)")
    print(f"  Outlier range:  {min(outliers):.3f}s to {max(outliers):.3f}s" if outliers else "  No outliers")

    # List outlier scenes
    if outliers:
        outlier_set = set(outliers)
        print(f"\n  Outlier scenes (>{upper:.2f}s):")
        outlier_scenes = [(s["scene_number"], s["length_seconds"], s["start_timecode"])
                         for s in scenes if s["length_seconds"] > upper]
        outlier_scenes.sort(key=lambda x: -x[1])
        for sn, dur, tc in outlier_scenes[:20]:
            print(f"    Scene #{sn:4d} at {tc}: {dur:.3f}s")

    # 6. Log-normal fit test
    print("\n## 6. LOG-NORMAL DISTRIBUTION FIT")
    log_durations = [math.log(d) for d in durations]
    log_mean = sum(log_durations) / n
    log_var = sum((x - log_mean)**2 for x in log_durations) / (n - 1)
    log_stdev = math.sqrt(log_var)
    log_median = percentile(sorted(log_durations), 50)

    print(f"  ln(duration) mean:    {log_mean:.4f}")
    print(f"  ln(duration) stdev:   {log_stdev:.4f}")
    print(f"  ln(duration) median:  {log_median:.4f}")
    print(f"  ln(duration) skew:    {skewness(log_durations, log_mean, log_stdev):.4f}")
    print(f"  ln(duration) kurt:    {kurtosis(log_durations, log_mean, log_stdev):.4f}")
    print(f"  Expected median (e^mu):   {math.exp(log_mean):.4f}s")
    print(f"  Expected mean (e^(mu+s2/2)): {math.exp(log_mean + log_var/2):.4f}s (actual: {mean:.4f}s)")

    # Compare log-normal predicted percentiles vs actual
    print(f"\n  Log-Normal Fit: Predicted vs Actual Percentiles")
    print(f"  {'Percentile':>12s} | {'Actual':>8s} | {'Predicted':>10s} | {'Error':>8s}")
    import statistics
    # For a lognormal, percentile p = exp(mu + sigma * z_p)
    # z values for standard normal
    z_values = {
        5: -1.645, 10: -1.282, 25: -0.674, 50: 0,
        75: 0.674, 90: 1.282, 95: 1.645, 99: 2.326
    }
    for p, z in sorted(z_values.items()):
        actual = percentile(durations_sorted, p)
        predicted = math.exp(log_mean + log_stdev * z)
        error_pct = abs(predicted - actual) / actual * 100
        print(f"  P{p:>3d}         | {actual:7.3f}s | {predicted:9.3f}s | {error_pct:6.1f}%")

    # 7. Temporal analysis: duration trends over time
    print("\n## 7. TEMPORAL DURATION TRENDS")
    # Divide video into quarters
    total_dur = data["statistics"]["total_duration_seconds"]
    quarter = total_dur / 4

    quarters = {0: [], 1: [], 2: [], 3: []}
    for s in scenes:
        q = min(int(s["start_time_seconds"] / quarter), 3)
        quarters[q].append(s["length_seconds"])

    labels = ["Q1 (0-18.8m)", "Q2 (18.8-37.6m)", "Q3 (37.6-56.4m)", "Q4 (56.4-75.3m)"]
    for q in range(4):
        qd = sorted(quarters[q])
        qn = len(qd)
        qmean = sum(qd) / qn
        qmed = percentile(qd, 50)
        qstd = math.sqrt(sum((x - qmean)**2 for x in qd) / (qn - 1))
        sub1 = sum(1 for x in qd if x < 1.0)
        over5 = sum(1 for x in qd if x > 5.0)
        print(f"  {labels[q]:20s}: n={qn:4d}, mean={qmean:.3f}s, median={qmed:.3f}s, "
              f"stdev={qstd:.3f}s, <1s={sub1} ({sub1/qn*100:.1f}%), >5s={over5}")

    # 8. Consecutive clip pattern analysis
    print("\n## 8. CONSECUTIVE CLIP PATTERN ANALYSIS")
    # Look for runs of similar-duration clips
    run_lengths = []
    current_run = 1
    threshold = 0.5  # clips within 0.5s of each other

    for i in range(1, n):
        if abs(durations[i] - durations[i-1]) <= threshold:
            current_run += 1
        else:
            run_lengths.append(current_run)
            current_run = 1
    run_lengths.append(current_run)

    run_counter = Counter(run_lengths)
    print(f"  Runs of similar-duration clips (within ±{threshold}s):")
    for length in sorted(run_counter.keys()):
        count = run_counter[length]
        print(f"    Run length {length:2d}: {count:4d} occurrences")

    avg_run = sum(run_lengths) / len(run_lengths)
    max_run = max(run_lengths)
    print(f"  Average run length: {avg_run:.2f}")
    print(f"  Max run length:     {max_run}")

    # 9. Adjacent clip duration difference
    print("\n## 9. ADJACENT CLIP DURATION DIFFERENCES")
    diffs = [abs(durations[i+1] - durations[i]) for i in range(n-1)]
    diffs_sorted = sorted(diffs)
    diff_mean = sum(diffs) / len(diffs)
    diff_median = percentile(diffs_sorted, 50)
    diff_stdev = math.sqrt(sum((x - diff_mean)**2 for x in diffs) / (len(diffs) - 1))

    print(f"  Mean absolute difference:   {diff_mean:.4f}s")
    print(f"  Median absolute difference: {diff_median:.4f}s")
    print(f"  Stdev of differences:       {diff_stdev:.4f}s")
    print(f"  P90 difference:             {percentile(diffs_sorted, 90):.4f}s")
    print(f"  P99 difference:             {percentile(diffs_sorted, 99):.4f}s")
    print(f"  Max difference:             {max(diffs):.4f}s")

    # % of cuts where next clip is within various thresholds
    for thresh in [0.25, 0.5, 1.0, 1.5, 2.0]:
        within = sum(1 for d in diffs if d <= thresh)
        print(f"  Within ±{thresh:.2f}s: {within}/{len(diffs)} ({within/len(diffs)*100:.1f}%)")

    # 10. Duration autocorrelation (lag-1)
    print("\n## 10. DURATION AUTOCORRELATION")
    for lag in [1, 2, 3, 5, 10]:
        pairs = [(durations[i], durations[i+lag]) for i in range(n - lag)]
        mean_x = sum(p[0] for p in pairs) / len(pairs)
        mean_y = sum(p[1] for p in pairs) / len(pairs)
        cov = sum((p[0] - mean_x) * (p[1] - mean_y) for p in pairs) / len(pairs)
        var_x = sum((p[0] - mean_x)**2 for p in pairs) / len(pairs)
        var_y = sum((p[1] - mean_y)**2 for p in pairs) / len(pairs)
        if var_x > 0 and var_y > 0:
            corr = cov / math.sqrt(var_x * var_y)
        else:
            corr = 0
        print(f"  Lag-{lag:2d} autocorrelation: {corr:.4f}")

    # 11. Frame-aligned duration distribution
    print("\n## 11. FRAME-LEVEL ANALYSIS (30fps)")
    frame_counts = Counter(s["length_frames"] for s in scenes)
    print(f"  Unique frame counts: {len(frame_counts)}")
    print(f"  Most common frame counts:")
    for frames, count in sorted(frame_counts.items(), key=lambda x: -x[1])[:20]:
        dur = frames / 30.0
        pct = count / n * 100
        bar = "#" * int(pct)
        print(f"    {frames:4d} frames ({dur:5.2f}s): {count:4d} clips ({pct:4.1f}%) {bar}")

    # 12. Clips per minute over time (1-minute resolution)
    print("\n## 12. CLIPS PER MINUTE (1-min resolution)")
    max_min = int(total_dur / 60) + 1
    cpm_1min = [0] * max_min
    for s in scenes:
        m = int(s["start_time_seconds"] / 60)
        if m < max_min:
            cpm_1min[m] += 1

    cpm_mean = sum(cpm_1min[:75]) / 75
    cpm_stdev = math.sqrt(sum((x - cpm_mean)**2 for x in cpm_1min[:75]) / 74)
    print(f"  Mean CPM:  {cpm_mean:.1f}")
    print(f"  Stdev CPM: {cpm_stdev:.1f}")
    print(f"  CV CPM:    {cpm_stdev/cpm_mean*100:.1f}%")
    print(f"  Min CPM:   {min(cpm_1min[:75])} (minute {cpm_1min[:75].index(min(cpm_1min[:75]))})")
    print(f"  Max CPM:   {max(cpm_1min[:75])} (minute {cpm_1min[:75].index(max(cpm_1min[:75]))})")

    # Mark notable spikes/dips
    print(f"\n  Notable CPM values (>1.5 stdev from mean):")
    for m in range(75):
        if abs(cpm_1min[m] - cpm_mean) > 1.5 * cpm_stdev:
            direction = "HIGH" if cpm_1min[m] > cpm_mean else "LOW"
            print(f"    Minute {m:2d}: {cpm_1min[m]:2d} cpm ({direction})")

    # 13. Summary for spec
    print("\n## 13. SPEC-READY PARAMETERS")
    print(f"  distribution_type: log-normal")
    print(f"  mu (ln mean):      {log_mean:.4f}")
    print(f"  sigma (ln stdev):  {log_stdev:.4f}")
    print(f"  floor_seconds:     {min(durations):.3f}")
    print(f"  ceiling_seconds:   {max(durations):.3f}")
    print(f"  ceiling_normal:    {upper:.3f} (IQR fence)")
    print(f"  target_mean:       {mean:.3f}")
    print(f"  target_median:     {median:.3f}")
    print(f"  target_stdev:      {stdev:.3f}")
    print(f"  target_cpm_mean:   {cpm_mean:.1f}")
    print(f"  target_cpm_stdev:  {cpm_stdev:.1f}")

    print("\n  Duration generation pseudocode:")
    print(f"    d = max({min(durations):.1f}, min({upper:.1f}, exp(N({log_mean:.4f}, {log_stdev:.4f}))))")
    print(f"    # where N(mu, sigma) is a normal random variate")
    print(f"    # Yields: mean≈{mean:.2f}s, median≈{median:.2f}s, stdev≈{stdev:.2f}s")

if __name__ == "__main__":
    main()
