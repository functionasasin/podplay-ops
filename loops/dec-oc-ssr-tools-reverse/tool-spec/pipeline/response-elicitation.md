# Response Elicitation — SSR Pipeline Stage 1 (User Prompt)

> Status: Complete (w2-tool-panel-run).
> Cross-references: [panel-run.md](../tools/panel-run.md) · [stimulus-presentation.md](stimulus-presentation.md) · [scoring-aggregation.md](scoring-aggregation.md) · [anchor-statements.md](anchor-statements.md)

---

## Overview

The response elicitation step is the **user turn** of the one Claude call per persona. The system prompt (in [stimulus-presentation.md](stimulus-presentation.md)) has already made Claude inhabit the persona. The user prompt presents the marketing asset and asks for a holistic, naturalistic reaction.

**Key principle**: The user prompt does NOT ask about specific Likert dimensions (purchase intent, brand favorability, etc.). Instead, it asks for an open-ended holistic reaction. The dimensional scores are derived afterward by comparing the response embedding to dimension-specific anchor sets. This is the SSR methodology — elicitation is dimension-agnostic, scoring is dimension-specific.

**Function**: `_build_ssr_user_prompt(stimulus: str, stimulus_type: StimulusType) -> str`
**Location**: `apps/bot/src_v2/mcp/tools/ssr/api.py`
**Role**: `messages[0]["content"]` (user turn) in `client.messages.create()`

---

## 1. User Prompt Template Function: `_build_ssr_user_prompt()`

```python
# In apps/bot/src_v2/mcp/tools/ssr/api.py

# Mapping from StimulusType to the display label used in the prompt
_STIMULUS_LABELS: dict[str, str] = {
    "ad_copy": "advertisement",
    "headline": "advertising headline",
    "tagline": "brand tagline",
    "product_concept": "product concept",
    "brand_message": "brand message",
    "campaign_theme": "campaign theme",
    "influencer_pitch": "influencer content",
    "pricing_message": "pricing offer",
    "packaging_description": "product packaging",
    "social_caption": "social media post",
}

# Mapping from StimulusType to the contextual framing sentence
_STIMULUS_CONTEXT: dict[str, str] = {
    "ad_copy": (
        "Imagine you've just seen this advertisement — on TV, in a magazine, "
        "on a website, or on your phone. You've read it through once."
    ),
    "headline": (
        "Imagine you've just seen this headline — at the top of an advertisement, "
        "on a billboard, or on a brand's social media page. It's the first thing "
        "you noticed."
    ),
    "tagline": (
        "Imagine you've just heard or seen this brand tagline — in an advertisement, "
        "at the bottom of a logo, or at the end of a video. It's a short phrase "
        "that's meant to represent the brand."
    ),
    "product_concept": (
        "Imagine someone has just described this product to you — maybe a friend "
        "told you about it, or you read a brief description online. You haven't "
        "tried it yet, but you have a sense of what it is."
    ),
    "brand_message": (
        "Imagine you've just read this message from a brand — on their website, "
        "in a press release, or in an advertisement. It describes what the brand "
        "stands for."
    ),
    "campaign_theme": (
        "Imagine you've been told about an upcoming advertising campaign — its "
        "central theme, what stories it plans to tell, and what feeling it wants "
        "to create. You haven't seen the full ads yet, but you understand the direction."
    ),
    "influencer_pitch": (
        "Imagine you've just come across this content on social media — from an "
        "influencer or content creator that a brand has partnered with. You've "
        "scrolled past it on your feed."
    ),
    "pricing_message": (
        "Imagine you've just seen this price or offer — on a store shelf, in an "
        "email, on a website, or in an advertisement. You're considering whether "
        "it's worth it."
    ),
    "packaging_description": (
        "Imagine you've just picked up this product from a shelf and are looking "
        "at the packaging. You can see the design, colors, text, and imagery "
        "as described."
    ),
    "social_caption": (
        "Imagine you've just scrolled past this post on Facebook, Instagram, or "
        "TikTok. You've read the caption before deciding whether to stop or keep "
        "scrolling."
    ),
}


def _build_ssr_user_prompt(
    stimulus: str,
    stimulus_type: "StimulusType",
) -> str:
    """Build the user-turn prompt that presents a marketing asset and elicits a response.

    The system prompt (see stimulus-presentation.md) has already made Claude
    inhabit the persona. This user prompt presents the stimulus and asks for a
    holistic, naturalistic reaction that covers all relevant marketing dimensions
    without naming any specific dimension (purchase intent, clarity, etc.).

    The response will be embedded and scored against dimension-specific anchor sets.

    Args:
        stimulus: The full marketing asset text.
        stimulus_type: Category of the marketing asset — determines the framing
            sentence and label used in the prompt.

    Returns:
        User prompt string to send as messages[0]["content"].
    """
    label = _STIMULUS_LABELS[stimulus_type.value]
    context_sentence = _STIMULUS_CONTEXT[stimulus_type.value]

    return f"""Here is a {label} for you to react to:

---
{stimulus}
---

{context_sentence}

Now, as yourself, describe your honest reaction to this {label}. Talk freely — as if you were telling a close friend or family member about something you just saw. Cover whatever feels important to you:

- Your first impression when you saw or heard it
- How it made you feel (curious, excited, skeptical, annoyed, indifferent, nostalgic, etc.)
- Whether this feels relevant to your life and situation right now
- Whether you trust what it's saying
- Whether it would change what you do, buy, or think about the brand
- Anything else you want to say about it

There are no right or wrong reactions. Be as honest and specific as you can. Speak naturally, in your own voice."""
```

