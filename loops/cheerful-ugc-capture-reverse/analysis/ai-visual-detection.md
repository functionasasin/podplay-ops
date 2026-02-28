# AI Visual Detection — Logo/Product Recognition in Instagram UGC

**Aspect**: `ai-visual-detection`
**Wave**: 1 — External Landscape
**Date**: 2026-02-28

---

## Overview

AI visual detection addresses the "dark UGC" problem: brand appearances in Instagram content that are **never tagged or @mentioned**. This is the gap between what official Graph API endpoints capture (tagged/mentioned content) and what actually exists — creators featuring a brand's logo or product without proper attribution.

Three distinct computer vision sub-approaches exist, often combined:

| Sub-Approach | What It Detects | Best For |
|-------------|----------------|----------|
| **Logo detection** | Brand logo/wordmark in image or video frame | Prominent logo placement, packaging, signage |
| **Product recognition** | Specific products via visual similarity | Style-matched products without visible logo |
| **OCR** | Brand name as visible text in image/video frame | Text overlays, signage, on-screen captions |

These three techniques are complementary — Archive Radar appears to use all three, plus audio detection (covered in `ai-audio-detection`). This analysis covers the pure vision layer only.

**Critical constraint**: None of these techniques help unless you first have a candidate content pool. You cannot scan all of Instagram. The candidate discovery problem is covered in `ai-candidate-discovery`; this analysis assumes candidate content has been obtained.

---

## 1. Logo Detection: YOLO-Based Object Detection

### How It Works

YOLO (You Only Look Once) is a real-time object detection architecture that processes the entire image in a single forward pass. Logo detection fine-tunes a YOLO model (v8+ in 2025) on a brand-specific training dataset.

**Detection pipeline**:
```
Input image/frame
    → Pre-process: resize to 640×640, normalize
    → YOLO forward pass
    → Bounding box regression + class confidence scores
    → NMS (Non-Maximum Suppression) to eliminate overlapping boxes
    → Output: [x, y, w, h, confidence, class_id] per detected logo
```

**Training requirements**:
- Labeled images with logo bounding boxes per brand
- Typical minimum: 200–500 labeled images per brand for a basic model
- More diversity (angles, lighting, distances, partial occlusion) = better generalization
- Training time: 2–8 hours on a single GPU (e.g., A10G), less on YOLOv8-nano

**Key architectural variants** (2025):

| Model | Speed | Accuracy | Notes |
|-------|-------|----------|-------|
| YOLOv8-nano | ~300 FPS on GPU | Lower | Good for high-volume screening |
| YOLOv8-medium | ~120 FPS on GPU | Medium | Good balance |
| YOLOv8-xlarge | ~30 FPS on GPU | High | Best accuracy, higher cost |
| YOLOv9 / YOLOv10 | Similar to v8 | Incremental gains | Newer variants; v8 still dominant in production |

**Benchmark accuracy**: On LogoDet-3K (3,000 logo classes, 200K+ images), state-of-the-art models achieve ~70-75% mAP (mean Average Precision). On brand-specific fine-tuned models with good training data, accuracy can reach 85-92% mAP for in-distribution logos.

### Limitations

| Challenge | Impact |
|-----------|--------|
| Logo variation | Different color/size/rotation of same logo reduces confidence |
| Partial occlusion | Logo hidden by hand, clothing, or other objects |
| Distance/scale | Small logos on distant objects (background branding) |
| Novel contexts | Logo in an unusual setting not in training data |
| Multi-brand training | One YOLO model per brand OR one model with N classes; N-class approach degrades below ~50 brands |

**Per-brand training requirement**: Each brand needs its own training dataset. This is a significant operational overhead at scale (e.g., Cheerful onboarding 100 brands × training effort).

---

## 2. Product Recognition: CLIP Embeddings + Vector Similarity Search

### How It Works

CLIP (Contrastive Language–Image Pre-training, OpenAI) maps images and text into a shared embedding space. This enables **zero-shot product recognition** without brand-specific training data.

**Workflow**:
```
1. Brand setup (one-time):
   - Collect N reference images of brand's products (from product catalog)
   - Encode each via CLIP image encoder → embedding vectors
   - Store in vector database (FAISS, Qdrant, Pinecone)

2. Per-content inference:
   - Extract frames from Instagram video (or use image directly)
   - Encode frame via CLIP image encoder → query vector
   - Nearest-neighbor search against product embedding index
   - If similarity > threshold: candidate brand mention detected
```

