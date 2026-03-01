# End-to-End Example: Influencer–Audience Fit Assessment

> Cross-references: [panel-create.md](../tools/panel-create.md) · [panel-run.md](../tools/panel-run.md) · [panel-results.md](../tools/panel-results.md) · [discord-ux.md](../integration/discord-ux.md) · [anchor-statements.md](../pipeline/anchor-statements.md)

---

## Scenario

A brand partnerships manager at a Filipino fitness apparel brand ("Agos Athletics") is evaluating a potential collaboration with a micro-influencer: **Mark Dela Torre** (@markfit.ph), a 27-year-old Cebu-based gym trainer with 85K followers on Instagram and TikTok. His content mixes workout routines, meal prep, and Cebuano lifestyle content.

The brand's target audience: Gen Z and young millennial Filipino men and women, 18–28, who are fitness-curious or active gym-goers. The brand's identity centers on affordable performance wear designed for the Philippine climate — "built for heat, built by Filipinos."

Before committing to a paid partnership, the manager wants to assess whether Mark's persona, content style, and values align with this audience's expectations and would drive authentic brand trust.

**The assessment brief:**
> *Influencer: Mark Dela Torre (@markfit.ph). 27 years old, based in Cebu City. Gym trainer and fitness content creator. 85K combined Instagram + TikTok. Posts: workout tutorials (3x/week), high-protein Filipino meal prep, training splits, gym-humor memes, occasional Cebuano lifestyle content. Tone: direct, motivational, lightly humorous, conversational Tagalog-English mix with Visayan. Has worked with one supplement brand previously. No known controversies. Follower demographic: 60% male, 40% female, 70% Philippines (majority Visayas + Cebu), 30% OFW/diaspora.*

**Brand brief:**
> *Agos Athletics: Filipino fitness apparel brand. Affordable performance wear (₱500–1,500 range). Designed for humid tropical training conditions. Positioning: "Built for heat, built by Filipinos." Values: authenticity, accessibility, Filipino athletic pride. Current presence: Metro Manila-focused with growing Cebu market. Looking to deepen Visayas engagement.*

---

## Step 1: User Message in Discord

```
@daimon can you assess whether mark dela torre (@markfit.ph) is a good fit for agos athletics?
he's a cebu gym trainer/influencer, 85k followers, workout + meal prep content, cebuano lifestyle.
we want to reach gen z and young millennial fitness crowd in the ph.
score on personal relevance, trust/credibility, emotional response, and share-worthiness.
panel of 20 people please, 18-28 filipino, fitness-interested.
```

---

## Step 2: Daimon Pre-Tool Acknowledgment

```
Sure — I'll build a panel of 20 fitness-interested Filipinos (18–28, mixed gender) and run
the Agos × Mark Dela Torre pitch against it. Scoring personal relevance, trust/credibility,
emotional response, and share-worthiness. Building personas now...
```

---

## Step 3: Tool Call — `ssr_panel_create`

```json
{
  "panel_name": "Gen Z Filipino Fitness — Agos Panel",
  "demographics": {
    "age_min": 18,
    "age_max": 28,
    "genders": ["male", "female"],
    "locations": ["Philippines"],
    "income_brackets": ["lower_middle", "middle", "upper_middle"],
    "education_levels": ["high_school", "some_college", "bachelors"],
    "languages": ["Filipino", "English"]
  },
  "psychographics": {
    "interests": ["gym", "fitness", "sports", "workout routines", "athletic wear", "content creators", "social media"],
    "values": ["Filipino identity", "self-improvement", "authenticity", "community", "affordability"],
    "lifestyle_descriptors": ["gym-goer or fitness-curious", "social media active", "Gen Z or young millennial", "follows fitness creators"],
    "media_consumption": ["Instagram fitness content", "TikTok workouts", "YouTube gym tutorials", "follows Filipino fitness influencers"]
  },
  "product_category": "fitness apparel / athletic wear",
  "panel_size": 20,
  "custom_persona_instructions": "Include a mix of: (1) regular gym-goers who follow multiple fitness influencers, (2) fitness-curious people who aspire to go to the gym but haven't committed, (3) sports players who train but don't identify with gym culture. Include personas from Metro Manila, Cebu, Davao, and provincial areas. Roughly 55% male, 45% female to match the influencer's follower gender split."
}
```