---

## 2. Rendered Examples

### Example A: Social Caption, Filipino Moms Panel

**Stimulus type**: `social_caption`
**Stimulus**: `"Ang sarap, tipid pa! Lucky Me na naman kasama ko sa hapag-kainan."`
**Persona**: Maria Santos (see stimulus-presentation.md §2)

Rendered user prompt:

```
Here is a social media post for you to react to:

---
Ang sarap, tipid pa! Lucky Me na naman kasama ko sa hapag-kainan.
---

Imagine you've just scrolled past this post on Facebook, Instagram, or TikTok. You've read the caption before deciding whether to stop or keep scrolling.

Now, as yourself, describe your honest reaction to this social media post. Talk freely — as if you were telling a close friend or family member about something you just saw. Cover whatever feels important to you:

- Your first impression when you saw or heard it
- How it made you feel (curious, excited, skeptical, annoyed, indifferent, nostalgic, etc.)
- Whether this feels relevant to your life and situation right now
- Whether you trust what it's saying
- Whether it would change what you do, buy, or think about the brand
- Anything else you want to say about it

There are no right or wrong reactions. Be as honest and specific as you can. Speak naturally, in your own voice.
```

**Expected response from Maria Santos** (what Claude Haiku would produce):

```
Eto na naman! Totoo 'to — parang nakaka-relate talaga ako sa caption na ito.
Lucky Me is always on our table, especially those weeks when the budget is
tight and I need to stretch the grocery money. "Kasama ko sa hapag-kainan"
really lands — it's not just noodles, it's part of how I feed my family without
going into debt.

I felt a little smile when I saw it, honestly. It reminded me of those Friday
nights when the kids are tired from school and I just need to put something
warm on the table fast. No fuss. Lucky Me is that for us.

I trust it because it's not pretending to be something it's not. It's not saying
Lucky Me is gourmet — it's saying it's masarap and tipid, which is the truth.
I appreciate that. Some ads try too hard and it feels fake. This one just feels
like a real person talking.

Would I do anything differently because of this? Probably not — I already buy
Lucky Me every week. But it does make me feel good about my choice, like the
brand understands people like me. I might like or share the post, actually, if
my Facebook friends would appreciate it. My sister-in-law in Bulacan definitely
would.
```

