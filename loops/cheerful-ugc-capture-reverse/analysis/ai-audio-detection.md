# AI Audio Detection — Speech-to-Text Brand Mention Detection in Instagram Video

**Aspect**: `ai-audio-detection`
**Wave**: 1 — External Landscape
**Date**: 2026-02-28

---

## Overview

AI audio detection addresses the "spoken mention" problem: a creator verbally references a brand in an Instagram Reel or Story video without @mentioning it, using a hashtag, or showing the logo on screen. Audio detection transcribes the video's spoken audio, then applies NLP to identify brand name mentions in the transcript.

This technique is explicitly confirmed in Archive Radar's product description:
> "Archive **listens to what people say in videos**. So if a creator 'mentions' your brand out loud without an official @mention, you're still covered."

Audio detection is the **fourth complementary layer** alongside logo detection, product recognition, and OCR. Together they form the full "untagged UGC" radar stack. This analysis covers only the audio layer; visual methods are in `ai-visual-detection`.

**Critical constraint**: Like visual detection, audio detection only applies to content you already have URLs for. The candidate content pool problem is the upstream prerequisite — see `ai-candidate-discovery`. This analysis assumes candidate video content has been retrieved.

---

## How It Works

The pipeline has four stages:

```
Video file/URL (Instagram Reel, Story, Feed video)
    ↓ [1] Audio Extraction
    Audio stream → 16kHz mono WAV (ffmpeg)
    ↓ [2] Speech-to-Text Transcription
    Raw transcript text + timestamps (Whisper, Deepgram, etc.)
    ↓ [3] Brand Mention Extraction
    NLP: keyword match + fuzzy match + NER → brand name candidates
    ↓ [4] Confidence Scoring + Deduplication
    Score (0–1), deduplicate vs. officially-detected content
    ↓
ugc_content table (brand_id, capture_source='ai_audio', confidence_score, transcript_excerpt, timestamp_in_video, ...)
```

### Stage 1: Audio Extraction

**Tool**: `ffmpeg` (open-source, MIT/LGPL)

Instagram Reels are MP4 files. Audio must be extracted and normalized for optimal STT accuracy:

```bash
# Extract audio from Instagram Reel, normalize to 16kHz mono WAV
ffmpeg -i reel.mp4 -vn -acodec pcm_s16le -ar 16000 -ac 1 audio.wav
```

The 16kHz sampling rate and mono channel are critical: Whisper's training data was resampled to this format, and matching it improves transcription accuracy measurably.

**Practical considerations**:
- Average Instagram Reel: 15–90 seconds; typical 30–60 sec
- Audio file size: 16kHz mono WAV ≈ 1 MB/minute — manageable for batch storage
- ffmpeg batch processing: trivial to loop over multiple video files
- Does not require GPU; runs on any CPU worker

**Background music challenge**: The most significant real-world problem for Instagram UGC audio is background music. Many Reels layer a voiceover over trending audio or music. Options:

| Approach | Quality | Cost | Notes |
|----------|---------|------|-------|
| Transcribe raw mixed audio | Low for music-heavy | Free | STT models struggle to isolate speech from music |
| Demucs audio source separation | High | Medium compute | Meta's open-source model separates vocals from instruments; runs on CPU but slow |
| Spleeter (Deezer) | Good | Low compute | 2-stem (vocals/accompaniment) separation; fast |
| Pre-filter: skip music-heavy audio | Variable | None | Detect music-dominant tracks (via RMS or spectral analysis), skip STT |

For brand mention detection, pure STT on music-heavy Reels produces high hallucination rates. A pre-separation step (Spleeter or Demucs) before Whisper significantly improves transcript quality for mixed audio.

---

## Stage 2: Speech-to-Text Options

### Option A: OpenAI Whisper (Self-Hosted)

**Model**: Whisper Large V3 (1.55B params) or Distil-Whisper Large V3 (756M params, 6× faster)