---

## Step 4: Tool Output — `ssr_panel_create`

```xml
<panel-created size="20" requested_size="20" status="ready">
  <panel-id>e5f7a9b1-c3d5-4e6f-8a0b-1c2d3e4f5a6b</panel-id>
  <panel-name>Gen Z Filipino Fitness — Agos Panel</panel-name>
  <personas total="20">
    <persona index="1" name="Jomar Alcantara" age="23" location="Cebu City, Visayas" occupation="Gym Member / BPO Agent">
      Gym 4x/week, follows several Cebu-based fitness creators including @markfit.ph. Regional pride is a strong identity marker — prefers supporting local Cebu businesses and creators.
    </persona>
    <persona index="2" name="Trisha Abad" age="21" location="Quezon City, Metro Manila" occupation="College Student (Nursing)">
      Gym-curious, goes 1–2x/month. Follows fitness content mainly for motivation and meal prep ideas. Would buy affordable athletic wear if recommended by a relatable, trustworthy creator.
    </persona>
    <persona index="3" name="Raphael Delos Reyes" age="25" location="BGC, Taguig, Metro Manila" occupation="Junior Analyst">
      Gym 5x/week. Highly brand-aware. Follows 10+ Filipino fitness influencers. Evaluates creators by content quality and whether their physique is aspirational but achievable.
    </persona>
    <persona index="4" name="Diane Ferrer" age="19" location="Davao City, Mindanao" occupation="Senior High School Student">
      Does home workouts and occasional gym. Follows TikTok fitness content obsessively. Buys athletic wear based on TikTok recommendations. Very price-sensitive — can't spend above ₱800.
    </persona>
    <persona index="5" name="Carl Mendoza" age="26" location="Mandaluyong, Metro Manila" occupation="Gym Instructor">
      Fitness professional. Evaluates influencers by technical accuracy and whether they actually know what they're doing. Will immediately dismiss anyone who gives bad advice.
    </persona>
    <persona index="6" name="Bea Santos" age="22" location="Iloilo City, Visayas" occupation="College Student (Business)">
      Runs 3x/week, not a gym person. Follows Visayan creators for regional relatability. Interested in athletic wear as an everyday fashion item, not just for workouts.
    </persona>
    <persona index="7" name="Kevin Lim" age="24" location="Makati, Metro Manila" occupation="IT Support">
      Gym 3x/week. Moderate follower of Filipino fitness creators. Responds well to authentic, non-pretentious content. Would be turned off by over-produced or "pay-to-play" obvious brand content.
    </persona>
    <persona index="8" name="Aika Villanueva" age="28" location="Cebu City, Visayas" occupation="Graphic Designer">
      Pilates and light gym. Cebu-based. Already aware of @markfit.ph. Finds his content motivational. Buys local athletic wear — already owns Agos-style affordable performance pieces.
    </persona>
    <persona index="9" name="Noel Garcia" age="20" location="Laguna" occupation="Varsity Basketball Player (College)">
      Athlete, not gym culture. Trains for sport performance. Follows content creators who train for real athletic goals, not just aesthetics. Skeptical of influencer marketing.
    </persona>
    <persona index="10" name="Mae Torres" age="27" location="Pasig, Metro Manila" occupation="Social Worker">
      Gym-curious. Goes to the gym 2x/month when motivated. Follows fitness content for inspo but hasn't converted to consistent gym habit. Responds emotionally to aspirational but accessible stories.
    </persona>
    <persona index="11" name="Denz Cruz" age="18" location="Caloocan, Metro Manila" occupation="Senior High Student">
      Just started going to the gym 2 months ago. Heavily influenced by TikTok fitness content. Looking for role models who look achievable. Price-sensitive — shops at divisoria for gym wear.
    </persona>
    <persona index="12" name="Jenny Reyes" age="25" location="Mandaluyong, Metro Manila" occupation="Nurse">
      Night-shift RN. Gym before night shifts 3x/week. Follows Filipino fitness creators for workout ideas. Values creators who acknowledge the grind of shift work and everyday Filipino life.
    </persona>
    <persona index="13" name="Aldren Bueno" age="23" location="Cebu City, Visayas" occupation="College Graduate / Job Hunting">
      Mark Dela Torre follower. Has Bisaya as mother tongue — appreciates when creators use Cebuano-tinged content. Highly regional identity-driven. Would buy a product Mark recommends.
    </persona>
    <persona index="14" name="Cheska Navarro" age="26" location="Antipolo, Rizal" occupation="VA / Work From Home">
      Does YouTube workout videos at home. Gym-curious but hasn't gone to an actual gym. Follows fitness content for motivation. Responds very positively to accessible, non-intimidating fitness messaging.
    </persona>
    <persona index="15" name="Robi Castillo" age="21" location="Davao City, Mindanao" occupation="College Student (Engineering)">
      Gym 4x/week. Follows multiple fitness creators — is good at detecting paid vs authentic content. Would investigate the brand before deciding to trust a partnership post.
    </persona>
    <persona index="16" name="Rina Espiritu" age="24" location="Taguig, Metro Manila" occupation="Marketing Coordinator">
      Marketing professional — hyper-aware of influencer marketing mechanics. High bar for authentic vs transactional partnerships. Evaluates based on whether the creator genuinely uses/fits the product.
    </persona>
    <persona index="17" name="Bryan Pascual" age="28" location="Quezon City, Metro Manila" occupation="PE Teacher">
      Physical educator, gym 4x/week. Values creators who demonstrate real expertise and are not just about aesthetics. Cebu-based creators have less regional pull for him personally.
    </persona>
    <persona index="18" name="Faye Magat" age="20" location="Cebu City, Visayas" occupation="College Student (Tourism)">
      Light gym-goer. Primarily follows Cebu creators for lifestyle content. Finds @markfit.ph relatable — follows him for the food content more than fitness. Would buy Agos if he showed himself wearing it.
    </persona>
    <persona index="19" name="Isaac Tolentino" age="27" location="Pasay, Metro Manila" occupation="Barista / Part-time Freelancer">
      Gym 3x/week, budget-conscious. Follows affordable fitness content. Responsive to content that respects his financial reality. Would appreciate a ₱500–1,500 apparel brand if positioned honestly.
    </persona>
    <persona index="20" name="Mona Dela Cruz" age="22" location="Iloilo City, Visayas" occupation="College Student (Nursing)">
      Aerobics and yoga. Not a gym person but fitness-active. Buys athletic wear for everyday wear (not gym-specific). Attracted to Filipino brands with a clear identity story.
    </persona>
  </personas>
  <estimated-run-cost-usd>0.0600</estimated-run-cost-usd>
  <hint>Panel 'e5f7a9b1-c3d5-4e6f-8a0b-1c2d3e4f5a6b' is ready with 20 personas. Use ssr_panel_run with panel_id='e5f7a9b1-c3d5-4e6f-8a0b-1c2d3e4f5a6b' to test a marketing asset.</hint>
</panel-created>
```