**Key CLIP models** (2025):

| Model | Embedding Dim | Speed | Notes |
|-------|--------------|-------|-------|
| CLIP ViT-B/32 | 512 | Fast | Good for high-volume screening |
| CLIP ViT-L/14 | 768 | Medium | Better accuracy |
| OpenCLIP ViT-H/14 | 1024 | Slower | Best open-source accuracy |
| SigLIP (Google) | 1152 | Fast | Strong zero-shot performance |

**Zero-shot advantage**: No brand-specific training needed. Just provide reference product images. Works for new brands immediately.

**Limitations of CLIP for product recognition**:
- CLIP measures semantic similarity, not identity matching — a competitor's similar product may score high
- Not designed for identity-level recognition (e.g., "this is Brand X's SKU-1234" vs. "this is a moisturizer")
- Threshold tuning required per brand to balance recall vs. false positives
- Performs best when products have distinctive visual signatures

**Hybrid approach**: Use CLIP for broad filtering (high recall, lower precision), then pass candidates to a brand-specific fine-tuned model for confirmation (high precision). This reduces training data requirements while maintaining accuracy.

**Vector search infrastructure**:
- FAISS (local, open-source): Efficient cosine similarity search, no operational overhead, flat index works to ~10M vectors
- Qdrant (managed): $0 self-hosted or ~$25/mo managed, persistent storage, filtered search
- Pinecone: $0 serverless tier up to 2GB; $70/mo standard for larger workloads

---

## 3. OCR — On-Screen Brand Name Detection

### How It Works

Optical Character Recognition extracts text visible in images and video frames, enabling detection of brand names as on-screen text. This captures:
- Product packaging with brand name visible
- Clothing/accessories with text branding (e.g., Nike wordmark on a shirt)
- Story overlays, stickers, and caption text burned into video
- Store signage in video backgrounds

**2025 OCR Engine Comparison** (scene text relevance for Instagram content):

| Engine | Scene Text Accuracy | Ease of Deploy | GPU Required | Best For |
|--------|--------------------|--------------:|:-------------|----------|
| PaddleOCR v3.0 (PP-OCRv5) | ⭐⭐⭐⭐ | Medium | Optional | Best accuracy on real-world imagery |
| EasyOCR | ⭐⭐⭐ | Easy | Optional | Quick deployment, 80+ languages |
| Tesseract 5 | ⭐⭐ | Easy | No | Clean printed documents only |
| Google Cloud Vision OCR | ⭐⭐⭐⭐ | Trivial (API) | No | Managed, excellent for on-screen text |
| Azure Computer Vision OCR | ⭐⭐⭐⭐ | Trivial (API) | No | Strong scene text, managed |

**Post-OCR matching**: OCR produces raw text; matching requires:
1. Normalize: lowercase, strip punctuation
2. Fuzzy match against brand name dictionary: `fuzzywuzzy`, Levenshtein distance, or embedding-based semantic matching
3. Handle misspellings (e.g., creator types "Nike" as "Nîke")

**Instagram-specific challenges**:
- Stylized fonts and brand wordmarks not always recognized correctly
- Low contrast text on busy backgrounds
- Curved/distorted text in Stories (sticker effects)
- Small text at normal Instagram compression

**OCR pipeline cost**: If using self-hosted PaddleOCR or EasyOCR, compute cost is low (~$0.001/image on GPU). Google Cloud Vision OCR: $1.50/1,000 images (same tier as logo detection).

---

## 4. Video Frame Sampling Strategy

Video content (Reels, Stories) requires frame extraction before any visual analysis. Efficient sampling dramatically reduces cost.

### Sampling Approaches

| Strategy | FPS | Frames (60s video) | Relative Cost | Notes |
|----------|-----|-------------------|---------------|-------|
| Full-rate | 30 | 1,800 | 100% | Never practical for UGC at scale |
| Fixed low rate | 2 | 120 | 6.7% | Standard starting point |
| Fixed lower rate | 1 | 60 | 3.3% | Often sufficient for logo presence |
| Scene-change only | Variable | ~10-30 | ~1-2% | Extract on scene transitions |
| Adaptive (content-aware) | Dynamic | ~5-15 | ~0.5-1% | Best: skip static frames |
| Thumbnail only | 1/video | 1 | 0.05% | Cover image only; misses mid-video appearances |