**Cost**: Infrastructure only — no per-call fees
- GPU: A10G on Fly.io ≈ $1/hr; Distil-Whisper processes ~10× faster than real-time on GPU
- At 10× real-time: 1,000 minutes of audio → 100 min GPU time → ~$1.67 compute cost
- Effective cost: **~$0.0017/minute at scale** (much lower than any API)

**Accuracy** (Word Error Rate on clean audio):
- Whisper Large V3: ~19.96% WER on benchmarks (i.e., ~80% word accuracy)
- Distil-Whisper Large V3: within 1% WER of full model; 6× faster
- On noisy/music audio: WER jumps to **~29.80%** — significant degradation

**Hallucination risk**: Whisper is known to hallucinate text when audio is silent, noisy, or music-dominated. Distil-Whisper reduces this somewhat; AssemblyAI reports 30% fewer hallucinations than Whisper Large V3 in their own benchmarks.

**Languages**: 99+ languages, including multilingual switching within one video

**Streaming**: Not native — processes audio files in batch

**Self-hosting requirements**:
- 10 GB VRAM (Large V3); 5 GB VRAM (Distil-Whisper Large V3)
- Fly.io GPU machine (A10G, L40S) or Replicate serverless GPU
- Engineering time to build queue, retry logic, result storage (~40–80 hours initial setup)

### Option B: OpenAI Whisper API

**Pricing**:
- Whisper API: **$0.006/minute**
- GPT-4o Transcribe: **$0.006/minute** (higher accuracy than Whisper API)
- GPT-4o Mini Transcribe: **$0.003/minute** (lower cost, slightly lower accuracy)

**Constraints**:
- 25 MB file size limit (~30 minutes of audio per file — not a practical issue for Reels)
- No real-time streaming
- No speaker diarization
- No word-level timestamps (sentence-level only via segments)

**Cost per video** (assuming 60-second Reel):
- Whisper API: $0.006
- GPT-4o Mini Transcribe: $0.003

**At scale**:

| Monthly Volume | GPT-4o Mini Cost | Whisper API Cost |
|---------------|-----------------|-----------------|
| 1,000 videos (avg 60s) | $3.00 | $6.00 |
| 10,000 videos | $30 | $60 |
| 100,000 videos | $300 | $600 |
| 1,000,000 videos | $3,000 | $6,000 |

**Advantages over self-hosted**: Zero infrastructure, instant setup, handles model updates automatically.

### Option C: Google Cloud Speech-to-Text

**Pricing**:
- Standard model: **$0.024/minute**
- Enhanced model (Chirp): **$0.036/minute**

**Assessment for UGC**: 4–6× more expensive than Whisper API with no meaningful accuracy advantage for UGC content. The enhanced model's strength is medical terminology and call center audio — not relevant for Instagram. **Not recommended** unless already in Google Cloud ecosystem.

### Option D: Amazon Transcribe

**Pricing**:
- Tier 1 (0–250K min/mo): **$0.024/minute**
- Tier 5 (5M+ min/mo): **$0.0078/minute**
- **60-second billing minimum** per request — inefficient for short Reels

**Custom vocabulary**: Supports custom vocabulary lists — relevant for brand names. Can pre-load "Cheerful", brand aliases, and common misspellings.

**Assessment**: Competitive at very high volume (Tier 5: ~$0.0078/min ≈ Whisper API pricing). The 60-second minimum billing makes it inefficient for Stories (≤15 seconds). Custom vocabulary support for brand names is a genuine advantage for accuracy.

### Option E: AssemblyAI Universal Model

**Pricing**: $0.0025/minute base; effective ~$0.0042/minute with typical add-ons (session overhead)

**Differentiating features**:
- **LeMUR framework**: Apply LLM analysis directly to transcribed audio — ask "Does this audio mention the brand [X]?" in natural language, without building a separate NLP layer
- 30% fewer hallucinations than Whisper Large V3 (AssemblyAI-published benchmark)
- Word-level timestamps included

