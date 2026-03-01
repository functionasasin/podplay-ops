# Anchor Statement Sets — SSR Likert Scale Design

> Status: Complete (w2-anchor-statements).
> Cross-references: [scoring-aggregation.md](scoring-aggregation.md) · [panel-run.md](../tools/panel-run.md) · [migration.sql](../data-model/migration.sql) · [supabase-schema.md](../data-model/supabase-schema.md) · [embedding-options.md](../existing-patterns/embedding-options.md)

---

## Overview

Anchor statements are the cornerstone of the SSR (Semantic Similarity Rating) methodology. Instead of asking a persona "rate this 1 to 5", the SSR pipeline:

1. Elicits a free-text response from the persona describing their reaction
2. Embeds that response into vector space
3. Compares the response embedding to pre-embedded anchor statements at each Likert scale point
4. The scale point whose anchor is semantically closest becomes the persona's score

This produces scores that match human test-retest reliability at ~90% — far better than directly asking LLMs for numeric ratings (which produce unrealistic distributions such as always returning 5/5 or clustering at the scale midpoint).

**The quality of the anchor statements directly determines the quality of all SSR scores.** Poorly written anchors produce ambiguous scoring and unreliable distributions. The anchors in this document were written to maximize semantic distinctiveness while remaining naturalistic first-person consumer language.

---

## Scale Design: 5-Point vs 7-Point

**Decision: 5-point scale for all dimensions.**

### Rationale

| Factor | 5-Point | 7-Point |
|--------|---------|---------|
| Adjacent anchor distinctiveness | High — each step is a meaningful semantic jump | Lower — points 4 and 5 on a 7-point scale are hard to distinguish |
| Panel size requirement for resolution | Sufficient with 10–50 personas | Benefits from 100+ for meaningful 7-point distributions |
| Risk of band compression | Low | High — LLM-generated responses tend to cluster in points 4–6 of a 7-point scale |
| SSR paper validation | Validated on 5-point scales | Not tested |
| Embedding distance separation | Adequate to separate all 5 anchors semantically | Adjacent 7-point anchors may embed too closely for reliable argmax |

**Conclusion**: A 5-point scale provides sufficient scoring granularity for panels of 5–50 personas. Weighted scores (from softmax) add continuous resolution within the 5-point framework, effectively giving a 1.0–5.0 float output.

---

## Anchor Quality Principles

Five rules govern every anchor statement in this document. Any future anchor additions must satisfy all five.

### Rule 1: First-Person Consumer Voice

Anchors must be naturalistic first-person reactions, not questionnaire language.

**Correct**: "I would definitely buy this and would look for it the next time I shop."
**Wrong**: "Strongly agree that I would purchase this product."
**Wrong**: "Score 5 / Strongly favorable."

*Rationale*: LLM-generated persona responses use natural language. For cosine similarity to work, the anchor must be in the same embedding space as the response — natural, conversational consumer language.

### Rule 2: Semantic Monotonicity

Each adjacent pair of anchors must have a clear directional semantic relationship. Point 2 must be semantically "between" points 1 and 3 — not merely different from them.

**Test**: If you embed the 5 anchors, their cosine similarity to a neutral text should form a roughly inverted-U shape (peaking at anchor 3 for a neutral response), and their similarity to a strongly positive text should form a monotonically increasing sequence from anchor 1 to anchor 5.

### Rule 3: Semantic Distinctiveness

Adjacent anchors must be semantically distinct enough to separate in embedding space. Points 4 and 5 are the hardest to differentiate — the difference must be one of degree AND qualitative flavor.

**Pattern**: Use escalating language (`"probably"` → `"definitely"`) AND qualitative additions at the extremes (point 5 includes an action or intensity marker not present in point 4).

### Rule 4: Genuine Neutrality at Point 3

The neutral anchor (scale point 3) must be genuinely neutral — neither a weakened positive nor a softened negative. It should convey "neither good nor bad" rather than "could go either way." Many scales fail here by making the neutral point feel mildly negative.

**Pattern**: "It does not change how I feel" / "I understand it, but it took a moment" / "the price is about what I'd expect."

### Rule 5: Dimensional Purity