---

### Example B: Product Concept, Gen Z Gamers Panel

**Stimulus type**: `product_concept`
**Stimulus**: `"Gamer Fuel Pro: A pre-mixed energy drink designed specifically for long gaming sessions. Contains 150mg caffeine, B-vitamins, and beta-alanine for sustained focus without the crash. Available in Mountain Mango and Electric Citrus flavors. ₱75 per 250ml can."`

Rendered user prompt:

```
Here is a product concept for you to react to:

---
Gamer Fuel Pro: A pre-mixed energy drink designed specifically for long gaming sessions. Contains 150mg caffeine, B-vitamins, and beta-alanine for sustained focus without the crash. Available in Mountain Mango and Electric Citrus flavors. ₱75 per 250ml can.
---

Imagine someone has just described this product to you — maybe a friend told you about it, or you read a brief description online. You haven't tried it yet, but you have a sense of what it is.

Now, as yourself, describe your honest reaction to this product concept. Talk freely — as if you were telling a close friend or family member about something you just saw. Cover whatever feels important to you:

- Your first impression when you saw or heard it
- How it made you feel (curious, excited, skeptical, annoyed, indifferent, nostalgic, etc.)
- Whether this feels relevant to your life and situation right now
- Whether you trust what it's saying
- Whether it would change what you do, buy, or think about the brand
- Anything else you want to say about it

There are no right or wrong reactions. Be as honest and specific as you can. Speak naturally, in your own voice.
```

**Expected response from a Gen Z gamer persona** (what Claude Haiku would produce for a persona like "Marco Reyes, 20, college student and competitive mobile gamer, Makati"):

```
Okay so — Gamer Fuel Pro. I've seen a lot of "gaming energy drinks" and 95%
of them are just Monster or Red Bull rebranded with an RGB controller on the
can. But 150mg caffeine plus beta-alanine? That's actually an ingredient stack
I recognize from legit pre-workout supplements. Not just marketing fluff.

Beta-alanine gives you that tingling focus, no crash — I know this because
I've used pre-workout before a gym session. If it actually works the same
for 4-hour gaming sessions, that's genuinely interesting to me. I lose
focus hard around hour 3 of ranked and usually just slam another Cobra,
which wrecks my sleep.

The price is the thing. ₱75 for a 250ml can is not cheap. That's almost
double what I pay for a Cobra or Sting. I'd need to be convinced it lasts
longer and actually delivers before I switch. I'd probably buy one can to
test it — Mountain Mango sounds kind of generic, Electric Citrus sounds
better honestly, more of a gaming energy flavor.

Do I trust the "no crash" claim? Skeptical. Every energy drink says that.
I'd go to Reddit r/GamingEnergy (or the local Filipino gaming discord) to
see if actual players rate it before I commit to buying a case. If the
community is positive and I try one can and the focus is real, yeah, I'd
probably make this my regular. I'm the guy in my squad who everyone hits
up for gear recommendations so if this works I'd spread the word.
```

---

### Example C: Advertising Headline, Professional Women Panel

**Stimulus type**: `headline`
**Stimulus**: `"Your Morning. Your Rules."`

Rendered user prompt:

```
Here is an advertising headline for you to react to:

---
Your Morning. Your Rules.
---

Imagine you've just seen this headline — at the top of an advertisement, on a billboard, or on a brand's social media page. It's the first thing you noticed.

Now, as yourself, describe your honest reaction to this advertising headline. Talk freely — as if you were telling a close friend or family member about something you just saw. Cover whatever feels important to you:

- Your first impression when you saw or heard it
- How it made you feel (curious, excited, skeptical, annoyed, indifferent, nostalgic, etc.)
- Whether this feels relevant to your life and situation right now
- Whether you trust what it's saying
- Whether it would change what you do, buy, or think about the brand
- Anything else you want to say about it

There are no right or wrong reactions. Be as honest and specific as you can. Speak naturally, in your own voice.
```