**Cost per video** (60-second Reel, base rate):
- $0.0025 per video — cheapest API option

**Assessment**: LeMUR is genuinely interesting for brand mention extraction — instead of building keyword matching + fuzzy NER, send the transcript to Claude/GPT-4 via AssemblyAI's API and ask for brand mentions directly. Trades compute cost for simplicity. Hallucination reduction is valuable for UGC where audio quality is variable.

### Option F: Deepgram Nova-3

**Pricing**:
- Pay-As-You-Go: **$0.0077/minute**
- Growth plan: **$0.0065/minute**
- Billed per second (fair for short content)

**Differentiating features**:
- Real-time streaming (300ms latency) — not needed for batch UGC processing
- Per-second billing — advantageous for Story audio (≤15 seconds)
- Custom models trainable for domain-specific vocabulary

**Assessment**: Streaming capability is not useful for batch UGC processing. Per-second billing helps for short Stories but otherwise no compelling advantage over Whisper API or AssemblyAI for this use case.

### STT Provider Comparison

| Provider | Price/Min | Hallucinations | Languages | Key Advantage | Key Limitation |
|----------|-----------|---------------|-----------|---------------|---------------|
| Whisper (self-hosted) | ~$0.0017 | High on noisy audio | 99+ | Cheapest at scale | GPU infra required, hallucinations |
| Distil-Whisper (self-hosted) | ~$0.0017 | Slightly lower | 99+ | 6× faster than large | Same infra requirements |
| GPT-4o Mini Transcribe | $0.003 | Low | 57+ | Lowest API cost | No streaming, 25MB limit |
| Whisper API | $0.006 | Moderate | 99+ | Multilingual | No streaming, no word timestamps |
| AssemblyAI | ~$0.0042 | Lower (30% reduction) | ~20 | LeMUR LLM analysis | Session overhead billing |
| Deepgram Nova-3 | $0.0065 | Moderate | 36 | Per-second billing | More expensive than alternatives |
| Amazon Transcribe | $0.024 | Low | 75+ | Custom vocabulary; scales down to $0.0078/min | 60-sec minimum |
| Google STT | $0.024–0.036 | Low | 125+ | Medical/call center | 4–6× Whisper cost for equivalent quality |

---

## Stage 3: Brand Mention Extraction (NLP)

Once a transcript is produced, the extraction problem is: find all mentions of a brand (and its aliases, common misspellings) in the text.

### Approach A: Keyword / Regex Matching (Simplest)

```python
import re

brand_patterns = {
    "cheerful": [
        r"\bcheerful\b",
        r"\bcheerfl\b",     # misspelling
        r"\bcheerfl\b",
    ]
}

def detect_brand_mentions(transcript: str, brand_aliases: list[str]) -> list[dict]:
    transcript_lower = transcript.lower()
    mentions = []
    for alias in brand_aliases:
        pattern = re.compile(r'\b' + re.escape(alias.lower()) + r'\b')
        for match in pattern.finditer(transcript_lower):
            mentions.append({
                "brand_alias": alias,
                "position": match.start(),
                "excerpt": transcript[max(0, match.start()-50):match.end()+50]
            })
    return mentions
```

**Strengths**: Trivially simple, zero latency, deterministic, no model required
**Weaknesses**: Cannot handle:
- Phonetic misspellings not in the pre-built alias list
- Casual/slurred pronunciation captured differently by STT ("Cheerful" → "cheer full", "cheer fell")
- Brand names that are also common words (homonym problem)

**Accuracy**: High recall for exact matches (~90–95%); poor recall for casual pronunciation (~50–60%)

### Approach B: spaCy NER with Custom Entity Types

```python
import spacy
from spacy.pipeline import EntityRuler

nlp = spacy.load("en_core_web_sm")
ruler = nlp.add_pipe("entity_ruler", before="ner")

# Add brand-specific patterns as custom entities
patterns = [
    {"label": "BRAND", "pattern": "Cheerful"},
    {"label": "BRAND", "pattern": [{"LOWER": "cheer"}, {"LOWER": "ful"}]},
]
ruler.add_patterns(patterns)

doc = nlp(transcript)
brand_mentions = [(ent.text, ent.label_) for ent in doc.ents if ent.label_ == "BRAND"]
```