---

## Step 5: Daimon Interstitial Message

```
Panel ready — 20 fitness-interested Filipinos ages 18–28, mix of gym regulars and
fitness-curious, Metro Manila + Visayas + Mindanao. Running the influencer fit
assessment now... (~60s)
```

---

## Step 6: Tool Call — `ssr_panel_run`

```json
{
  "panel_id": "e5f7a9b1-c3d5-4e6f-8a0b-1c2d3e4f5a6b",
  "stimulus_type": "influencer_brief",
  "stimulus_text": "A fitness apparel brand called Agos Athletics ('Built for heat, built by Filipinos') is partnering with Mark Dela Torre (@markfit.ph). Mark is a 27-year-old gym trainer from Cebu City with 85,000 combined Instagram and TikTok followers. His content includes workout tutorials, high-protein Filipino meal prep, training splits, and Cebuano lifestyle moments. His tone is direct, motivational, conversational Filipino-English with light Visayan. The partnership would have Mark posting 3 sponsored posts per month showcasing Agos gear during his gym sessions and meal prep content. Agos Athletics sells affordable Filipino-designed performance wear in the ₱500–1,500 range, built for training in tropical heat.",
  "stimulus_label": "Agos Athletics × Mark Dela Torre partnership",
  "stimulus_context": "Evaluating influencer-brand fit. Scoring how the target audience responds to the idea of Mark Dela Torre partnering with Agos Athletics.",
  "evaluation_dimensions": ["personal_relevance", "trust_credibility", "emotional_response", "share_worthiness"],
  "response_format": "detailed"
}
```