**Research benchmark (2025)**: Intelligent frame sampling achieves 22%+ accuracy improvement over uniform sampling at 0.1% of frames — primarily for long-form content. For short Instagram Reels (15–90 seconds), scene-change detection provides a good balance.

**Practical recommendation for Instagram**:
- **Feed posts (images)**: No sampling needed — single frame
- **Reels (≤60 sec)**: 2 FPS = 120 frames max; or scene-change detection (~10-20 frames)
- **Reels (60–90 sec)**: 1 FPS + scene-change = ~20-40 frames
- **Stories (≤15 sec)**: 2 FPS = 30 frames; often just 3-5 representative frames

**Frame extraction tooling**:
- `ffmpeg` (self-hosted): `ffmpeg -i input.mp4 -vf fps=2 frames/%04d.jpg` — free, fast
- `OpenCV` (Python): `cv2.VideoCapture` with frame stepping — standard
- Google Cloud Video Intelligence: handles frame analysis internally at $0.10/min (label) or $0.60/min (logo)

---

## 5. Build-vs-Buy Analysis

### Option A: Google Cloud Vision API (Managed, Images)

**What it provides**: Pre-trained logo detection on 1,000+ known brand logos (Google's pre-trained index). Returns logo name + bounding box confidence scores.

**Capability**: Works out of the box for major recognized brands. No training data required for known logos. May not recognize niche/emerging brand logos.

**Pricing**:
- Logo detection: **$1.50 per 1,000 images** (after free tier of 1,000/month)
- Text detection (OCR): **$1.50 per 1,000 images**
- Combined (logo + OCR in one call): **$3.00 per 1,000 images** (billed as 2 units)

**Scale cost examples**:

| Volume | Cost/Month |
|--------|-----------|
| 10,000 images/month | ~$13.50 |
| 100,000 images/month | ~$135 |
| 1,000,000 images/month | ~$1,350 |

**Limitations**:
- Recognizes only globally known logos — new/small brands not in training set won't be detected
- No per-brand customization without upgrading to AutoML Vision
- Per-unit billing means every frame extraction call costs money

### Option B: Google Cloud Video Intelligence API (Managed, Video)

**Logo Recognition**: $0.60/minute of video analyzed.

**Scale cost examples** (assuming 1 Reel = 1 min average, 2 FPS → 120 frames):

| Volume | Cost/Month |
|--------|-----------|
| 1,000 videos/month | $600 |
| 10,000 videos/month | $6,000 |
| 100,000 videos/month | $60,000 |

**Assessment**: Extremely expensive at scale for UGC video analysis. Only viable for very low-volume or high-value use cases.

**Practical alternative**: Extract frames with `ffmpeg` (2 FPS), then use Vision API image endpoint ($1.50/1,000 frames) instead of Video API. At 2 FPS × 60-sec Reel = 120 frames = $0.18/video vs $0.60/minute via Video API. **3.3× cheaper** using image API + manual frame extraction.

### Option C: Amazon Rekognition Custom Labels (Managed, Custom-Trained)

**What it provides**: Train a custom model on brand-specific logo images; host as an endpoint; call per image.

**Training cost**: Typically $1/training hour. A simple single-brand logo model trains in 1-2 hours = $1-2 per brand setup.

**Inference cost**: ~$4/hour for a running endpoint (regardless of request volume) + per-request fees. Minimum cost model: 1-hour inference burst = $4/hr × usage.

**Assessment**: More expensive and operationally complex than Cloud Vision for this use case. Designed for custom enterprise objects, not cost-effective for broad UGC monitoring. Per-brand training multiplies setup cost.

### Option D: Roboflow (Managed, Mixed)

**What it provides**: Platform for training and deploying custom YOLO-based models. Pre-built logo detection models available in Roboflow Universe. Managed inference API.

**Pricing**:
- Starter: **$49/month** (includes credit allocation for inference)
- Growth: **$299/month**
- Self-hosted inference (open-source): **Free** (Apache 2.0 license)

**Brand Logo Recognition — pre-trained models**: Roboflow Universe hosts YOLOv8-based brand logo models (e.g., "brand-logo-recognition-yolov8") that can be used immediately via API. Covers common consumer brands.

**Assessment**: Good middle ground — managed training + inference without building from scratch. $49/month tier may cover low-volume Cheerful usage; Growth tier for moderate scale. Self-hosted inference via `roboflow/inference` open-source package is viable for cost-sensitive deployments.

### Option E: Self-Hosted YOLO + PaddleOCR + CLIP (Full Build)

**What it provides**: Complete stack built and operated by Cheerful engineering.

**Stack components**:
```
- YOLOv8 (PyTorch) — fine-tuned per brand for logo detection
- PaddleOCR v3.0 — OCR for on-screen brand text
- CLIP ViT-L/14 — product recognition via embedding similarity
- FAISS or Qdrant — vector search for CLIP embeddings
- ffmpeg — frame extraction from video
- FastAPI worker — async inference service
- GPU instance — Fly.io GPU machine ($0.50-2.50/hr depending on GPU tier)
```

**Compute cost model** (GPU inference on A10G class GPU):
- Image inference (YOLO + OCR): ~10ms per image → ~100 images/second
- CLIP embedding: ~5ms per image on GPU
- Total throughput: ~80-100 images/sec per GPU

**Monthly compute cost examples**:

| Volume | GPU Hours Needed | Cost (A10G @ $1/hr) |
|--------|-----------------|---------------------|
| 10,000 images | 0.1 hr | ~$0.10 |
| 100,000 images | 1 hr | ~$1.00 |
| 1,000,000 images | 10 hr | ~$10.00 |
| 10,000,000 images | 100 hr | ~$100 |

**Assessment**: Lowest per-inference cost at scale; highest upfront engineering investment. The main costs are:
1. Engineering time to build training pipeline + per-brand model management
2. GPU infrastructure operations
3. Per-brand training dataset curation (likely 200-500 labeled images/brand)

**Break-even vs Cloud Vision**: At ~$1.50/1,000 images (Cloud Vision), self-hosted becomes cheaper above ~100,000-500,000 images/month, depending on GPU allocation efficiency.

---

## 6. Accuracy Benchmarks Summary

| Technique | Best Accuracy | Typical Production Accuracy | Notes |
|-----------|-------------|---------------------------|-------|
| YOLO logo detection (fine-tuned) | 92% mAP | 75-85% mAP | Requires good training data per brand |
| CLIP product recognition | 80% top-1 (zero-shot) | 65-75% top-1 | Better with more reference images |
| Google Cloud Vision (pre-trained logos) | ~85% known brands | ~60-70% for niche brands | Works out-of-the-box for major brands only |
| OCR + fuzzy match | 95% for clear text | 70-80% for scene text | Degrades on stylized/distorted text |
| Combined (YOLO + OCR + CLIP) | 92-95% combined | 80-88% combined | Complementary coverage |

**False positive rates**: Tuning confidence thresholds is critical. Low thresholds increase recall but require human review workflows for false positives.

---

## 7. Archive Radar: Observed Architecture

Based on Archive's published materials, Archive Radar implements:

1. **Visual AI detection**: Detects brand logos, products, and text in images/video frames
2. **Audio detection**: Transcribes audio and detects brand name mentions (covered in `ai-audio-detection`)
3. **"Super Search"**: Natural language search across visual + audio + caption transcripts
4. **24/7 Story monitoring**: Automatic capture before 24-hour expiry

Archive describes the gap it closes:
- Creators forget to tag (accidental omission)
- Creator misspells brand handle
- Brand appears as afterthought or background in content promoting another brand
- Brand product visible without any attribution

Archive reports "4× more UGC than teams realize" through radar detection — implying that roughly 75-80% of brand appearances in UGC are formally tagged, and ~20-25% are untagged/unattributed. (This ratio is marketing copy; actual measurement varies by brand.)

**What Cheerful would need to replicate Archive Radar**:
- All three visual sub-approaches (logo detection, product recognition, OCR)
- Per-brand training data management for YOLO
- Audio detection pipeline (Whisper + NER)
- Candidate content pool strategy (prerequisite — see `ai-candidate-discovery`)

---

## 8. Constraints and Limitations

| Constraint | Details |
|-----------|---------|
| **Candidate discovery bottleneck** | Visual AI is useless without content to analyze. This is the actual hard problem — see `ai-candidate-discovery` |
| **Per-brand training data** | YOLO requires 200-500 labeled images per brand. At 100 brands, this is a significant one-time cost |
| **Logo diversity** | Same brand's logo varies in size, orientation, lighting, color variant. Training data must reflect this |
| **False positives** | Generic colors, shapes, similar competitor logos can trigger false matches |
| **Video cost** | Video analysis is 60-120× more calls than image analysis (frame extraction required) |
| **No API access to most UGC** | You must either: (a) already have the media URL, or (b) use unofficial methods to obtain content for analysis |
| **Meta TOS ambiguity** | Analyzing content retrieved via official API is permitted; bulk-scraping for analysis may violate TOS |
| **Stories expiry** | 24-hour window to download and analyze Story content from `story_mention` events |
| **Emerging/niche brands** | Cloud Vision pre-trained models don't know your brand; custom training required |
| **Model drift** | Brand rebrands (logo refresh) require re-training |

---

## 9. Integration with Cheerful Architecture

### Pipeline Position

AI visual detection sits **downstream of candidate discovery** and **upstream of UGC storage**:

```
Candidate content pool (image/video URLs)
    ↓
Frame extraction (ffmpeg, Temporal activity)
    ↓
Visual inference:
    ├── YOLO logo detection (per-brand model)
    ├── CLIP product embedding similarity
    └── OCR + fuzzy brand name matching
    ↓
Confidence scoring + deduplication (already captured via official API?)
    ↓
Human review queue (if confidence < threshold) OR auto-capture (if high confidence)
    ↓
ugc_content table (brand_id, capture_source='ai_radar', confidence_score, ...)
```

### New Components Required

**1. Per-brand model registry**:
```python
# model_registry table
CREATE TABLE brand_visual_models (
    id UUID PRIMARY KEY,
    brand_id UUID REFERENCES brands(id),
    model_type TEXT,  -- 'yolo_logo', 'clip_product', 'ocr'
    model_version TEXT,
    s3_path TEXT,     -- path to model weights in Supabase Storage
    trained_at TIMESTAMPTZ,
    accuracy_metrics JSONB,
    active BOOLEAN DEFAULT TRUE
);
```

**2. Inference Temporal workflow**:
```python
# New Temporal workflow
class UGCVisualInferenceWorkflow:
    async def run(self, content_item: CandidateContent):
        frames = await extract_frames(content_item.media_url, fps=2)
        results = await run_all_detections(frames, content_item.brand_id)
        if results.confidence > THRESHOLD:
            await store_ugc_detection(results)
        elif results.confidence > REVIEW_THRESHOLD:
            await queue_for_human_review(results)
```

**3. GPU worker service**:
- Separate FastAPI service for inference (CPU workers not suitable for YOLO/CLIP)
- Deploy as Fly.io GPU machine (separate from main API)
- Scale-to-zero to avoid idle GPU costs

**4. Brand onboarding flow for AI radar**:
- Upload brand reference images (logo variants, products)
- Trigger YOLO fine-tuning job (async, ~2-4 hrs)
- Generate CLIP product embedding index
- Activate radar monitoring for this brand

### Compatibility with Existing Architecture

| Component | Compatibility | Notes |
|-----------|-------------|-------|
| FastAPI backend | ✅ Full | New inference endpoint or separate service |
| Temporal workflows | ✅ Full | Natural fit for durable inference jobs |
| Supabase Storage | ✅ Full | Store model weights + downloaded media |
| PostgreSQL | ✅ Full | Model registry, detection results tables |
| Fly.io | ⚠️ GPU required | Fly.io offers GPU machines (A10, L40S) — additional cost |
| Claude API | ✅ Potential | Could use Claude's vision for human-review assistance |

---

## 10. Build-vs-Buy Decision Framework

| Scenario | Recommendation | Rationale |
|----------|---------------|-----------|
| 1-10 brands, low volume | **Google Cloud Vision API** | Zero setup, $1.50/1K images covers known brands; pay-as-you-go |
| 10-50 brands, moderate volume | **Roboflow managed ($49-299/mo)** | Pre-built brand models, managed inference, reasonable cost |
| 50+ brands, high volume | **Self-hosted YOLO + CLIP** | Amortized training cost; dramatically lower per-image cost at scale |
| Brands not in Google's index | **Self-hosted or Roboflow custom** | Cloud Vision pre-trained won't detect niche/emerging brands |
| MVP / proof of concept | **Google Cloud Vision** | Fastest path to production; refine later |

---

## 11. Effort Estimates

| Component | Effort | Notes |
|-----------|--------|-------|
| Google Cloud Vision integration | Small | Simple REST API call + result parsing |
| Frame extraction pipeline (ffmpeg) | Small | Standard library integration |
| CLIP product embedding + Qdrant | Medium | Embedding generation + vector search setup |
| Per-brand YOLO fine-tuning pipeline | Large | Training infrastructure, dataset management, version control |
| OCR pipeline (EasyOCR/PaddleOCR) | Small–Medium | Library integration + brand name fuzzy matching |
| GPU inference service (Fly.io) | Medium | Separate service, auto-scaling config |
| Human review queue UI | Medium | Frontend + review workflow |
| **Total (Cloud Vision path)** | Small–Medium | API integration + frame extraction |
| **Total (self-hosted path)** | Large | Full ML infrastructure |

---

## 12. Summary: Capability Assessment

| Attribute | Value |
|-----------|-------|
| Creator opt-in required | **No** — analyzes publicly available content |
| Content types detectable | Feed images, Reels (frames), Stories (frames after download) |
| Stories coverage | Only if media already obtained via `story_mention` event |
| Prerequisite | Candidate content pool (critical dependency — see `ai-candidate-discovery`) |
| Accuracy | 75-88% combined techniques; false positives require human review |
| Real-time capability | No — batch processing, minutes-to-hours latency |
| Cost model | $1.50/1K images (Cloud Vision) vs ~$0.001/image self-hosted at scale |
| Permissions required | None additional (analyzes content already obtained) |
| Build complexity | Cloud Vision: Low; Self-hosted YOLO: High |
| Key risk | Candidate discovery is the actual bottleneck — AI is the easy part |

**Bottom line**: AI visual detection is technically mature and viable in 2025. The three techniques (logo detection, product recognition, OCR) are complementary and together can achieve 80-88% coverage of visually identifiable brand appearances. **The hard problem is not the detection model — it's obtaining a candidate content pool to run detection against.** For Cheerful, a realistic path is:
1. Use Google Cloud Vision API for an MVP (low effort, moderate accuracy for known brands)
2. Add self-hosted CLIP + OCR for brand-specific coverage (medium effort)
3. Consider full YOLO fine-tuning per brand only when scale justifies the infrastructure investment

---

## Sources

- [YOLOv8 Brand Logo Detection + Roboflow — Mikhail Korotkov/Medium](https://medium.com/@ma-korotkov/unveiling-brand-logo-detection-leveraging-ultralytics-yolov8-and-roboflow-abc3ab42b06f)
- [Deep Learning for Logo Detection Survey — ACM TOMM 2023](https://dl.acm.org/doi/10.1145/3611309)
- [Logo Identification in Videos — Aim Technologies 2025](https://www.aimtechnologies.co/2025/07/22/logo-identification-in-videos-the-future-of-visual-brand-monitoring/)
- [Google Cloud Vision API — Logo Detection Docs](https://cloud.google.com/vision/docs/detecting-logos)
- [Google Cloud Vision API Pricing](https://cloud.google.com/vision/pricing)
- [Google Cloud Video Intelligence API Pricing](https://cloud.google.com/video-intelligence/pricing)
- [Amazon Rekognition Custom Labels Features](https://aws.amazon.com/rekognition/custom-labels-features/)
- [Building Brand Detection with Rekognition — AWS Blog](https://aws.amazon.com/blogs/machine-learning/part-1-end-to-end-solution-building-your-own-brand-detection-and-visibility-using-amazon-sagemaker-ground-truth-and-amazon-rekognition-custom-labels/)
- [Amazon Rekognition Pricing](https://aws.amazon.com/rekognition/pricing/)
- [Roboflow Pricing](https://roboflow.com/pricing)
- [Roboflow Inference — Open Source](https://inference.roboflow.com/)
- [OpenAI CLIP Zero-Shot Classification — Pinecone](https://www.pinecone.io/learn/series/image-search/zero-shot-image-classification-clip/)
- [CLIP Model — OpenAI](https://openai.com/index/clip/)
- [PaddleOCR vs Tesseract Analysis — Koncile](https://www.koncile.ai/en/ressources/paddleocr-analyse-avantages-alternatives-open-source)
- [OCR Models Comparison 2025 — MarkTechPost](https://www.marktechpost.com/2025/11/02/comparing-the-top-6-ocr-optical-character-recognition-models-systems-in-2025/)
- [Frame Sampling for Video Recognition — Netra/Medium](https://medium.com/netra-io/video-recognition-at-scale-addressing-brand-safety-concerns-on-youtube-with-computer-vision-442de6c581ed)
- [Archive Radar — Start Detecting Untagged UGC](https://archive.com/blog/archive-radar)
- [Archive.com — Additional $8M Funding](https://archive.com/blog/an-additional-8m-for-archive)