**Strengths**: Handles capitalization, tokenization variations; leverages dependency parsing context
**Weaknesses**: Still requires explicit pattern definitions; doesn't handle phonetic variations
**Accuracy**: Better than raw regex for transcript text; ~70–80% recall

### Approach C: Fuzzy String Matching

```python
from rapidfuzz import fuzz, process

def fuzzy_brand_detect(transcript: str, brand_names: list[str], threshold: int = 80) -> list[dict]:
    words = transcript.lower().split()
    window_size = 3  # check 3-word windows for multi-word brand names
    mentions = []

    for i in range(len(words)):
        for n in range(1, window_size + 1):
            chunk = " ".join(words[i:i+n])
            for brand in brand_names:
                score = fuzz.ratio(chunk, brand.lower())
                if score >= threshold:
                    mentions.append({"text": chunk, "brand": brand, "score": score, "position": i})
    return mentions
```

**Strengths**: Catches phonetic STT artifacts ("cheer fell" vs "cheerful"); handles OCR-style errors in transcript text
**Weaknesses**: Computationally heavier for large transcripts; false positives on short brand names or common syllables
**Accuracy**: Better recall for mispronounced/mistranscribed brand names; ~75–85% recall

### Approach D: LLM-Based Extraction (AssemblyAI LeMUR or Direct Claude API)

Send the transcript to Claude/GPT-4 with a structured prompt:

```python
prompt = f"""
You are analyzing a transcript of an Instagram video for brand mentions.

Brand name: {brand_name}
Brand aliases and common variations: {", ".join(brand_aliases)}
Also check for phonetic variations or misspellings.

Transcript:
{transcript}

Return a JSON array of any mentions of this brand, including:
- The exact text used to reference the brand
- Position in transcript (approximate)
- Confidence score (0–1)
- Whether it's likely an intentional brand mention vs. coincidental

Return [] if no brand is mentioned.
"""
```

**Strengths**:
- Handles ambiguous, homonym, and phonetic variation cases intelligently
- No pattern database to maintain
- Can handle multi-language transcripts
- Returns structured output with confidence reasoning

**Weaknesses**:
- Additional LLM API cost (~$0.001–0.003 per transcript, depending on length)
- Latency (500ms–2s per call)
- Overkill for simple exact-match cases

**Accuracy**: Highest (~85–92% recall, ~90%+ precision with good prompting)

**For Cheerful's stack**: Claude API is already in the tech stack. Adding a Claude call per transcript is natural and avoids building a custom NLP layer.

### Approach E: Hybrid (Recommended Architecture)

```
1. Fast keyword/regex pass (zero cost) → if match found, skip to scoring
2. If no exact match: fuzzy match at threshold 80+ → if match found, log with medium confidence
3. If still no match (or brand is a common-word homonym): Claude LLM pass → most accurate but adds cost
```

This tiered approach minimizes LLM calls (most content has no brand mention at all) while maximizing accuracy for the cases that matter.

---

## Real-World Accuracy Challenges for Instagram UGC

### 1. Background Music (Most Significant)

**Problem**: Instagram Reels frequently layer voiceover speech over trending background music. STT models trained on speech will try to transcribe both the speech and the music, producing hallucinated or mixed-up text.

**Observed**: On music-heavy Reels, Whisper WER jumps from ~20% to ~40-60%, with hallucinated words from song lyrics appearing in the transcript.

**Mitigation**:
- Spleeter (Deezer, Apache 2.0): 2-stem source separation (vocals vs. instruments) before STT. Adds ~1–3 seconds processing time per Reel on CPU.
- Demucs (Meta, MIT): Higher quality separation, slower (~5–10 sec/Reel on CPU, <1 sec on GPU)
- Practical trade-off: Run Spleeter as a pre-processing step for all videos longer than 10 seconds. Skip for short content.