---

## Step 7: Tool Output — `ssr_panel_run`

```xml
<panel-run-complete run_id="d6e7f8a9-b0c1-2d3e-4f5a-6b7c8d9e0f1a" panel_id="e5f7a9b1-c3d5-4e6f-8a0b-1c2d3e4f5a6b" personas_scored="20" dimensions="4" status="complete">
  <stimulus type="influencer_brief" label="Agos Athletics × Mark Dela Torre partnership">
    A fitness apparel brand called Agos Athletics...
  </stimulus>
  <results>
    <dimension name="personal_relevance" mean="3.80" std="0.95" mode="4" ci_low="3.36" ci_high="4.24">
      <distribution>
        <score value="1" count="1"/>
        <score value="2" count="2"/>
        <score value="3" count="5"/>
        <score value="4" count="8"/>
        <score value="5" count="4"/>
      </distribution>
      <highlights>
        <highlight valence="positive" persona="Jomar Alcantara">Mark is someone I actually follow. Seeing him rep a local apparel brand feels natural and I'd pay attention. The Cebu angle makes it extra relevant to me.</highlight>
        <highlight valence="positive" persona="Aldren Bueno">Bisaya gym trainer pushing a Filipino brand? That's exactly the kind of content I share. This feels like it was made for people like me.</highlight>
        <highlight valence="positive" persona="Jenny Reyes">His content always feels like it's for real working Filipinos, not aspirational gym gods. That makes this feel relevant to me too.</highlight>
        <highlight valence="negative" persona="Noel Garcia">I don't follow gym influencers so this doesn't land for me personally. But I can see why others would connect with it.</highlight>
        <highlight valence="negative" persona="Bryan Pascual">I'm more of a Metro Manila person. Cebu-regional content doesn't have as much pull for me, even if the brand values are right.</highlight>
      </highlights>
    </dimension>
    <dimension name="trust_credibility" mean="4.00" std="0.79" mode="4" ci_low="3.63" ci_high="4.37">
      <distribution>
        <score value="1" count="0"/>
        <score value="2" count="2"/>
        <score value="3" count="4"/>
        <score value="4" count="10"/>
        <score value="5" count="4"/>
      </distribution>
      <highlights>
        <highlight valence="positive" persona="Carl Mendoza">A gym trainer who actually trains — not just a physique model — is more credible recommending workout gear. I trust that he sweats in it.</highlight>
        <highlight valence="positive" persona="Robi Castillo">Cebu trainer, local brand built for Filipino heat. The fit makes sense. I'd be more willing to trust the recommendation because it's a logical pairing.</highlight>
        <highlight valence="positive" persona="Raphael Delos Reyes">I've seen his workout content — it's technical, not just aesthetic. That baseline credibility extends to gear recommendations for me.</highlight>
        <highlight valence="negative" persona="Rina Espiritu">I'd need to see whether he actually wears the brand before and after the deal. If the partnership feels forced or he keeps wearing other gear in non-sponsored posts, trust drops fast.</highlight>
        <highlight valence="negative" persona="Kevin Lim">Credible in general but I'll wait for the actual sponsored posts before deciding whether it's an authentic partnership or just a paid post.</highlight>
      </highlights>
    </dimension>
    <dimension name="emotional_response" mean="3.70" std="0.92" mode="4" ci_low="3.27" ci_high="4.13">
      <distribution>
        <score value="1" count="1"/>
        <score value="2" count="2"/>
        <score value="3" count="6"/>
        <score value="4" count="8"/>
        <score value="5" count="3"/>
      </distribution>
      <highlights>
        <highlight valence="positive" persona="Mae Torres">The "built by Filipinos for Filipino heat" story with a Cebu trainer — there's something genuinely exciting about that. It feels like a real Filipino fitness brand finally getting traction.</highlight>
        <highlight valence="positive" persona="Cheska Navarro">This made me want to look up both of them. The combination of accessible content style and affordable Filipino brand feels inspiring and achievable.</highlight>
        <highlight valence="positive" persona="Faye Magat">I already like Mark. Knowing he's working with a Filipino brand makes me like him more. I'd feel good supporting both of them.</highlight>
        <highlight valence="negative" persona="Denz Cruz">It's fine but I don't feel anything strong. I'd scroll past it unless the content itself was really good.</highlight>
      </highlights>
    </dimension>
    <dimension name="share_worthiness" mean="3.45" std="1.00" mode="4" ci_low="2.99" ci_high="3.91">
      <distribution>
        <score value="1" count="2"/>
        <score value="2" count="2"/>
        <score value="3" count="7"/>
        <score value="4" count="6"/>
        <score value="5" count="3"/>
      </distribution>
      <highlights>
        <highlight valence="positive" persona="Rhea Morales">If the actual post uses Cebuano and shows him training in humid outdoor conditions in Cebu, that's shareable content — it's different from every other gym brand post I see.</highlight>
        <highlight valence="positive" persona="Aldren Bueno">I'd share this to my group chat. Cebu trainer + Filipino brand is pride content for us. That's automatic share.</highlight>
        <highlight valence="negative" persona="Rina Espiritu">Whether I share it depends entirely on how the actual posts are executed. The concept alone doesn't make it shareable — execution does.</highlight>
        <highlight valence="negative" persona="Carl Mendoza">I share fitness content when it teaches me something or shows real results. A brand partnership announcement on its own? Probably not. The workout content has to be good.</highlight>
      </highlights>
    </dimension>
  </results>
  <hint>Run complete. Use ssr_panel_results with run_id='d6e7f8a9-b0c1-2d3e-4f5a-6b7c8d9e0f1a' for detailed analysis.</hint>
</panel-run-complete>
```