**Expected response from a professional woman persona** (what Claude Haiku would produce for a persona like "Danielle Ortega, 34, senior marketing manager, Bonifacio Global City, BGC condo-dweller, fitness enthusiast"):

```
"Your Morning. Your Rules." — I actually stopped and read it again. That's
a good sign for a headline.

First instinct: I don't know what this is selling yet, and that's a little
bit of a problem. Coffee? A scheduling app? Athletic wear? Meal delivery?
The headline works for too many categories at once. Without the visual or
the brand name, I'm reading it in a vacuum. That said, the ambiguity might
be intentional — get the attention first, reveal the product second.

What I do feel is a quiet resonance. My mornings are genuinely the one part
of my day I control completely. I'm up at 5:45, gym by 6:15, back home
by 7:30, coffee before the Slack messages start. That window is mine. So
"Your Morning. Your Rules." lands emotionally for me — it names something
I actually value.

My eye-roll instinct is also present, I won't lie. There's a whole wave
of "you do you" female empowerment marketing right now and it can feel
hollow — like a brand discovered that autonomy language sells to women
and is using it without meaning it. If this turns out to be for, I don't
know, a yogurt brand or a banking app, the empowerment framing will feel
grafted on. If it's for something that genuinely helps me own my morning —
a premium coffee, a fitness product, a wellness tracker — then it earns it.

I wouldn't act on this headline alone. I'd need the full ad to form an
opinion. But as a headline, it passes the first test: I remembered it.
```

---

## 3. Response Quality Notes

### What Good Responses Look Like

Good SSR elicitation responses:
- **Specific**: Reference the persona's actual circumstances ("those weeks when the budget is tight")
- **First-person**: "I felt", "I trust", "I would", "My family"
- **Multi-dimensional**: Cover emotional reaction, relevance, credibility, and behavioral intent without being asked about them directly
- **Authentic voice**: Match the persona's described communication style (formal vs. casual, Tagalog code-switching, analytical vs. emotional)
- **Concrete behavioral intent**: Not just "I like it" but "I might share the post" or "I already buy this every week"
- **Honest about negatives**: Personas should voice skepticism, indifference, or objections when they have them

### What Bad Responses Look Like (Failure Modes)

The system prompt guards against these, but they can still occur:
- **Generic**: "This product seems nice and I might consider trying it" — no personal specificity
- **Numeric ratings**: "I'd give this a 4/5" — directly contradicts the instructions
- **Third-person**: "Maria Santos would probably appreciate this" — breaks character
- **Diplomatic padding**: "I think this could appeal to many people, though it may not be for everyone" — avoids taking a position
- **Stepping outside character**: "As a language model, I should note..." — system prompt should prevent this

### Why Open-Ended Elicitation Works for Multi-Dimensional Scoring

The user prompt explicitly invites the persona to cover multiple dimensions without naming any:

| Elicitation bullet | Dimension(s) captured |
|-------------------|----------------------|
| "Your first impression" | `overall_appeal`, `emotional_response`, `message_clarity` |
| "How it made you feel" | `emotional_response`, `brand_favorability` |
| "Whether this feels relevant to your life" | `personal_relevance` |
| "Whether you trust what it's saying" | `trust_credibility` |
| "Whether it would change what you do, buy, or think" | `purchase_intent`, `brand_favorability` |
| "Anything else you want to say" | `uniqueness`, `value_perception`, `share_worthiness` |

The embedded response captures the semantic content from all these angles. Different anchor sets then extract the signal most relevant to each evaluation dimension via cosine similarity.

---

## 4. Token Estimate for User Prompt