### 2. Casual / Slurred Pronunciation

**Problem**: Creators speak casually. "Cheerful" might be transcribed as "cheer full", "cheerfl", or "cheer fl". Brand names with unusual spellings (e.g., "Wyze", "Lyft") will frequently be transcribed phonetically.

**Mitigation**:
- Build a phoneme-map alias list per brand during onboarding: "cheer full", "cheer ful", etc.
- Amazon Transcribe's custom vocabulary feature: pre-load brand names and pronunciation hints
- Fuzzy matching with Levenshtein distance covers most cases

### 3. Brand Name Homonyms

**Problem**: If the brand name is also a common English word (e.g., "Cheerful" the brand vs. describing a mood), NLP must disambiguate. Without context, simple keyword matching produces false positives.

**Mitigation**:
- LLM extraction (Approach D) handles this best — Claude can reason about context
- spaCy dependency parsing can check surrounding words for commercial context
- Review queue for ambiguous matches rather than auto-capturing

### 4. Language Diversity

**Problem**: Instagram creators post in all languages. A brand mention might occur mid-sentence in Spanish, Portuguese, or Korean.

**Mitigation**:
- Whisper is multilingual (99+ languages) — automatic language detection per video
- GPT-4o Transcribe handles multilingual content well
- Brand name extraction needs to match cross-language phonetic renderings (e.g., "Cheerful" pronounced as "Cheer-fu" in Japanese-influenced speech)

### 5. STT Hallucinations on Silent/Low-Audio Sections

**Problem**: Whisper is known to "hallucinate" text when audio is silent or unintelligible. Common hallucinations: "Thank you for watching", "Please like and subscribe". Brand names can appear in hallucinated text.

**Mitigation**:
- Filter known Whisper hallucination phrases before brand detection
- Use no_speech_prob field from Whisper API to skip low-confidence segments
- AssemblyAI's model has 30% fewer hallucinations than Whisper Large V3

---

## Cost Model: Per-Video Audio Detection

### Assumptions
- Average Instagram Reel: 60 seconds of audio
- Video download: assumed already done for visual analysis (shared cost)
- Audio extraction (ffmpeg): negligible CPU cost

### API Cost per 60-Second Reel

| STT Provider | Per-Reel Cost | Notes |
|-------------|---------------|-------|
| Whisper (self-hosted) | ~$0.0017 | GPU infra amortized |
| GPT-4o Mini Transcribe | $0.003 | Cheapest API |
| Whisper API | $0.006 | Standard OpenAI |
| AssemblyAI | ~$0.0042 | Effective with overhead |

### Adding Brand Extraction NLP

| Extraction Method | Additional Cost | Notes |
|-------------------|----------------|-------|
| Keyword/regex | $0 | Runs in Python |
| fuzzy match (rapidfuzz) | $0 | CPU only, trivial |
| Claude Haiku per transcript | ~$0.0003 | ~200 tokens in, 50 out |
| Claude Sonnet per transcript | ~$0.003 | More reasoning for ambiguous cases |

### Total Cost per Video (Audio Detection Layer)

| Scenario | Per-Video Cost |
|----------|---------------|
| Self-hosted Whisper + regex | ~$0.0017 |
| GPT-4o Mini + regex | ~$0.003 |
| GPT-4o Mini + Claude Haiku NLP | ~$0.0033 |
| AssemblyAI LeMUR (all-in-one) | ~$0.01–0.02 |

### Monthly Cost at Scale

| Volume | Self-hosted + regex | GPT-4o Mini + regex | GPT-4o Mini + Claude |
|--------|--------------------|--------------------|---------------------|
| 1,000 videos/mo | $1.70 | $3.00 | $3.30 |
| 10,000 videos/mo | $17 | $30 | $33 |
| 100,000 videos/mo | $170 | $300 | $330 |
| 1,000,000 videos/mo | $1,700 | $3,000 | $3,300 |