---

## Step 8: Daimon Results Post (Discord Thread)

Because this is 4 dimensions with `response_format="detailed"`, the bot opens a thread:

**Channel message** (trigger):
```
Panel results for Agos × Mark Dela Torre — detailed results in thread 👇
```

**Thread — first message:**
```
**Influencer Fit Assessment: Agos Athletics × Mark Dela Torre (@markfit.ph)**
Panel: Gen Z Filipino Fitness — 20 personas (ages 18–28, Manila + Visayas + Mindanao)

| Dimension | Mean | Mode | Distribution |
|-----------|------|------|-------------|
| Personal Relevance | 3.80/5 | 4 | ▁▁▁▂▂▂▂████▅▅▄▄ (1:1 2:2 3:5 4:8 5:4) |
| Trust / Credibility | 4.00/5 | 4 | ▁▁▂▂▂▄▄▄████████▅▅ (1:0 2:2 3:4 4:10 5:4) |
| Emotional Response | 3.70/5 | 4 | ▁▁▁▂▂▂▃████████▅▄ (1:1 2:2 3:6 4:8 5:3) |
| Share-worthiness | 3.45/5 | 3 | ▁▁▂▂▂▃▄▄████▅▅▃▃ (1:2 2:2 3:7 4:6 5:3) |

**Overall verdict: solid fit with clear regional concentration**

Trust and credibility are the strongest scores (4.00) — Mark's identity as a working gym
trainer who actually trains, rather than just an aesthetic model, reads as authentic to
this audience. The Cebu + Filipino brand combination creates genuine regional pride
resonance, especially with Visayas-based personas.

Share-worthiness (3.45) is the softer score — personas say execution will determine
shareability more than the concept itself. The partnership won't go viral from the
announcement; it needs consistently well-made content.
```