| Component | Estimated Tokens |
|-----------|-----------------|
| "Here is a {label} for you to react to:" | ~10 tokens |
| "---" separators (×2) | ~4 tokens |
| Stimulus text (varies by asset) | ~20–300 tokens |
| Context sentence (varies by type) | ~30–50 tokens |
| "Now, as yourself, describe..." | ~15 tokens |
| Bullet list (6 items) | ~95 tokens |
| "There are no right or wrong..." | ~20 tokens |
| **Total user prompt** | **~200–500 tokens** |

Combined with the system prompt (~770–900 tokens), total input per persona is approximately **970–1,400 tokens**.

### Per-Persona Claude Haiku Cost (updated estimate)

```
Input tokens: ~1,150 avg (system ~840 + user ~310)
Output tokens: ~350 avg (response text)

Input cost:  1,150 × $0.80 / 1,000,000 = $0.00092
Output cost:  350 × $4.00 / 1,000,000 = $0.00140
Total per persona:                        $0.00232
Rounded up for safety: $0.003/persona (matches existing estimate in panel-create.md)
```

---

## 5. Response Length Targeting

The `_ELICITATION_MAX_TOKENS = 450` limit (set in `panel-run.md` §6) targets responses of approximately **300–400 tokens**. This is long enough to:
- Cover multiple evaluation dimensions in one response
- Include specific personal details and emotional content
- Produce a rich embedding that captures the semantic position across anchor spaces

It is short enough to:
- Prevent runaway verbosity (Claude can generate very long responses if unconstrained)
- Control cost (each additional 100 output tokens = $0.0004/persona)
- Keep embedding quality high (shorter, focused texts embed more cleanly than 1,000-word essays)

---

## 6. Multilingual Response Handling

### The Challenge

Personas for Filipino, Latin American, or other non-English-dominant markets are designed with `VOICE` fields that explicitly include code-switching or local expressions. When the system prompt instructs Maria Santos to "use code-switching or local expressions", Claude Haiku may produce responses mixing Tagalog and English — as shown in Example A above ("Eto na naman! Totoo 'to — parang nakaka-relate talaga ako").

This raises the question: **does the SSR scoring methodology hold when responses contain non-English text?**

### Answer: Yes — `text-embedding-3-small` Is Multilingual

`text-embedding-3-small` is trained on multilingual data across 100+ languages and produces cross-lingually aligned embeddings. This means:

1. **Semantic equivalence across languages**: The embedding for "I would definitely buy this" and "Bibilhin ko talaga ito" land in nearby vector positions in the 1536-dim embedding space.

2. **Anchor statements don't need translation**: The anchor statements (all in English) can be compared to mixed-language responses via cosine similarity without accuracy loss. The model's training aligns English semantic content with Filipino, Spanish, French, Japanese, etc. content.

3. **Code-switching is handled naturally**: A response mixing English and Tagalog in the same paragraph is not degraded — the model processes the full text holistically rather than per-language.

### Empirical Caveat

Cross-lingual embedding alignment is not perfect for all language pairs. For the primary target markets (Philippines, Singapore, Malaysia, Latin America), `text-embedding-3-small` performs well. For languages with lower representation in OpenAI's training data (e.g., Cebuano or Ilocano regional dialects), alignment quality may be lower.

**Mitigation**: The system prompt instruction "speak the way {persona.name} would speak" combined with the research context paragraph tends to produce responses in the persona's dominant written language (English or English-Filipino code-switching), not purely in local dialects. This is realistic — most Filipino urban consumers engage with marketing research in English or Taglish, not pure Cebuano or Ilocano.

### English-Language Anchor Statements — A Design Decision

The anchor statements (see [anchor-statements.md](anchor-statements.md)) are written in English for all dimensions. This is deliberate:

- Anchor embeddings serve as **fixed reference points** in the semantic space.
- All persona responses are mapped to this fixed reference via cosine similarity.
- If anchor statements were in different languages for different panels, comparisons across panels would be invalid.
- English-language anchors provide a consistent reference frame for all panels regardless of consumer market.

### Implementation Note

No code changes are required to support multilingual panels. The embedding model handles it transparently. Do not filter or normalize non-English characters from response text before embedding:

```python
# CORRECT: Pass raw response text with any language content
response_embeddings = await embed_texts(openai_client, [pr.response_text for pr in persona_responses])

# WRONG: Do not pre-process or ASCII-ify text — this destroys semantic content
response_embeddings = await embed_texts(openai_client, [pr.response_text.encode("ascii", "ignore").decode() for pr in persona_responses])
```

---

## 7. Break-Character Detection

### What It Means

"Breaking character" occurs when Claude steps outside the persona role and responds as a language model rather than as the synthetic consumer. Examples:

```
# Break-character example 1: Meta-commentary
"As an AI language model, I should note that I don't have personal experiences
with products. However, as the persona Maria Santos, I would react to this
advertisement by..."

# Break-character example 2: Fourth-wall break
"Maria Santos would likely respond positively to this advertisement given
her profile values of family security and practicality..."
```

### Why It Happens

Break-character responses occur when:
1. The stimulus contains content that triggers Claude's safety filters (tobacco ads, alcohol ads targeting apparent minors, certain political messaging)
2. The stimulus is ambiguous enough that Claude isn't sure how to proceed as the persona
3. Claude's instruction-following for persona inhabitation is outweighed by a safety concern

### Detection Heuristic

`_elicit_persona_response()` applies a simple break-character check on the response text before storing it:

```python
# In apps/bot/src_v2/mcp/tools/ssr/api.py

_BREAK_CHARACTER_MARKERS: list[str] = [
    "as an ai",
    "as a language model",
    "i'm an ai",
    "i am an ai",
    "i don't have personal",
    "i cannot experience",
    "as the persona",
    "the persona would",
]


def _is_break_character(response_text: str, persona_name: str) -> bool:
    """Detect if a persona response has broken character.

    Checks for markers indicating Claude has stepped outside the persona role.
    This is a heuristic — not exhaustive. False negatives (subtle breaks) are
    acceptable; false positives (flagging valid responses) are worse.

    Args:
        response_text: The full response text from Claude Haiku.
        persona_name: The persona's full name (e.g., "Maria Santos").

    Returns:
        True if the response appears to break character; False otherwise.
    """
    lower = response_text.lower()

    # Check fixed markers
    for marker in _BREAK_CHARACTER_MARKERS:
        if marker in lower:
            return True

    # Check third-person self-reference: "Maria Santos would..." or "Santos would..."
    # Third-person self-reference indicates Claude is narrating the persona rather than being them
    name_parts = persona_name.lower().split()
    for part in name_parts:
        if len(part) > 3 and f"{part} would" in lower:
            return True

    return False
```

### Handling Break-Character Responses

When `_is_break_character()` returns `True`:

1. The response is **discarded** — not stored in `ssr_response`, not scored
2. The persona is counted as a **failure** in the run results (`personas_failed` counter)
3. No retry is attempted — a second call with the same prompt would likely produce the same result if safety-triggered

If more than 30% of personas break character for a given stimulus, `ssr_panel_run` returns a warning in the tool output:

```xml
<warning>
{n} of {total} personas broke character when evaluating this stimulus.
Results are based on {scored} personas and may not be representative.
This can happen when the stimulus content triggers model safety filters.
Consider revising the stimulus or using a different stimulus type.
</warning>
```

---

## 8. Cross-References

- [stimulus-presentation.md](stimulus-presentation.md) — The system prompt that precedes this user prompt in the same Claude call
- [panel-run.md](../tools/panel-run.md) — `_elicit_persona_response()`: assembles both prompts and calls Claude
- [scoring-aggregation.md](scoring-aggregation.md) — What happens to the response text immediately after this call
- [anchor-statements.md](anchor-statements.md) — The 50 anchor statements (10 dimensions × 5 points) used to score the response
- [embedding-options.md](../existing-patterns/embedding-options.md) — How the response text is embedded into a 1536-dim vector
