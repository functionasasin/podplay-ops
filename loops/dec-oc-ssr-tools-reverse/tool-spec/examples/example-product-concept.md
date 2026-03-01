# End-to-End Example: Product Concept Test

> Cross-references: [panel-create.md](../tools/panel-create.md) · [panel-run.md](../tools/panel-run.md) · [panel-results.md](../tools/panel-results.md) · [discord-ux.md](../integration/discord-ux.md) · [anchor-statements.md](../pipeline/anchor-statements.md)

---

## Scenario

A startup founder in Manila has developed a product concept for a plant-based protein bar targeted at health-conscious Filipino millennials. Before investing in formulation and packaging, she wants early consumer signal on purchase intent, value perception, uniqueness, and brand favorability.

**The concept:**
> *A protein bar made from local Philippine ingredients — malunggay (moringa), adlay (Job's tears), and roasted coconut — delivering 15g of plant protein per bar. Priced at ₱75–85 (about $1.30–1.50 USD). Positioned as "Filipino-grown fuel for the modern professional." Packaging is minimal, brown craft paper with earth-tone typography. No artificial colors, no preservatives, no soy.*

---

## Step 1: User Message in Discord

```
@daimon i have a product concept i want to test. plant-based protein bar made from malunggay,
adlay, and coconut. 15g protein, priced at ₱75-85. "Filipino-grown fuel for the modern pro."
test it with health-conscious millennials in Metro Manila — both male and female.
score purchase intent, value perception, uniqueness, and brand favorability.
```

---

## Step 2: Daimon Pre-Tool Acknowledgment

```
On it — building a panel of health-conscious millennials (25–38, Metro Manila, mixed gender)
and running your concept through it. Scoring purchase intent, value perception, uniqueness,
and brand favorability. Generating personas now...
```

---

## Step 3: Tool Call — `ssr_panel_create`

```json
{
  "panel_name": "Metro Manila Health Millennials",
  "demographics": {
    "age_min": 25,
    "age_max": 38,
    "genders": ["male", "female"],
    "locations": ["Metro Manila", "Philippines"],
    "income_brackets": ["middle", "upper_middle"],
    "education_levels": ["bachelors", "graduate"],
    "languages": ["English", "Filipino"]
  },
  "psychographics": {
    "interests": ["fitness", "healthy eating", "sustainability", "personal development", "local brands"],
    "values": ["health-consciousness", "sustainability", "Filipino pride", "quality over quantity"],
    "lifestyle_descriptors": ["gym-goer or active lifestyle", "urban professional", "conscious consumer", "food label reader"],
    "media_consumption": ["Instagram fitness content", "nutrition podcasts", "TikTok health trends", "Reddit r/phfitness"]
  },
  "product_category": "health snacks / protein bars / functional food",
  "panel_size": 20,
  "custom_persona_instructions": "Include a mix of gym regulars, casual fitness participants, and health-conscious non-gym-goers. Include some personas who are vegan or plant-based, and some who are not."
}
```

---

## Step 4: Tool Output — `ssr_panel_create`

```xml
<panel-created size="20" requested_size="20" status="ready">
  <panel-id>c2d4f6a8-b0e2-4a6c-8d0e-2f4a6c8d0e2f</panel-id>
  <panel-name>Metro Manila Health Millennials</panel-name>
  <personas total="20">
    <persona index="1" name="Marco Reyes" age="29" location="BGC, Taguig, Metro Manila" occupation="Software Engineer">
      Daily gym-goer. Follows a high-protein diet. Currently buying imported protein bars (Quest, RXBar) at 3–4x the price. Vocal about wanting more Filipino-made health food options.
    </persona>
    <persona index="2" name="Jessa Tan" age="32" location="Makati, Metro Manila" occupation="Marketing Manager">
      Plant-based for 2 years. Frustrated by the lack of convenient Filipino plant protein options. Active Instagram user — shares healthy food content. Brand aesthetics matter deeply to her.
    </persona>
    <persona index="3" name="Paolo Villanueva" age="26" location="Quezon City, Metro Manila" occupation="Graphic Designer (Freelance)">
      Fitness hobbyist — gym 3x/week. Interested in nutrition but budget-sensitive. ₱75–85 is above his usual snack budget. Would need a strong reason to buy at that price.
    </persona>
    <persona index="4" name="Bianca Lim" age="35" location="Pasig, Metro Manila" occupation="Nurse (Private Hospital)">
      Health-aware, not a gym regular. Looks for convenient, nutritious snacks for long shifts. Curious about moringa-based products — familiar with malunggay from home cooking.
    </persona>
    <persona index="5" name="Adrian Santos" age="28" location="Mandaluyong, Metro Manila" occupation="BPO Team Lead">
      Night-shift worker. Relies on snacks during long shifts. Has tried plant-based diets but lapsed. Cares about ingredient quality. Skeptical about protein content claims.
    </persona>
    <persona index="6" name="Katrina Bautista" age="30" location="San Juan, Metro Manila" occupation="Teacher (International School)">
      Vegetarian. Actively searches for plant protein snacks. Would pay premium for clean ingredients. Values environmental sustainability and local sourcing. Heavily influenced by Instagram.
    </persona>
    <persona index="7" name="Luis Garcia" age="34" location="Eastwood, Quezon City" occupation="Architect">
      Casual fitness person — yoga 2x/week. Interested in Filipino ingredient-based products. Aesthetics are a strong purchase driver for him. Values minimal, clean packaging.
    </persona>
    <persona index="8" name="Nicole Cruz" age="27" location="Alabang, Muntinlupa" occupation="Financial Analyst">
      Runs 5k three times a week. Budget is not a concern at this income level. Currently buying protein bars from importers — finds it inconvenient. Open to locally-made if quality is proven.
    </persona>
    <persona index="9" name="Mikael Gomez" age="31" location="Ortigas, Pasig" occupation="Account Manager">
      Omnivore who eats healthily but without strict dietary rules. Would try a protein bar if it tasted good. Skeptical about "Filipino-grown" as a primary positioning angle — needs taste/nutrition first.
    </persona>
    <persona index="10" name="Tricia Dela Cruz" age="36" location="Marikina, Metro Manila" occupation="Pediatrician">
      Health-maximizing but time-poor. A grab-and-go high-protein snack at a reasonable price is exactly what she needs. Would look up clinical evidence on moringa protein before buying.
    </persona>
    <persona index="11" name="Sean Navarro" age="25" location="Tondo, Manila" occupation="Nursing Student">
      Student budget — ₱75 feels expensive for a snack bar. Interested in the concept intellectually. Would buy occasionally as a treat but not a regular purchase at this price.
    </persona>
    <persona index="12" name="Camille Torres" age="33" location="BGC, Taguig" occupation="Product Manager (Tech)">
      Health-optimizing, data-driven. Reads nutrition labels carefully. Malunggay protein quality (amino acid profile) matters — would research before buying. Willing to pay premium if data supports it.
    </persona>
    <persona index="13" name="Aaron Mendoza" age="38" location="Quezon City, Metro Manila" occupation="NGO Program Officer">
      Environmentally conscious. Vegan for 3 years. Would strongly prefer a locally-sourced Filipino plant-based product. Price-sensitive relative to his salary but willing to budget for aligned products.
    </persona>
    <persona index="14" name="Isabel Fontanilla" age="29" location="Parañaque, Metro Manila" occupation="Flight Attendant">
      Active lifestyle — layover gym routines. Currently eats imported protein bars. Strong aesthetic preferences — packaging must be travel-bag friendly and Instagram-worthy.
    </persona>
    <persona index="15" name="Dennis Aguilar" age="37" location="Pasay, Metro Manila" occupation="Police Officer">
      Active physical work. Not a gym-goer in the traditional sense but physically active. Not familiar with plant-based protein. Would evaluate purely on taste and price.
    </persona>
    <persona index="16" name="Rhea Morales" age="26" location="San Mateo, Rizal" occupation="Social Media Manager">
      Health-influencer-adjacent — shares food content. Values unique, photogenic products. Plant-based Filipino ingredients is a compelling story for content creation. Would buy to try and post.
    </persona>
    <persona index="17" name="Carlo Pascual" age="32" location="Makati, Metro Manila" occupation="Investment Analyst">
      Gym 4x/week, high protein intake. Would benchmark this against whey-based bars. Skeptical about plant protein completeness (amino profile) — would need to see the label data.
    </persona>
    <persona index="18" name="Gina Tolentino" age="34" location="Caloocan, Metro Manila" occupation="Public Health Worker">
      Familiar with moringa's nutritional properties. Interested in affordable local health foods. ₱75–85 feels slightly high but acceptable if quality justifies it.
    </persona>
    <persona index="19" name="Renzo Ferrer" age="27" location="Novaliches, Quezon City" occupation="Gym Instructor">
      Fitness professional — sells protein products to clients. Evaluates based on protein density and taste. Would recommend to clients if product performs. Local angle is a plus.
    </persona>
    <persona index="20" name="Sophia Enriquez" age="35" location="Rockwell, Makati" occupation="Startup Founder">
      Highly health-optimizing, time-scarce. Would pay ₱100+ if the product is clean and convenient. Moringa + adlay + coconut is a compelling and differentiated combination to her.
    </persona>
  </personas>
  <estimated-run-cost-usd>0.0600</estimated-run-cost-usd>
  <hint>Panel 'c2d4f6a8-b0e2-4a6c-8d0e-2f4a6c8d0e2f' is ready with 20 personas. Use ssr_panel_run with panel_id='c2d4f6a8-b0e2-4a6c-8d0e-2f4a6c8d0e2f' to test a marketing asset.</hint>
</panel-created>
```

---

## Step 5: Daimon Interstitial Message

```
Panel ready — 20 Metro Manila health millennials, mix of gym regulars, casual fitness,
and plant-based. Running your concept now... (~60s)
```

---

## Step 6: Tool Call — `ssr_panel_run`

```json
{
  "panel_id": "c2d4f6a8-b0e2-4a6c-8d0e-2f4a6c8d0e2f",
  "stimulus_type": "product_concept",
  "stimulus_text": "A protein bar made from local Philippine ingredients — malunggay (moringa), adlay (Job's tears), and roasted coconut — delivering 15g of plant protein per bar. Priced at ₱75–85 (about $1.30–1.50 USD). Positioned as 'Filipino-grown fuel for the modern professional.' Packaging is minimal, brown craft paper with earth-tone typography. No artificial colors, no preservatives, no soy.",
  "stimulus_label": "Plant-based Filipino protein bar concept",
  "stimulus_context": "Early-stage product concept seeking initial consumer signal before formulation investment.",
  "evaluation_dimensions": ["purchase_intent", "value_perception", "uniqueness", "brand_favorability"],
  "response_format": "summary"
}
```

---

## Step 7: Tool Output — `ssr_panel_run`

```xml
<panel-run-complete run_id="b3c4d5e6-f7a8-9b0c-1d2e-3f4a5b6c7d8e" panel_id="c2d4f6a8-b0e2-4a6c-8d0e-2f4a6c8d0e2f" personas_scored="20" dimensions="4" status="complete">
  <stimulus type="product_concept" label="Plant-based Filipino protein bar concept">
    A protein bar made from local Philippine ingredients — malunggay (moringa), adlay (Job's tears), and roasted coconut...
  </stimulus>
  <results>
    <dimension name="purchase_intent" mean="3.50" std="1.05" mode="4" ci_low="3.01" ci_high="3.99">
      <distribution>
        <score value="1" count="2"/>
        <score value="2" count="3"/>
        <score value="3" count="5"/>
        <score value="4" count="7"/>
        <score value="5" count="3"/>
      </distribution>
      <highlights>
        <highlight valence="positive" persona="Katrina Bautista">This is exactly what I've been looking for. Plant protein, Filipino ingredients, clean label. I'd buy a box immediately.</highlight>
        <highlight valence="positive" persona="Renzo Ferrer">I'd try this for myself and recommend it to clients if the protein quality holds up. The ingredients are solid — moringa is genuinely nutritious.</highlight>
        <highlight valence="negative" persona="Paolo Villanueva">₱75–85 is too much for me right now. I'd be curious but I'd wait for a promo or smaller size first.</highlight>
        <highlight valence="negative" persona="Dennis Aguilar">I don't really know about plant protein. I just want something that tastes good and fills me up. This doesn't tell me much about the taste.</highlight>
      </highlights>
    </dimension>
    <dimension name="value_perception" mean="3.25" std="1.10" mode="3" ci_low="2.74" ci_high="3.76">
      <distribution>
        <score value="1" count="2"/>
        <score value="2" count="4"/>
        <score value="3" count="7"/>
        <score value="4" count="5"/>
        <score value="5" count="2"/>
      </distribution>
      <highlights>
        <highlight valence="positive" persona="Sophia Enriquez">₱75–85 for 15g plant protein with a clean local ingredient story is very reasonable. I'd pay more actually.</highlight>
        <highlight valence="positive" persona="Gina Tolentino">Price seems fair for what it is. Local sourcing usually means lower logistics cost, so I'd hope to see the price stay stable.</highlight>
        <highlight valence="negative" persona="Sean Navarro">₱85 is a lot for a snack bar as a student. I'd only buy it maybe once a month as a treat.</highlight>
        <highlight valence="negative" persona="Adrian Santos">I can get a banana and a hard-boiled egg for ₱30. The price has to be justified by taste or convenience that I can really feel.</highlight>
      </highlights>
    </dimension>
    <dimension name="uniqueness" mean="4.30" std="0.73" mode="5" ci_low="3.96" ci_high="4.64">
      <distribution>
        <score value="1" count="0"/>
        <score value="2" count="1"/>
        <score value="3" count="3"/>
        <score value="4" count="8"/>
        <score value="5" count="8"/>
      </distribution>
      <highlights>
        <highlight valence="positive" persona="Jessa Tan">I've never seen malunggay + adlay as a protein bar. This is genuinely different from anything I've seen locally or imported.</highlight>
        <highlight valence="positive" persona="Rhea Morales">The ingredient combination is so Filipino and so fresh. This is content — I'd photograph this and share it before I even ate it.</highlight>
        <highlight valence="positive" persona="Luis Garcia">Every protein bar I've seen is oat + whey or oat + pea protein. This is something completely different. The local angle is real differentiation.</highlight>
        <highlight valence="negative" persona="Mikael Gomez">Unique yes, but uniqueness alone doesn't make me buy. I need to know it tastes good before uniqueness matters.</highlight>
      </highlights>
    </dimension>
    <dimension name="brand_favorability" mean="4.05" std="0.76" mode="4" ci_low="3.70" ci_high="4.40">
      <distribution>
        <score value="1" count="0"/>
        <score value="2" count="1"/>
        <score value="3" count="4"/>
        <score value="4" count="10"/>
        <score value="5" count="5"/>
      </distribution>
      <highlights>
        <highlight valence="positive" persona="Aaron Mendoza">The positioning is exactly right for someone like me. Filipino-grown, plant-based, no soy, minimal packaging. I want this brand to exist.</highlight>
        <highlight valence="positive" persona="Isabel Fontanilla">The craft paper packaging and earth-tone aesthetic is clean and premium. I'd feel proud carrying this in my gym bag.</highlight>
        <highlight valence="negative" persona="Carlo Pascual">Brand favorability is hard to form from a concept alone. I'd need to see the actual amino acid profile and taste it before forming a real opinion.</highlight>
      </highlights>
    </dimension>
  </results>
  <hint>Run complete. Use ssr_panel_results with run_id='b3c4d5e6-f7a8-9b0c-1d2e-3f4a5b6c7d8e' for detailed results.</hint>
</panel-run-complete>
```

---

## Step 8: Daimon Results Post (Discord Message)

Because the output is 4 dimensions in summary format (~1,600 chars), it's slightly above the safe single-message threshold. The bot posts in-channel with a natural message:

```
**Panel Results: Plant-Based Filipino Protein Bar Concept**
Panel: Metro Manila Health Millennials · 20 personas

| Dimension | Mean | Mode | Distribution |
|-----------|------|------|-------------|
| Purchase Intent | 3.50/5 | 4 | ▁▁▁▂▂▂▂▅████▅▄▄ (1:2 2:3 3:5 4:7 5:3) |
| Value Perception | 3.25/5 | 3 | ▁▁▂▂▂▄▄████▅▅▂▂ (1:2 2:4 3:7 4:5 5:2) |
| Uniqueness | 4.30/5 | 5 | ▁▁▃▄▄████████▉▉ (1:0 2:1 3:3 4:8 5:8) |
| Brand Favorability | 4.05/5 | 4 | ▁▁▂▄▄▄▄████████▅ (1:0 2:1 3:4 4:10 5:5) |

**Top signals:**
🟢 **Uniqueness (4.30)** and **brand favorability (4.05)** are strong — the Filipino
   ingredient story is genuinely differentiated and resonates with your target segment.
🟡 **Purchase intent (3.50)** is moderate — the concept has real appeal but price
   sensitivity and uncertainty about taste are holding it back.
🔴 **Value perception (3.25)** is the weakest score — ₱75–85 needs more justification,
   especially for budget-constrained personas (students, moderate-income workers).

**Key voices:**
> *"This is exactly what I've been looking for. I'd buy a box immediately."* — Katrina Bautista ✅
> *"Unique yes, but uniqueness alone doesn't make me buy — I need to know it tastes good."* — Mikael Gomez ⚠️
> *"₱85 is a lot for a snack bar as a student."* — Sean Navarro ❌

**Recommendation:** The concept has strong pull with committed plant-based and sustainability-
oriented consumers. Price is the main barrier. Consider a ₱60–65 introductory price or
a smaller single-serve format at ₱45–50 to lower the trial threshold.

Run ID: `b3c4d5e6`
```

---

## Step 9: Optional Follow-Up — Segmented Analysis

The user follows up:

```
@daimon interesting. which personas are most excited vs skeptical?
```

Because this question doesn't require a new tool call, Claude answers from the already-returned XML data:

```
**Most excited personas (scores 4–5 across dimensions):**
- **Katrina Bautista** (vegetarian teacher) — highest overall. Sees this as a gap in the market.
- **Jessa Tan** (plant-based marketing manager) — strong brand alignment, content-creation angle.
- **Aaron Mendoza** (vegan NGO worker) — ideological alignment, willing to budget for it.
- **Sophia Enriquez** (startup founder) — even willing to pay above ₱85.
- **Rhea Morales** (social media manager) — wants to photograph and share it.

**Most skeptical personas (scores 1–2 on value/purchase intent):**
- **Sean Navarro** (nursing student) — purely a budget issue, not product skepticism.
- **Dennis Aguilar** (police officer) — unfamiliar with plant protein category entirely.
- **Paolo Villanueva** (freelance designer) — price-sensitive, would need promo trigger.
- **Adrian Santos** (BPO worker) — compares to cheap whole-food alternatives.

Pattern: skeptics are price-limited or category-unfamiliar — not product-averse.
The core audience (plant-based, sustainability-conscious, upper-middle income) is
genuinely excited. The product concept has clear segment fit; the challenge is reach.
```

---

## Summary of Tool Calls in This Example

| Step | Tool | Input Fields | Output |
|------|------|-------------|--------|
| 1 | `ssr_panel_create` | `panel_name`, `demographics` (age 25–38, mixed gender, Manila), `psychographics` (fitness, health, Filipino pride), `product_category="health snacks"`, `panel_size=20`, `custom_persona_instructions` (mix of gym/casual/non-gym + vegan/non-vegan) | `panel_id=c2d4f6a8`, 20 personas |
| 2 | `ssr_panel_run` | `panel_id=c2d4f6a8`, `stimulus_type=product_concept`, full concept text, `evaluation_dimensions=[purchase_intent, value_perception, uniqueness, brand_favorability]` | `run_id=b3c4d5e6`, 4 dimensions scored |

**Total estimated cost**: $0.06 (panel) + $0.06 (run) = **~$0.12**
**Total wall time**: ~15s (persona generation) + ~60s (panel run) = **~75s**

**Key insight from this example**: The `product_concept` stimulus type works well for pre-formulation concept testing. The `uniqueness` and `brand_favorability` dimensions reveal that the positioning story is compelling even without a physical product, while `value_perception` surfaces price sensitivity early — saving the founder from over-investing before adjusting pricing.