**Thread — second message:**
```
**Personal Relevance — Key Voices**

Positives:
> *"Mark is someone I actually follow. Seeing him rep a local apparel brand feels natural."* — Jomar Alcantara (Cebu, BPO)
> *"Bisaya gym trainer pushing a Filipino brand? That's exactly the kind of content I share."* — Aldren Bueno (Cebu, grad)
> *"His content feels like it's for real working Filipinos, not aspirational gym gods."* — Jenny Reyes (Manila, nurse)

Negatives:
> *"I don't follow gym influencers so this doesn't land for me personally."* — Noel Garcia (varsity, Laguna)
> *"Cebu-regional content doesn't have as much pull for me."* — Bryan Pascual (Metro Manila, PE teacher)

---

**Trust / Credibility — Key Voices**

Positives:
> *"A gym trainer who actually trains — not just a physique model — is more credible recommending workout gear."* — Carl Mendoza (gym instructor)
> *"The fit makes sense. Cebu trainer, local brand built for Filipino heat."* — Robi Castillo (Davao, student)

Watch:
> *"I'd need to see whether he actually wears the brand before and after the deal."* — Rina Espiritu (marketing coordinator)

---

**Share-worthiness — Key Voices**

Positives:
> *"If the post uses Cebuano and shows him training outdoors in Cebu, that's shareable — it's different."* — Rhea Morales
> *"Cebu trainer + Filipino brand is pride content. Automatic share."* — Aldren Bueno

Conditions:
> *"Whether I share depends entirely on how the posts are executed."* — Rina Espiritu
> *"The workout content has to be good. A brand announcement alone I won't share."* — Carl Mendoza

Run ID: `d6e7f8a9`
```

---

## Step 9: Optional — Comparison Against a Metro Manila Influencer

The user could then test a different influencer candidate targeting the Metro Manila segment and compare scores. This would involve:

1. Creating a second panel (or reusing the same one if demographics match)
2. Running `ssr_panel_run` with a different `stimulus_text` describing the second influencer + brand combo
3. Calling `ssr_panel_results` with `comparison_run_id` set to the first run

The comparison would show which influencer scores higher per dimension with the same panel, enabling a direct side-by-side assessment.

---

## Summary of Tool Calls in This Example

| Step | Tool | Key Input | Output |
|------|------|-----------|--------|
| 1 | `ssr_panel_create` | `demographics` (age 18–28, mixed, Philippines), `psychographics` (gym/fitness-curious, follows creators), `product_category="fitness apparel"`, `panel_size=20`, `custom_persona_instructions` (mix of gym/casual/sport personas, gender distribution, regional spread) | `panel_id=e5f7a9b1`, 20 personas |
| 2 | `ssr_panel_run` | `panel_id=e5f7a9b1`, `stimulus_type=influencer_brief`, full influencer + brand brief, `evaluation_dimensions=[personal_relevance, trust_credibility, emotional_response, share_worthiness]`, `response_format=detailed` | `run_id=d6e7f8a9`, 4 dimensions, detailed highlights |

**Total estimated cost**: $0.06 (panel creation) + $0.06 (panel run) = **~$0.12**
**Total wall time**: ~15s (persona generation) + ~75s (panel run, detailed mode) = **~90s**

---

## What This Example Demonstrates

1. **`influencer_brief` stimulus type** — the stimulus description is a prose brief about an influencer + brand, not copy or a product concept. The SSR methodology elicits naturalistic reactions from personas who imagine encountering this pairing in their feed.

2. **Regional segmentation signal** — the panel naturally surfaces the Visayas / Cebu cluster vs. Metro Manila split in relevance, even without a segmentation question. The tool outputs allow the manager to see exactly which personas drive each dimension score up or down.

3. **`trust_credibility` and `personal_relevance` as primary fit metrics** — for influencer assessments, these two dimensions are the most actionable. High trust/credibility with moderate share-worthiness indicates a reliable brand-safety partner; high share-worthiness with low credibility indicates a viral risk.

4. **Conditional share-worthiness** — personas consistently flagged that share-worthiness depends on execution, not the partnership concept. This is useful signal for the creative brief: the content itself must be genuinely useful or regionally authentic to drive sharing.

5. **`response_format=detailed`** — for influencer assessment, `detailed` is recommended over `summary` because the qualitative highlights contain the strategic insight. The distribution alone does not tell you *why* trust is high or *what conditions* create share-worthiness.