Each anchor set must stay within a single evaluative dimension. Do not mix dimensions within an anchor set (e.g., don't include clarity language in a purchase_intent anchor set). If two dimensions co-vary in consumer language, keep them separate — the SSR methodology allows testing multiple dimensions independently.

---

## Evaluation Dimensions: Complete Specifications

The SSR panel tool supports **10 evaluation dimensions**. All 10 have pre-defined anchor sets. Users select 1–6 dimensions per run; the default is `["purchase_intent", "overall_appeal"]` (see `PanelRunInput.evaluation_dimensions` default).

---

### Dimension 1: `purchase_intent`

**What it measures**: The likelihood that a persona would actually purchase, try, or take an action to acquire the product or service. This is a behavioral intention measure — "would you buy this?" — not just awareness or general liking.

**When to use**:
- For any ad, headline, or campaign creative where purchase conversion is the primary goal
- For product concept tests where you want to know if consumers would actually try the product
- For pricing messages where behavioral response matters
- For e-commerce or DTC contexts
- **Not recommended for**: purely brand-awareness campaigns where purchase intent is not the immediate goal (use `brand_favorability` instead)

**Recommended for stimulus types**: `ad_copy`, `headline`, `product_concept`, `pricing_message`, `packaging_description`

**Scale**: 5-point (1 = strong avoidance, 5 = definite purchase)

| Scale Point | Anchor Statement |
|-------------|-----------------|
| **1** | I would not buy this under any circumstances and would actively avoid it. |
| **2** | I am unlikely to buy this — it does not appeal to me enough to spend my money. |
| **3** | I might consider buying this if the conditions were right, but I'm not drawn to it strongly. |
| **4** | I would probably buy this — it appeals to me and I could see myself picking it up. |
| **5** | I would definitely buy this and would look for it the next time I shop. |

**Design notes**:
- Point 1 includes "actively avoid" to separate it from mere indifference (score 2).
- Point 3 includes a conditional hedge ("if the conditions were right") — this is the genuine neutral: possible purchase, but requires a reason.
- Point 4 vs 5: "probably" vs "definitely" + the point-5 addition of "would look for it next time I shop" adds an active seeking behavior that point 4 lacks.
- Currency-neutral language ("spend my money") works across geographies and income brackets.

---

### Dimension 2: `brand_favorability`

**What it measures**: The change in overall impression and attitude toward the brand after exposure to the stimulus. This is a brand equity measure — does this communication make the persona feel better, worse, or the same about the brand?

**When to use**:
- For evaluating whether brand communications reinforce or damage brand equity
- For brand messaging, taglines, and campaign themes
- For influencer content where the association matters as much as the message
- For comparing execution variants: does version A improve brand favorability more than version B?
- **Not recommended for**: purely product-level claims without brand context

**Recommended for stimulus types**: `brand_message`, `tagline`, `campaign_theme`, `influencer_pitch`, `ad_copy`

**Scale**: 5-point (1 = brand damage, 5 = strong brand lift)

| Scale Point | Anchor Statement |
|-------------|-----------------|
| **1** | This makes me think worse of the brand — it feels off-putting or inconsistent with what I expect. |
| **2** | This does not improve my impression of the brand — I feel indifferent or slightly negative. |
| **3** | This does not change how I feel about the brand — my impression is the same as before. |
| **4** | This gives me a better impression of the brand — it feels authentic and aligned with my values. |
| **5** | This makes me think much more highly of the brand — I feel genuinely positive and more loyal. |

**Design notes**:
- Points 1–2 are separated by degree: point 1 is active negative shift ("think worse of"), point 2 is absence of positive shift without active damage.
- Point 3 is purely neutral — "does not change" is the correct framing. Avoids the common mistake of making neutral sound slightly negative.
- Points 4–5 are separated by the addition of "more loyal" at point 5, which captures a behavioral/commitment dimension beyond mere positive impression.
- "Aligned with my values" at point 4 references authenticity — the #1 driver of brand favorability in consumer research.

---

### Dimension 3: `message_clarity`

**What it measures**: How clearly and immediately the communication conveys its intended meaning. This is a comprehension and communication efficiency measure — does the audience understand what this is saying?

**When to use**:
- For any communication where comprehension is uncertain (new product categories, complex claims, multilingual audiences)
- For headline and tagline testing where immediate clarity is critical
- When testing copy before localization
- When the target audience has lower literacy or less category knowledge
- **Not recommended for**: communications where ambiguity is intentional (teaser campaigns, artistic brand expressions)

**Recommended for stimulus types**: `headline`, `ad_copy`, `tagline`, `product_concept`, `brand_message`, `packaging_description`

**Scale**: 5-point (1 = completely opaque, 5 = instantly crystal clear)

| Scale Point | Anchor Statement |
|-------------|-----------------|
| **1** | I have no idea what this is trying to say — the message is completely unclear or confusing. |
| **2** | The message is somewhat unclear — I had to work to understand what they're trying to communicate. |
| **3** | I understand what this is saying, but it took me a moment — the communication is average. |
| **4** | The message is clear and easy to follow — I understood immediately what they were communicating. |
| **5** | The message is crystal clear and instantly understood — exactly what they wanted to communicate came through perfectly. |

**Design notes**:
- The key differentiator across all 5 points is cognitive effort: "completely unclear" → "had to work" → "took me a moment" → "immediately" → "perfectly".
- Point 5 adds "exactly what they wanted to communicate" — this captures the meta-level where the receiver accurately reconstructs the sender's intent, not just any meaning.
- Point 1 vs 2: "no idea" vs "had to work" — the former implies total failure, the latter implies partial comprehension with effort.
- Point 3 specifically captures the "understood eventually but not immediately" case, which is important for headlines and taglines where immediate recognition is the goal.

---

### Dimension 4: `emotional_response`

**What it measures**: The strength and valence of positive emotional engagement triggered by the stimulus. This dimension focuses on emotional activation — excitement, warmth, delight, inspiration, nostalgia, joy. Negative valence (annoyance, offense) is captured at point 1.

**When to use**:
- For brand campaigns and campaign themes where emotional resonance is the goal
- For social content where emotional engagement drives shares
- For influencer content where warmth and authenticity are critical
- For cause-related or purpose-driven campaigns
- **Not recommended for**: purely rational, price-based communications where emotional appeal is not the intended mechanism

**Recommended for stimulus types**: `campaign_theme`, `ad_copy`, `social_caption`, `brand_message`, `influencer_pitch`

**Scale**: 5-point (1 = emotional repulsion, 5 = deep emotional connection)

| Scale Point | Anchor Statement |
|-------------|-----------------|
| **1** | This leaves me completely cold — I feel nothing positive and may even feel annoyed or repelled. |
| **2** | This generates very little emotional response in me — it fails to connect or engage emotionally. |
| **3** | This produces a mild emotional response — I feel slightly interested or mildly positive but not moved. |
| **4** | This genuinely engages me emotionally — I feel something real like warmth, excitement, or nostalgia. |
| **5** | This moves me deeply — I feel strong positive emotions like joy, inspiration, or heartfelt connection. |

**Design notes**:
- Point 1 captures both emotional coldness AND active negative emotion ("annoyed or repelled"), providing a broader negative anchor.
- Points 2–3 differ by presence of any positive signal: point 2 is purely absent ("fails to connect"), point 3 includes "slightly interested."
- Points 4–5 differ by depth: point 4 is "genuine" but surface-level ("warmth, excitement"), point 5 is "deeply moved" with "heartfelt connection."
- Named emotions at points 4 and 5 ("warmth, excitement, nostalgia"; "joy, inspiration, heartfelt connection") improve embedding accuracy by providing specific emotional vocabulary.

---

### Dimension 5: `personal_relevance`

**What it measures**: How specifically this stimulus speaks to the persona's own life, situation, needs, and values. This is a targeting accuracy measure — does this feel made for me, or for someone else?

**When to use**:
- For targeting assessments — does the intended audience actually feel targeted?
- For product concept tests where the core insight must land
- For any communications testing with a very specific target segment
- For influencer fit assessments — does the influencer's audience see themselves in the content?
- **Especially valuable** when panel demographics are tightly scoped (e.g., "Filipino mothers age 30-45")

**Recommended for stimulus types**: `product_concept`, `brand_message`, `influencer_pitch`, `ad_copy`, `social_caption`

**Scale**: 5-point (1 = irrelevant to my life, 5 = made exactly for me)

| Scale Point | Anchor Statement |
|-------------|-----------------|
| **1** | This has absolutely nothing to do with my life — it speaks to someone completely different from me. |
| **2** | This doesn't really speak to me — it's for someone with a very different lifestyle or situation. |
| **3** | This is somewhat relevant to my life — I can see how it might apply, though it's not specifically for me. |
| **4** | This speaks directly to my life — it addresses something I actually think about or deal with. |
| **5** | This feels made exactly for me — it addresses my specific situation, needs, and values precisely. |

**Design notes**:
- Point 1 vs 2: "someone completely different" vs "someone with a very different lifestyle" — the former implies demographic mismatch, the latter implies psychographic/lifestyle mismatch.
- Point 3 is carefully neutral: "I can see how it might apply" — relevant in the abstract but not specifically targeted at me.
- Points 4–5 differ by specificity: point 4 is "speaks directly," point 5 adds "precisely" and mentions needs AND values (not just lifestyle).
- This dimension is particularly sensitive to the panel's demographic composition. A panel of 30-45 year old Filipino mothers should score high on relevance for products actually targeted at them.

---

### Dimension 6: `uniqueness`

**What it measures**: Perceived distinctiveness relative to other brands and communications in the category. This is a differentiation measure — does this stand out, or does it blend in?

**When to use**:
- For creative concept evaluation where breakthrough potential matters
- When testing in cluttered categories (FMCG, beauty, food & beverage)
- For brand messaging where differentiation is a strategic priority
- For comparing multiple creative directions
- **Not recommended for**: categories where conformity to conventions is valuable (safety, pharmaceuticals, banking)

**Recommended for stimulus types**: `tagline`, `campaign_theme`, `ad_copy`, `brand_message`, `social_caption`

**Scale**: 5-point (1 = completely generic, 5 = completely fresh/distinctive)

| Scale Point | Anchor Statement |
|-------------|-----------------|
| **1** | This feels completely generic — I've seen exactly this before from many other brands and nothing stands out. |
| **2** | This is mostly familiar — there are small differences but nothing that really makes it stand apart. |
| **3** | This is somewhat distinctive — there are elements that differ from what I usually see, though not dramatically. |
| **4** | This stands out from the competition — there is something genuinely different and memorable about it. |
| **5** | This is completely fresh and distinctive — I've never seen anything quite like it and it truly stands apart. |

**Design notes**:
- Point 1 includes "I've seen exactly this before" — the key uniqueness failure is familiarity, not just averageness.
- Point 3 is the true neutral: "somewhat distinctive" — different, but not break-through.
- Points 4–5 differ by "memorable" at point 4 vs "I've never seen anything quite like it" at point 5. The latter captures genuine novelty, not just above-average differentiation.
- "Completely fresh" at point 5 is a strong signal — reserved for genuinely novel creative. Most scoring should cluster at 3–4 unless the stimulus is truly breaking new ground.

---

### Dimension 7: `trust_credibility`

**What it measures**: The believability and perceived authenticity of the stimulus and the claims or brand behind it. This is a skepticism measure — does this feel honest and trustworthy, or does it feel manipulative and exaggerated?

**When to use**:
- For claims-heavy communications (efficacy, pricing, sustainability, health)
- For new brands or brands entering new categories
- For influencer endorsements where authenticity is critical
- For any communication where consumer skepticism is a known barrier
- For DTC brands competing on trust vs established players

**Recommended for stimulus types**: `product_concept`, `pricing_message`, `brand_message`, `influencer_pitch`, `ad_copy`

**Scale**: 5-point (1 = actively distrusted, 5 = fully trusted)

| Scale Point | Anchor Statement |
|-------------|-----------------|
| **1** | I find this completely unbelievable and it makes me distrust the brand — it feels manipulative or dishonest. |
| **2** | I am skeptical of this — the claims feel exaggerated or the brand feels inauthentic. |
| **3** | I neither trust nor distrust this — it's plausible but I don't have strong confidence in the claims. |
| **4** | I find this credible and believable — the claims feel honest and the brand feels authentic. |
| **5** | I fully trust this — the claims feel completely authentic, honest, and backed by real substance. |

**Design notes**:
- Point 1 includes active distrust AND manipulation perception — the most severe credibility failure.
- Point 2 is skepticism without active hostility — "exaggerated" is the key indicator at this level.
- Point 3 is plausibility without conviction — "it's plausible but I don't have strong confidence" captures the undecided consumer.
- Point 4 vs 5: "credible and believable" vs "backed by real substance." The latter captures the highest tier of trust where the consumer believes the brand could support their claims empirically.
- "Authentic" appears at both points 4 and 5 — authenticity is a necessary but not sufficient condition for full trust (point 5 also requires substance).

---

### Dimension 8: `value_perception`

**What it measures**: Perceived value for money — whether the offering seems worth what it costs. This requires price information to be present or implied in the stimulus. If the stimulus contains no pricing information, this dimension is not appropriate.

**When to use**:
- For pricing communications, promotional offers, or value propositions
- For product concept tests that include price points
- For comparing value propositions across alternatives
- For retail contexts where price-to-quality ratio is a key purchase driver
- **Only use when**: the stimulus explicitly mentions price, or the product category has well-known price conventions

**Not appropriate for**: pure brand image campaigns, teaser ads without offers, or communications that do not reference price or value

**Recommended for stimulus types**: `pricing_message`, `product_concept` (when price is specified), `ad_copy` (when promotional)

**Scale**: 5-point (1 = terrible value / way overpriced, 5 = exceptional value)

| Scale Point | Anchor Statement |
|-------------|-----------------|
| **1** | This seems like terrible value — the price is way too high for what's being offered. |
| **2** | This seems somewhat overpriced — I don't think it's worth what they're asking. |
| **3** | The value seems fair — the price is about what I'd expect for what's being offered. |
| **4** | This seems like good value — I'm getting more than I'd expect for the price. |
| **5** | This seems like exceptional value — the offer is clearly worth every peso and then some. |

**Design notes**:
- "Every peso" in point 5 is Philippines-specific. **Implementation note**: Consider parameterizing the currency if the panel is international, or use "every cent" as a globally understood idiom. Current implementation uses "every peso" because the initial use case is Filipino consumer panels. Future improvement: substitute currency based on panel location.
- Points 3–4 differ by expectation: point 3 is "about what I'd expect" (fair but not impressive), point 4 is "more than I'd expect" (positive surprise).
- Point 5 adds "and then some" — the idiom conveys value that exceeds expectations by a large margin.
- For cross-geographic panels: "peso" should be replaced with the relevant currency or a currency-neutral phrase like "every coin spent."

---

### Dimension 9: `share_worthiness`

**What it measures**: The likelihood that a persona would voluntarily share this stimulus with others — friends, family, or their social network. This is a social transmission measure — does this content have organic spread potential?

**When to use**:
- For social media content and social captions
- For viral campaign concepts
- For influencer content designed to be shared by the influencer's audience
- For any content where earned media and word-of-mouth are performance goals
- **Not recommended for**: paid media campaigns where CPM/CPC is the KPI and organic sharing is not expected

**Recommended for stimulus types**: `social_caption`, `campaign_theme`, `influencer_pitch`, `ad_copy` (for viral potential)

**Scale**: 5-point (1 = would not share, 5 = would share immediately and widely)

| Scale Point | Anchor Statement |
|-------------|-----------------|
| **1** | I would not share this with anyone — it's not interesting or relevant enough for me to pass on. |
| **2** | I'm unlikely to share this — it's not compelling enough to send to my friends or family. |
| **3** | I might share this with one or two people in specific situations, but not broadly. |
| **4** | I would share this with friends or family — it's something they'd find useful or interesting. |
| **5** | I would immediately share this widely — it's exactly the kind of content I love to pass on. |

**Design notes**:
- Point 3 captures the "narrow sharing" case — content someone might forward to one specific person ("my sister would like this") but wouldn't broadcast.
- Points 4–5 differ by breadth ("friends or family" as a group vs "widely") AND urgency ("immediately" at point 5).
- "Exactly the kind of content I love to pass on" at point 5 captures the shareability driver — the content fits the persona's existing sharing identity and habits.
- Point 2 is more conservative than point 3: "not compelling enough" implies a general quality judgment, while point 3 implies "conditionally shareable."

---

### Dimension 10: `overall_appeal`

**What it measures**: Holistic attractiveness of the stimulus as a whole. This is a gestalt measure — the overall impression, combining aesthetics, relevance, clarity, emotion, and any other factors the persona considers important. It is the most general dimension and appropriate as a summary measure when specific dimensions are not needed.

**When to use**:
- Always include as a summary/synthesis dimension when running multiple specific dimensions
- For quick panels where only one or two dimensions can be evaluated
- As a tie-breaker when comparing two executions with similar scores on specific dimensions
- For initial screening of multiple creative options before deeper testing
- **Default dimension**: `overall_appeal` is always included in `PanelRunInput.evaluation_dimensions` default (`["purchase_intent", "overall_appeal"]`)

**Recommended for stimulus types**: All stimulus types (universal)

**Scale**: 5-point (1 = deeply unappealing, 5 = highly appealing)

| Scale Point | Anchor Statement |
|-------------|-----------------|
| **1** | This is deeply unappealing — I have a strong negative reaction to the overall execution. |
| **2** | This doesn't appeal to me — the overall impression is weak or off-putting. |
| **3** | This is neither appealing nor unappealing — it's average and leaves no strong impression. |
| **4** | This appeals to me — the overall execution is strong and leaves a positive impression. |
| **5** | This is highly appealing — the overall execution is excellent and I have a very strong positive reaction. |

**Design notes**:
- This dimension intentionally uses vague language ("overall execution", "impression") because it is a gestalt measure. Specific vocabulary would anchor it to a particular sub-dimension.
- Point 1 uses "deeply" and "strong negative reaction" — the intensity distinguishes it from mere weak appeal (point 2).
- Point 3 is a textbook neutral: "neither appealing nor unappealing" is symmetrically poised. "Leaves no strong impression" reinforces the flatness.
- Points 4–5 differ by "strong" at point 5 — "very strong positive reaction" vs simply "positive impression."
- `overall_appeal` correlates with all other dimensions but is not derivable from them — it is a distinct, holistic judgment.

---

## Dimension-Stimulus Recommendation Matrix

For each stimulus type, the recommended evaluation dimensions are listed in priority order. The first two are the most commonly selected; add more for deeper research.

| Stimulus Type | Tier 1 (Essential) | Tier 2 (Highly Recommended) | Tier 3 (Optional Depth) |
|---------------|-------------------|---------------------------|------------------------|
| `ad_copy` | `purchase_intent`, `overall_appeal` | `emotional_response`, `message_clarity` | `brand_favorability`, `uniqueness`, `trust_credibility` |
| `headline` | `message_clarity`, `overall_appeal` | `purchase_intent`, `emotional_response` | `uniqueness`, `brand_favorability` |
| `tagline` | `brand_favorability`, `overall_appeal` | `emotional_response`, `uniqueness` | `message_clarity`, `trust_credibility` |
| `product_concept` | `purchase_intent`, `personal_relevance` | `value_perception`, `uniqueness` | `trust_credibility`, `overall_appeal` |
| `brand_message` | `brand_favorability`, `trust_credibility` | `emotional_response`, `personal_relevance` | `uniqueness`, `overall_appeal` |
| `campaign_theme` | `emotional_response`, `overall_appeal` | `uniqueness`, `brand_favorability` | `share_worthiness`, `personal_relevance` |
| `influencer_pitch` | `personal_relevance`, `trust_credibility` | `emotional_response`, `brand_favorability` | `share_worthiness`, `overall_appeal` |
| `pricing_message` | `value_perception`, `purchase_intent` | `trust_credibility`, `emotional_response` | `overall_appeal` |
| `packaging_description` | `overall_appeal`, `purchase_intent` | `message_clarity`, `uniqueness` | `emotional_response`, `brand_favorability` |
| `social_caption` | `share_worthiness`, `emotional_response` | `personal_relevance`, `overall_appeal` | `brand_favorability`, `uniqueness` |

**Implementation note**: The Daimon tool does not enforce this matrix. Users can combine any dimensions. This table is for the Discord bot's `ssr_panel_run` guidance text — the bot should suggest relevant dimensions based on the detected stimulus type.

---

## Complete Anchor Statement Reference Table

All 50 anchor statements in a single table for quick cross-reference. These are the exact strings stored in `ssr_anchor_set.anchor_text` by the migration.

| Dimension | Scale Point | Anchor Text |
|-----------|-------------|-------------|
| `purchase_intent` | 1 | I would not buy this under any circumstances and would actively avoid it. |
| `purchase_intent` | 2 | I am unlikely to buy this — it does not appeal to me enough to spend my money. |
| `purchase_intent` | 3 | I might consider buying this if the conditions were right, but I'm not drawn to it strongly. |
| `purchase_intent` | 4 | I would probably buy this — it appeals to me and I could see myself picking it up. |
| `purchase_intent` | 5 | I would definitely buy this and would look for it the next time I shop. |
| `brand_favorability` | 1 | This makes me think worse of the brand — it feels off-putting or inconsistent with what I expect. |
| `brand_favorability` | 2 | This does not improve my impression of the brand — I feel indifferent or slightly negative. |
| `brand_favorability` | 3 | This does not change how I feel about the brand — my impression is the same as before. |
| `brand_favorability` | 4 | This gives me a better impression of the brand — it feels authentic and aligned with my values. |
| `brand_favorability` | 5 | This makes me think much more highly of the brand — I feel genuinely positive and more loyal. |
| `message_clarity` | 1 | I have no idea what this is trying to say — the message is completely unclear or confusing. |
| `message_clarity` | 2 | The message is somewhat unclear — I had to work to understand what they're trying to communicate. |
| `message_clarity` | 3 | I understand what this is saying, but it took me a moment — the communication is average. |
| `message_clarity` | 4 | The message is clear and easy to follow — I understood immediately what they were communicating. |
| `message_clarity` | 5 | The message is crystal clear and instantly understood — exactly what they wanted to communicate came through perfectly. |
| `emotional_response` | 1 | This leaves me completely cold — I feel nothing positive and may even feel annoyed or repelled. |
| `emotional_response` | 2 | This generates very little emotional response in me — it fails to connect or engage emotionally. |
| `emotional_response` | 3 | This produces a mild emotional response — I feel slightly interested or mildly positive but not moved. |
| `emotional_response` | 4 | This genuinely engages me emotionally — I feel something real like warmth, excitement, or nostalgia. |
| `emotional_response` | 5 | This moves me deeply — I feel strong positive emotions like joy, inspiration, or heartfelt connection. |
| `personal_relevance` | 1 | This has absolutely nothing to do with my life — it speaks to someone completely different from me. |
| `personal_relevance` | 2 | This doesn't really speak to me — it's for someone with a very different lifestyle or situation. |
| `personal_relevance` | 3 | This is somewhat relevant to my life — I can see how it might apply, though it's not specifically for me. |
| `personal_relevance` | 4 | This speaks directly to my life — it addresses something I actually think about or deal with. |
| `personal_relevance` | 5 | This feels made exactly for me — it addresses my specific situation, needs, and values precisely. |
| `uniqueness` | 1 | This feels completely generic — I've seen exactly this before from many other brands and nothing stands out. |
| `uniqueness` | 2 | This is mostly familiar — there are small differences but nothing that really makes it stand apart. |
| `uniqueness` | 3 | This is somewhat distinctive — there are elements that differ from what I usually see, though not dramatically. |
| `uniqueness` | 4 | This stands out from the competition — there is something genuinely different and memorable about it. |
| `uniqueness` | 5 | This is completely fresh and distinctive — I've never seen anything quite like it and it truly stands apart. |
| `trust_credibility` | 1 | I find this completely unbelievable and it makes me distrust the brand — it feels manipulative or dishonest. |
| `trust_credibility` | 2 | I am skeptical of this — the claims feel exaggerated or the brand feels inauthentic. |
| `trust_credibility` | 3 | I neither trust nor distrust this — it's plausible but I don't have strong confidence in the claims. |
| `trust_credibility` | 4 | I find this credible and believable — the claims feel honest and the brand feels authentic. |
| `trust_credibility` | 5 | I fully trust this — the claims feel completely authentic, honest, and backed by real substance. |
| `value_perception` | 1 | This seems like terrible value — the price is way too high for what's being offered. |
| `value_perception` | 2 | This seems somewhat overpriced — I don't think it's worth what they're asking. |
| `value_perception` | 3 | The value seems fair — the price is about what I'd expect for what's being offered. |
| `value_perception` | 4 | This seems like good value — I'm getting more than I'd expect for the price. |
| `value_perception` | 5 | This seems like exceptional value — the offer is clearly worth every peso and then some. |
| `share_worthiness` | 1 | I would not share this with anyone — it's not interesting or relevant enough for me to pass on. |
| `share_worthiness` | 2 | I'm unlikely to share this — it's not compelling enough to send to my friends or family. |
| `share_worthiness` | 3 | I might share this with one or two people in specific situations, but not broadly. |
| `share_worthiness` | 4 | I would share this with friends or family — it's something they'd find useful or interesting. |
| `share_worthiness` | 5 | I would immediately share this widely — it's exactly the kind of content I love to pass on. |
| `overall_appeal` | 1 | This is deeply unappealing — I have a strong negative reaction to the overall execution. |
| `overall_appeal` | 2 | This doesn't appeal to me — the overall impression is weak or off-putting. |
| `overall_appeal` | 3 | This is neither appealing nor unappealing — it's average and leaves no strong impression. |
| `overall_appeal` | 4 | This appeals to me — the overall execution is strong and leaves a positive impression. |
| `overall_appeal` | 5 | This is highly appealing — the overall execution is excellent and I have a very strong positive reaction. |

---

## Anchor Seeding Script

The anchor texts are inserted by the migration with `NULL` embeddings. Before any `ssr_panel_run` call can succeed, a one-time seeding script must embed all 50 anchor statements using `text-embedding-3-small`.

**Script path**: `apps/bot/scripts/seed_anchor_embeddings.py`
**Run command**: `python -m scripts.seed_anchor_embeddings` from `apps/bot/`
**Idempotent**: Yes — rows with existing embeddings are skipped.
**Environment required**: `DATABASE_URL`, `OPENAI_API_KEY`

### Full Script Implementation

```python
#!/usr/bin/env python3
"""scripts/seed_anchor_embeddings.py

Pre-computes and stores embeddings for all anchor statements in ssr_anchor_set.
Run once after migration (and again if anchor_text values are updated).

Usage:
    python -m scripts.seed_anchor_embeddings

Requires environment variables:
    DATABASE_URL   — PostgreSQL connection string (same as bot's DB)
    OPENAI_API_KEY — OpenAI API key with embedding access

Idempotent: skips rows where anchor_embedding IS NOT NULL.
"""
import asyncio
import os
import sys
from typing import NamedTuple

from openai import AsyncOpenAI
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session


EMBEDDING_MODEL = "text-embedding-3-small"
BATCH_SIZE = 100  # OpenAI supports up to 2048; 100 is safe and well within rate limits


class AnchorRow(NamedTuple):
    """Row from ssr_anchor_set with NULL embedding."""
    id: str
    dimension_name: str
    scale_point: int
    anchor_text: str


async def seed_anchor_embeddings() -> None:
    """Load NULL-embedding anchor rows, embed them, and update the database."""
    db_url = os.environ.get("DATABASE_URL")
    openai_api_key = os.environ.get("OPENAI_API_KEY")

    if not db_url:
        print("ERROR: DATABASE_URL environment variable is not set.", file=sys.stderr)
        sys.exit(1)
    if not openai_api_key:
        print("ERROR: OPENAI_API_KEY environment variable is not set.", file=sys.stderr)
        sys.exit(1)

    engine = create_engine(db_url)
    client = AsyncOpenAI(api_key=openai_api_key)

    with Session(engine) as session:
        # Step 1: Load all anchor rows with NULL embeddings
        raw_rows = session.execute(
            text("""
                SELECT id::text, dimension_name, scale_point, anchor_text
                FROM ssr_anchor_set
                WHERE anchor_embedding IS NULL
                ORDER BY dimension_name, scale_point
            """)
        ).fetchall()

        if not raw_rows:
            print("All anchor embeddings already seeded. Nothing to do.")
            return

        rows = [
            AnchorRow(
                id=row[0],
                dimension_name=row[1],
                scale_point=row[2],
                anchor_text=row[3],
            )
            for row in raw_rows
        ]

        print(f"Found {len(rows)} anchor statement(s) with NULL embeddings.")
        print(f"Embedding model: {EMBEDDING_MODEL}")
        print(f"Batch size: {BATCH_SIZE}")
        print()

        total_seeded = 0

        # Step 2: Process in batches
        for batch_start in range(0, len(rows), BATCH_SIZE):
            batch = rows[batch_start:batch_start + BATCH_SIZE]
            batch_end = batch_start + len(batch)

            print(f"Processing batch {batch_start + 1}–{batch_end} of {len(rows)}...")

            texts = [row.anchor_text for row in batch]

            # Step 3: Call OpenAI embedding API (all texts in one call)
            try:
                response = await client.embeddings.create(
                    model=EMBEDDING_MODEL,
                    input=texts,
                    encoding_format="float",
                )
            except Exception as exc:
                print(f"  ERROR: OpenAI API call failed: {exc}", file=sys.stderr)
                sys.exit(1)

            # Sort by index (defensive — OpenAI guarantees order but sort anyway)
            embeddings_sorted = sorted(response.data, key=lambda x: x.index)
            embeddings = [item.embedding for item in embeddings_sorted]

            if len(embeddings) != len(batch):
                print(
                    f"  ERROR: Expected {len(batch)} embeddings, got {len(embeddings)}.",
                    file=sys.stderr,
                )
                sys.exit(1)

            # Step 4: Update each row with its embedding
            for row, embedding in zip(batch, embeddings):
                # psycopg2 adapts Python list[float] to PostgreSQL FLOAT8[] automatically
                session.execute(
                    text("""
                        UPDATE ssr_anchor_set
                        SET anchor_embedding = :embedding
                        WHERE id = :id::uuid
                    """),
                    {
                        "embedding": embedding,  # list[float], 1536 elements
                        "id": row.id,
                    }
                )
                total_seeded += 1

            # Commit after each batch (not each row) for efficiency
            session.commit()

            # Verify: print dimension summary for this batch
            for row in batch:
                print(
                    f"  ✓ {row.dimension_name} [{row.scale_point}] "
                    f"— {row.anchor_text[:60]}{'...' if len(row.anchor_text) > 60 else ''}"
                )

        print()
        print(f"Done. {total_seeded} anchor embedding(s) seeded successfully.")
        print()
        print("Verification: checking all dimensions are fully seeded...")

        # Step 5: Verify all 50 rows have embeddings
        null_count = session.execute(
            text("SELECT COUNT(*) FROM ssr_anchor_set WHERE anchor_embedding IS NULL")
        ).scalar()

        if null_count > 0:
            print(
                f"WARNING: {null_count} anchor row(s) still have NULL embeddings. "
                f"Re-run this script to retry.",
                file=sys.stderr,
            )
            sys.exit(1)

        total_count = session.execute(
            text("SELECT COUNT(*) FROM ssr_anchor_set")
        ).scalar()

        print(f"All {total_count} anchor statements have embeddings. SSR is ready to run.")


if __name__ == "__main__":
    asyncio.run(seed_anchor_embeddings())
```

### When to Re-Run the Seeding Script

| Trigger | Action Required |
|---------|----------------|
| First deployment (after migration) | Run `python -m scripts.seed_anchor_embeddings` |
| New anchor statements added to migration | Re-run script (idempotent — existing embeddings skipped) |
| Anchor text changed for any existing row | Manually set `anchor_embedding = NULL` for affected rows, then re-run |
| Embedding model changed from `text-embedding-3-small` | Drop all anchor embeddings (`UPDATE ssr_anchor_set SET anchor_embedding = NULL`), re-run |
| Database restored from backup | Re-run (embeddings may be outdated or missing) |

### Error Behavior for Missing Embeddings

If `ssr_panel_run` is called when any requested dimension has NULL anchor embeddings, the tool handler raises a `ToolError` with a clear message:

```
ToolError: Missing anchor embeddings for dimensions: ['purchase_intent', 'message_clarity'].
The database has not been seeded yet, or the seeding script failed.
Contact an admin to run: python -m scripts.seed_anchor_embeddings
```

This check happens in `api.py::run_ssr_pipeline()` after loading anchor sets from the DB, before any persona responses are elicited. This prevents partial pipeline execution where responses are generated but cannot be scored.

---

## Semantic Spacing Verification

After seeding, anchor quality can be verified by checking pairwise cosine similarities between adjacent anchors. Healthy anchor sets have a roughly monotonic similarity profile: anchors 1 and 5 should be most dissimilar, anchors 1 and 2 most similar to each other, and so on.

### Expected Pairwise Similarity Profile

For a well-designed 5-point anchor set, adjacent-point similarity (point N vs point N+1) should be in the range [0.7, 0.9], and distal similarity (point 1 vs point 5) should be below 0.7.

If any adjacent pair has cosine similarity > 0.95, the anchors are too similar and may not distinguish well. If any adjacent pair has cosine similarity < 0.5, there may be a topic mismatch within the anchor set.

**Verification query** (run after seeding):

```sql
-- Check: load all anchor embeddings and compute pairwise similarities
-- (Run this in Python using the seeding script's DB connection + numpy)
SELECT dimension_name, scale_point, anchor_text, anchor_embedding IS NOT NULL AS has_embedding
FROM ssr_anchor_set
ORDER BY dimension_name, scale_point;
```

The full pairwise similarity matrix should be computed in Python using `cosine_similarity()` from `api.py`. No SQL-level vector operations are available in the Supabase configuration (pgvector is not installed).

---

## EvaluationDimension Enum — Code Reference

The Python enum for evaluation dimensions is defined in `mcp/tools/ssr/tools.py`:

```python
class EvaluationDimension(str, Enum):
    """Marketing evaluation dimensions supported by the SSR pipeline.

    Each dimension has a corresponding 5-point anchor set in ssr_anchor_set.
    """
    PURCHASE_INTENT    = "purchase_intent"      # Likelihood to buy/acquire
    BRAND_FAVORABILITY = "brand_favorability"   # Brand equity change after exposure
    MESSAGE_CLARITY    = "message_clarity"      # Comprehension and communication efficiency
    EMOTIONAL_RESPONSE = "emotional_response"   # Positive emotional activation strength
    PERSONAL_RELEVANCE = "personal_relevance"   # How specifically relevant to this persona
    UNIQUENESS         = "uniqueness"           # Perceived distinctiveness vs category
    TRUST_CREDIBILITY  = "trust_credibility"    # Believability and authenticity
    VALUE_PERCEPTION   = "value_perception"     # Perceived value for money (price-dependent)
    SHARE_WORTHINESS   = "share_worthiness"     # Likelihood to share with others
    OVERALL_APPEAL     = "overall_appeal"       # Holistic attractiveness (summary dimension)
```

The enum value (lowercase snake_case) is the string stored in:
- `ssr_anchor_set.dimension_name`
- `ssr_score.dimension`
- `ssr_run.evaluation_dimensions[]`
- `PanelRunResult` dimension keys
- `AggregatedDimensionResult.dimension`

All values must match exactly — case-sensitive.

---

## Cross-References

- [scoring-aggregation.md](scoring-aggregation.md) — How anchor embeddings are loaded from DB and used in `score_against_anchors()` (cosine similarity → softmax → weighted score)
- [panel-run.md](../tools/panel-run.md) — `EvaluationDimension` enum definition, `PanelRunInput.evaluation_dimensions` field, anchor loading step in `run_ssr_pipeline()`
- [migration.sql](../data-model/migration.sql) — INSERT statements for all 50 anchor rows (with NULL embeddings)
- [supabase-schema.md](../data-model/supabase-schema.md) — `ssr_anchor_set` table schema, column types, unique constraint, index
- [embedding-options.md](../existing-patterns/embedding-options.md) — `text-embedding-3-small` model selection rationale, `embed_texts()` implementation, OpenAI integration requirements