**Key insight**: Audio detection is dramatically cheaper than visual detection at scale. At 100K videos/month, audio detection ($300 via API) is ~10× cheaper than running visual detection at the same volume.

---

## Archive Radar: Observed Audio Detection Architecture

Based on Archive's published materials and product documentation:

1. **Archive "listens to what people say in videos"** — confirmed STT-based detection
2. Detection is layered with visual and text analysis: watches video + listens to audio + reads text
3. Triggers on spoken brand name without formal @mention
4. Explicitly called out use cases:
   - Creator says brand name but forgets to tag
   - Brand mentioned verbally while promoting a different brand
   - Brand product referenced conversationally ("I've been loving my [brand name] lately")

Archive does NOT publish its STT provider. Based on timing and scale, likely options:
- Self-hosted Whisper (cheapest at Archive's scale of 50K+ brands)
- Or a managed provider like AssemblyAI with volume discounts

Archive processes TikTok + Instagram + YouTube Shorts — cross-platform STT pipeline suggests a unified backend rather than platform-specific solutions.

---

## Integration with Cheerful Architecture

### Pipeline Position

Audio detection runs **in parallel with visual detection**, not sequentially. Both consume the same candidate video content:

```
Candidate content URL (video)
    ↓ [async, parallel]
    ├── Visual detection pipeline (frames → logo/OCR/CLIP)
    └── Audio detection pipeline:
            ├── ffmpeg audio extraction → 16kHz WAV
            ├── [optional] Spleeter source separation
            ├── STT transcription (Whisper API / self-hosted)
            ├── Brand mention extraction (keyword → fuzzy → Claude if needed)
            └── Confidence scoring
    ↓ [merge results]
Confidence aggregation: max(visual_confidence, audio_confidence) OR weighted combination
    ↓
ugc_content table OR human review queue
```

### New Temporal Activities

```python
@activity.defn
async def extract_audio_activity(video_url: str, job_id: str) -> str:
    """Download video, extract 16kHz mono WAV, return temp path."""
    # ffmpeg -i <video_url> -vn -acodec pcm_s16le -ar 16000 -ac 1 /tmp/{job_id}.wav
    ...
    return wav_path

@activity.defn
async def transcribe_audio_activity(wav_path: str) -> TranscriptionResult:
    """Call STT API, return transcript + segment timestamps."""
    # Whisper API or self-hosted Whisper
    ...
    return TranscriptionResult(text=..., segments=..., language=..., no_speech_prob=...)

@activity.defn
async def extract_brand_mentions_activity(
    transcript: TranscriptionResult,
    brand: BrandConfig
) -> list[BrandMention]:
    """Apply NLP pipeline to extract brand mentions from transcript."""
    # 1. Keyword match (fast, zero cost)
    # 2. Fuzzy match (rapidfuzz)
    # 3. Claude LLM if needed
    ...
```

### New Database Schema

```sql
-- Audio detection result stored with the ugc_content record
ALTER TABLE ugc_content ADD COLUMN audio_transcript TEXT;
ALTER TABLE ugc_content ADD COLUMN audio_transcript_language TEXT;
ALTER TABLE ugc_content ADD COLUMN audio_mentions JSONB;
-- audio_mentions format: [{"brand_alias": "Cheerful", "timestamp_sec": 12.3, "excerpt": "...", "confidence": 0.9}]

-- Or as a separate table for multi-brand campaigns
CREATE TABLE ugc_audio_mentions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ugc_content_id UUID REFERENCES ugc_content(id),
    brand_id UUID REFERENCES brands(id),
    brand_alias_matched TEXT,
    timestamp_sec FLOAT,
    transcript_excerpt TEXT,
    extraction_method TEXT, -- 'keyword', 'fuzzy', 'llm'
    confidence FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Compatibility with Existing Architecture

| Component | Compatibility | Notes |
|-----------|-------------|-------|
| FastAPI backend | ✅ Full | New `/ugc/audio-detect` activity endpoint |
| Temporal workflows | ✅ Full | Natural fit for durable async audio jobs |
| Supabase Storage | ✅ Full | Store WAV files transiently during processing |
| PostgreSQL | ✅ Full | New columns/table for audio detection results |
| Claude API | ✅ Already integrated | Use for LLM-based brand extraction (Approach D) |
| Fly.io | ✅ CPU | ffmpeg + Spleeter run on CPU workers; Whisper self-hosted needs GPU |
| Whisper API | ✅ Simple | Just add `openai.audio.transcriptions.create()` call |

**No new infrastructure required** for the API-based path (Whisper API or GPT-4o Mini Transcribe). Self-hosted Whisper requires GPU (same GPU machine as visual detection).

---

## Effort Estimates

| Component | Effort | Notes |
|-----------|--------|-------|
| Audio extraction (ffmpeg activity) | Small | Standard library, 1–2 days |
| Whisper API integration | Small | Single API call, 1 day |
| Keyword + fuzzy brand extraction | Small | Python libraries, 1–2 days |
| Spleeter source separation (optional) | Small–Medium | Open-source integration, 2–3 days |
| Claude LLM extraction (optional) | Small | Claude API call pattern already in stack, 1 day |
| Self-hosted Whisper GPU service | Medium | GPU infra setup, same as visual detection GPU worker |
| Database schema additions | Small | Migrations, 1 day |
| Brand alias management UI | Small | Brand onboarding addition, 1–2 days |
| **Total (API path, no GPU)** | **Small** | ~1 sprint (1–2 weeks) |
| **Total (self-hosted path)** | **Medium** | Shared GPU infra with visual detection |

---

## Constraints and Limitations

| Constraint | Details |
|-----------|---------|
| **Background music** | Most significant accuracy issue for Instagram Reels. Pre-separation with Spleeter/Demucs adds latency but improves quality substantially |
| **Hallucinations** | Whisper produces false text on silent/noisy sections. No-speech filtering required |
| **Homonym brands** | Brand names that are common words require LLM disambiguation (adds cost) |
| **No content access** | Audio detection requires having the video URL — same candidate discovery dependency as visual detection |
| **Story 24h window** | Audio on Story content must be processed within 24h of CDN URL delivery |
| **Rate limits** | No API rate limit issues — STT APIs process asynchronously, no tight limits |
| **Compute latency** | Audio detection: 5–30 seconds per Reel (API path); suitable for async batch, not real-time |
| **Short-form audio** | Stories (≤15 sec): Amazon Transcribe's 60-sec minimum billing makes it cost-inefficient; Whisper API billed per-second equivalent |
| **Cost at zero scale** | Even at low volume, API costs are negligible (100 videos = $0.30) — easy MVP |

---

## Build-vs-Buy Recommendation Framework

| Scenario | Recommendation |
|----------|---------------|
| MVP / early stage | **GPT-4o Mini Transcribe API + regex matching** — minimal code, $0.003/video, zero infra |
| Need lower hallucinations | **AssemblyAI Universal** — better accuracy, LeMUR for LLM-based extraction |
| High volume (>100K videos/month) | **Self-hosted Distil-Whisper** on shared GPU + fuzzy matching — ~10× cheaper than API |
| Brand = common word (homonym) | **Add Claude Haiku NLP pass** on all transcripts — handles ambiguity natively |
| Multi-language creator base | **Whisper API** — 99+ languages vs. Deepgram (36) / AssemblyAI (~20) |
| Lowest total cost | **Self-hosted Distil-Whisper + keyword + fuzzy** — ~$0.0017/video |

---

## Summary: Capability Assessment

| Attribute | Value |
|-----------|-------|
| Creator opt-in required | **No** — analyzes publicly available video content |
| Content types | Instagram Reels, Stories (via Messaging API), Feed videos |
| Stories coverage | Only if CDN URL already obtained via `story_mention` event |
| Prerequisite | Candidate content pool (see `ai-candidate-discovery`) |
| Accuracy | 70–85% recall for spoken brand mentions (audio quality dependent) |
| Real-time capability | No — async batch processing, 5–30 second latency |
| Cost model | $0.003/video (GPT-4o Mini API) to $0.0017/video (self-hosted); cheaper than visual detection |
| Permissions required | None additional — analyzes content already retrieved |
| Build complexity | **Small** for API path; Medium for self-hosted Whisper |
| Key risk | Background music degrades accuracy significantly; mitigated by audio source separation |
| Complementarity | Catches spoken mentions that visual detection (logo/OCR) cannot |

**Bottom line**: Audio detection is the lowest-effort AI detection layer to add. The core pipeline is simple: ffmpeg → STT API → fuzzy matching. The API-based path requires no new infrastructure, costs are trivially low at Cheerful's likely volume, and it catches a distinct signal class (spoken brand mentions) that visual detection cannot. The main quality risk is music-heavy Reels — adding Spleeter source separation as a pre-step is a Medium-effort improvement worth doing before production launch. For brand name extraction, starting with keyword + fuzzy matching covers 80% of cases; adding a Claude Haiku pass for homonym brands adds marginal cost with high accuracy gain.

---

## Sources

- [Best Open Source STT Models 2026 — Northflank](https://northflank.com/blog/best-open-source-speech-to-text-stt-model-in-2026-benchmarks)
- [Whisper vs Google Speech-to-Text 2026 — is4.ai](https://is4.ai/blog/our-blog-1/whisper-vs-google-speech-to-text-comparison-2026-267)
- [OpenAI Whisper API Pricing Feb 2026 — costgoat](https://costgoat.com/pricing/openai-transcription)
- [STT API Pricing Breakdown 2025 — Deepgram](https://deepgram.com/learn/speech-to-text-api-pricing-breakdown-2025)
- [Whisper API vs Self-Host 2026 — brasstranscripts](https://brasstranscripts.com/blog/openai-whisper-api-pricing-2025-self-hosted-vs-managed)
- [AssemblyAI Pricing 2025 — brasstranscripts](https://brasstranscripts.com/blog/assemblyai-pricing-per-minute-2025-real-costs)
- [Deepgram Pricing 2026 — brasstranscripts](https://brasstranscripts.com/blog/deepgram-pricing-per-minute-2025-real-time-vs-batch)
- [AssemblyAI vs Deepgram — Gladia](https://www.gladia.io/blog/assemblyai-vs-deepgram)
- [Whisper STT Benchmarks 2025 — diyai.io](https://diyai.io/ai-tools/speech-to-text/can-whisper-still-win-transcription-benchmarks/)
- [NER with spaCy — NewsCatcher](https://www.newscatcherapi.com/blog-posts/named-entity-recognition-with-spacy)
- [Building Whisper + FFmpeg Pipeline — Medium](https://medium.com/@rafaelgalle1/building-a-custom-scalable-audio-transcription-pipeline-whisper-pyannote-ffmpeg-d0f03f884330)
- [FFmpeg 8.0 Native Whisper Integration — rendi.dev](https://www.rendi.dev/post/ffmpeg-8-0-part-1-using-whisper-for-native-video-transcription-in-ffmpeg)
- [Archive Radar — Detect Untagged UGC](https://archive.com/blog/archive-radar)
- [Archive.com Levels Up with AI — quasa.io](https://quasa.io/media/archive-com-levels-up-influencer-marketing-with-ai-powered-creator-search-and-ugc-tools)
- [AssemblyAI Benchmarks](https://www.assemblyai.com/benchmarks)
- [Openai Whisper vs Google STT vs Amazon Transcribe — Gladia](https://www.gladia.io/blog/openai-whisper-vs-google-speech-to-text-vs-amazon-transcribe)
