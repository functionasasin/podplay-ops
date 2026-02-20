#!/usr/bin/env python3
"""Parse SRT transcript into structured JSON for the reverse ralph loop."""

import json
import re
import sys

def parse_srt(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    blocks = re.split(r'\n\n+', content.strip())
    segments = []
    full_text = []

    for block in blocks:
        lines = block.strip().split('\n')
        if len(lines) < 2:
            continue

        # Parse timestamp line
        ts_match = re.match(
            r'(\d{2}:\d{2}:\d{2}[,\.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,\.]\d{3})',
            lines[1]
        )
        if not ts_match:
            continue

        start_ts = ts_match.group(1).replace(',', '.')
        end_ts = ts_match.group(2).replace(',', '.')

        text = ' '.join(lines[2:]).strip()
        if not text:
            continue

        def ts_to_seconds(ts):
            parts = ts.split(':')
            h, m = int(parts[0]), int(parts[1])
            s = float(parts[2])
            return h * 3600 + m * 60 + s

        segments.append({
            'start': ts_to_seconds(start_ts),
            'end': ts_to_seconds(end_ts),
            'text': text,
            'is_anime_dialogue': text.startswith('>>')
        })
        full_text.append(text)

    # Calculate stats
    all_words = ' '.join(full_text).split()
    narration_segments = [s for s in segments if not s['is_anime_dialogue']]
    dialogue_segments = [s for s in segments if s['is_anime_dialogue']]

    total_duration = segments[-1]['end'] if segments else 0
    narration_word_count = sum(len(s['text'].split()) for s in narration_segments)
    narration_duration = sum(s['end'] - s['start'] for s in narration_segments)

    result = {
        'source': 'jaranime-parasyte.en-orig.srt',
        'total_segments': len(segments),
        'narration_segments': len(narration_segments),
        'anime_dialogue_segments': len(dialogue_segments),
        'total_word_count': len(all_words),
        'narration_word_count': narration_word_count,
        'total_duration_seconds': total_duration,
        'narration_duration_seconds': narration_duration,
        'avg_wpm': narration_word_count / (narration_duration / 60) if narration_duration > 0 else 0,
        'segments': segments
    }

    return result

if __name__ == '__main__':
    srt_path = sys.argv[1] if len(sys.argv) > 1 else 'input/reference/jaranime-parasyte.en-orig.srt'
    output_path = sys.argv[2] if len(sys.argv) > 2 else 'raw/transcription.json'

    data = parse_srt(srt_path)

    with open(output_path, 'w') as f:
        json.dump(data, f, indent=2)

    print(f"Parsed {data['total_segments']} segments ({data['narration_segments']} narration, {data['anime_dialogue_segments']} dialogue)")
    print(f"Total words: {data['total_word_count']}, Narration words: {data['narration_word_count']}")
    print(f"Total duration: {data['total_duration_seconds']:.0f}s ({data['total_duration_seconds']/60:.1f} min)")
    print(f"Avg WPM: {data['avg_wpm']:.1f}")
