# End-to-End Example: Ad Copy A/B Test

> Cross-references: [panel-create.md](../tools/panel-create.md) · [panel-run.md](../tools/panel-run.md) · [panel-results.md](../tools/panel-results.md) · [discord-ux.md](../integration/discord-ux.md) · [anchor-statements.md](../pipeline/anchor-statements.md)

---

## Scenario

A brand manager at a packaged-food company has two versions of a social media caption for Lucky Me instant noodles targeting Filipino moms. She wants to know which resonates more on **purchase intent**, **message clarity**, and **personal relevance** before spending on paid social placement.

**Version A** (emotional/nostalgic angle):
> *"Ang sarap, tipid pa! Lucky Me — laging presente sa mesa ng pamilya."*
> ("So delicious, so affordable! Lucky Me — always present at the family table.")

**Version B** (practical/functional angle):
> *"Luto sa 3 minuto, masustansya pa. Lucky Me — mabilis, mura, masarap."*
> ("Ready in 3 minutes, nutritious too. Lucky Me — fast, affordable, delicious.")

Target segment: Filipino mothers aged 30–45, middle income, Metro Manila and Visayas.

---

## Step 1: User Message in Discord

The user mentions Daimon in the `#marketing` channel:

```
@daimon test these two Lucky Me captions with a panel of Filipino moms ages 30-45.
Version A: "Ang sarap, tipid pa! Lucky Me — laging presente sa mesa ng pamilya."
Version B: "Luto sa 3 minuto, masustansya pa. Lucky Me — mabilis, mura, masarap."
Score on purchase intent, message clarity, and personal relevance.
```

---

## Step 2: Daimon Pre-Tool Acknowledgment

The bot posts immediately (before any tool calls):

```
Got it — I'll build a panel of 20 Filipino moms (30–45, Metro Manila + Visayas, middle income)
and run both captions through it. Scoring purchase intent, message clarity, and personal
relevance. One moment while I generate the personas...
```

---

## Step 3: Tool Call — `ssr_panel_create`

Claude invokes `ssr_panel_create` with the following input:

```json
{
  "panel_name": "Filipino Moms 30-45 · Lucky Me",
  "demographics": {
    "age_min": 30,
    "age_max": 45,
    "genders": ["female"],
    "locations": ["Metro Manila", "Visayas", "Philippines"],
    "income_brackets": ["lower_middle", "middle", "upper_middle"],
    "education_levels": null,
    "languages": ["Filipino", "English"]
  },
  "psychographics": {
    "interests": ["cooking", "family activities", "budget management", "church activities"],
    "values": ["family-first", "frugality", "practicality", "brand familiarity"],
    "lifestyle_descriptors": ["busy working mom", "manages household budget", "grocery shopper"],
    "media_consumption": ["Facebook", "noontime TV", "TikTok cooking content"]
  },
  "product_category": "instant noodles / packaged food",
  "panel_size": 20,
  "custom_persona_instructions": null
}
```

---

## Step 4: Tool Output — `ssr_panel_create`

The tool returns:

```xml
<panel-created size="20" requested_size="20" status="ready">
  <panel-id>a3f7b2e1-9d04-4c8a-b561-2e7f90c1d4a8</panel-id>
  <panel-name>Filipino Moms 30-45 · Lucky Me</panel-name>
  <personas total="20">
    <persona index="1" name="Maria Santos" age="37" location="Quezon City, Metro Manila" occupation="Elementary School Teacher">
      Married with two boys (8 and 11). Manages grocery budget tightly on a teacher's salary. Trusts brands with long household histories. Evaluates instant food by taste, price, and whether kids accept it.
    </persona>
    <persona index="2" name="Liza Reyes" age="42" location="Davao City, Mindanao" occupation="Small Sari-Sari Store Owner">
      Widowed, three children ages 14–22. Practical and cost-driven — buys Lucky Me by the case for resale and home use. Brand familiarity is a strong loyalty driver.
    </persona>
    <persona index="3" name="Joy Dela Cruz" age="31" location="Makati, Metro Manila" occupation="Customer Service Representative">
      Single renting with a roommate. Sends remittances to parents in Iloilo. Budget-conscious but aspirational about personal care. Heavy Facebook and TikTok user.
    </persona>
    <persona index="4" name="Rosario Magtanggol" age="39" location="Cebu City, Visayas" occupation="Nurse (Provincial Hospital)">
      Married, four children. Night-shift work means she often leans on quick meals. Values nutrition labels — recently scrutinizing sodium content in instant noodles.
    </persona>
    <persona index="5" name="Annalisa Corpuz" age="33" location="Pasig, Metro Manila" occupation="BPO Agent">
      Married, one toddler. Shift work means erratic meal times. Lucky Me is a staple on night shifts and weekends. Motivated by convenience and taste familiarity.
    </persona>
    <persona index="6" name="Nilda Batungbakal" age="44" location="Iloilo City, Visayas" occupation="Stay-at-Home Mom">
      Five children ages 8–20. Husband works abroad (OFW). Runs a very tight household budget. Views Lucky Me as a reliable fallback meal. Nostalgic connection to the brand.
    </persona>
    <persona index="7" name="Gemma Villanueva" age="36" location="Taguig, Metro Manila" occupation="Government Clerk">
      Married, two daughters. Church-active. Prefers Filipino brands. Evaluates food ads for authenticity — skeptical of overly polished marketing.
    </persona>
    <persona index="8" name="Teresa Aguilar" age="40" location="Bacolod, Visayas" occupation="Grade School Principal">
      Married, three teenagers. Higher income bracket for the panel. Nostalgic fondness for Lucky Me from college days. Now buys premium noodles more often but keeps Lucky Me for children's snacks.
    </persona>
    <persona index="9" name="Celine Vera" age="34" location="Mandaluyong, Metro Manila" occupation="Admin Assistant">
      Single mom, one child (6). Very tight finances — instant noodles are a weekly staple. Emotionally sensitive to messaging about family and home.
    </persona>
    <persona index="10" name="Rosa Dela Paz" age="43" location="Cebu City, Visayas" occupation="Midwife">
      Married, two kids. Health-conscious — recently reduced instant noodle consumption after blood pressure warning. Skeptical of "nutritious" claims in ads.
    </persona>
    <persona index="11" name="Ana Bautista" age="32" location="Marikina, Metro Manila" occupation="Online Seller (Shopee / Facebook)">
      Married, two kids. Home-based work. Evaluates products on Instagram and TikTok. Lucky Me is an occasional purchase — not a brand she identifies with strongly.
    </persona>
    <persona index="12" name="Corazon Espiritu" age="38" location="Dumaguete, Negros Oriental" occupation="Public School Teacher">
      Married, three kids. Budget-constrained. Views Lucky Me as a trusted local brand. Strong emotional response to messaging about family togetherness.
    </persona>
    <persona index="13" name="Luz Manalo" age="41" location="Caloocan, Metro Manila" occupation="Domestic Helper (live-out)">
      Single, sends money home to Bicol. Very price-sensitive. Cooks Lucky Me for herself and her employer's children. Purely practical — message resonance is low-priority.
    </persona>
    <persona index="14" name="Patricia Abad" age="30" location="Pasay, Metro Manila" occupation="Flight Attendant">
      Married, one infant. Upper-middle income. Buys Lucky Me occasionally but increasingly prefers premium options. Attracted to aspirational, lifestyle-led messaging.
    </persona>
    <persona index="15" name="Elena Castillo" age="35" location="Tacloban, Leyte" occupation="Market Vendor">
      Widowed, four kids. Typhoon survivor — strong community resilience identity. Very price-sensitive. Lucky Me is a comfort brand associated with recovery and normalcy.
    </persona>
    <persona index="16" name="Maricel Domingo" age="44" location="Pasig, Metro Manila" occupation="Barangay Health Worker">
      Married, five kids. Active in community health drives. Aware of sodium issues in instant noodles but still buys them weekly. Appreciates honesty in ads.
    </persona>
    <persona index="17" name="Ligaya Fuentes" age="31" location="Iloilo City, Visayas" occupation="Call Center Agent">
      Single, renting. Young-feeling for her age. Responds well to humor and authenticity in Filipino ads. Lucky Me is a go-to for post-shift meals.
    </persona>
    <persona index="18" name="Dolores Cruz" age="45" location="Calamba, Laguna" occupation="Factory Worker">
      Married, three adult children. Near-retirement mindset. Brand loyalty driven by decades of use. Emotionally resonates with heritage brand messaging.
    </persona>
    <persona index="19" name="Rowena Alcantara" age="37" location="Antipolo, Rizal" occupation="Bank Teller">
      Married, two kids. Lower-middle income bank salary. Values clear, no-nonsense messaging. Skeptical of exaggerated health claims.
    </persona>
    <persona index="20" name="Felicity Gomez" age="33" location="Mandaue, Cebu" occupation="Part-Time Tutor">
      Single mom, one daughter (5). Strong social media presence. Creates occasional food content on TikTok. Responds positively to authentic Filipino language and imagery.
    </persona>
  </personas>
  <estimated-run-cost-usd>0.0600</estimated-run-cost-usd>
  <hint>Panel 'a3f7b2e1-9d04-4c8a-b561-2e7f90c1d4a8' is ready with 20 personas. Use ssr_panel_run with panel_id='a3f7b2e1-9d04-4c8a-b561-2e7f90c1d4a8' to test a marketing asset.</hint>
</panel-created>
```

---

## Step 5: Daimon Interstitial Message

After receiving the panel creation result, the bot posts:

```
Panel ready — 20 Filipino moms across Metro Manila and the Visayas.
Running Version A through the panel now... (~60s)
```

---

## Step 6: Tool Call — `ssr_panel_run` (Version A)

```json
{
  "panel_id": "a3f7b2e1-9d04-4c8a-b561-2e7f90c1d4a8",
  "stimulus_type": "social_caption",
  "stimulus_text": "Ang sarap, tipid pa! Lucky Me — laging presente sa mesa ng pamilya.",
  "stimulus_label": "Version A — emotional/nostalgic",
  "stimulus_context": null,
  "evaluation_dimensions": ["purchase_intent", "message_clarity", "personal_relevance"],
  "response_format": "summary"
}
```

---

## Step 7: Tool Output — `ssr_panel_run` (Version A)

```xml
<panel-run-complete run_id="f9e1c2d3-4a5b-6c7d-8e9f-0a1b2c3d4e5f" panel_id="a3f7b2e1-9d04-4c8a-b561-2e7f90c1d4a8" personas_scored="20" dimensions="3" status="complete">
  <stimulus type="social_caption" label="Version A — emotional/nostalgic">
    Ang sarap, tipid pa! Lucky Me — laging presente sa mesa ng pamilya.
  </stimulus>
  <results>
    <dimension name="purchase_intent" mean="3.85" std="0.91" mode="4" ci_low="3.43" ci_high="4.27">
      <distribution>
        <score value="1" count="1"/>
        <score value="2" count="2"/>
        <score value="3" count="4"/>
        <score value="4" count="9"/>
        <score value="5" count="4"/>
      </distribution>
      <highlights>
        <highlight valence="positive" persona="Maria Santos">I'd definitely grab another pack — we always have Lucky Me at home and this reminds me why.</highlight>
        <highlight valence="positive" persona="Corazon Espiritu">This made me smile. It's exactly how I feel — Lucky Me is always on our table.</highlight>
        <highlight valence="negative" persona="Rosa Dela Paz">I don't buy Lucky Me as much anymore. I'm trying to cut sodium. This doesn't change that.</highlight>
      </highlights>
    </dimension>
    <dimension name="message_clarity" mean="4.40" std="0.68" mode="5" ci_low="4.09" ci_high="4.71">
      <distribution>
        <score value="1" count="0"/>
        <score value="2" count="1"/>
        <score value="3" count="2"/>
        <score value="4" count="8"/>
        <score value="5" count="9"/>
      </distribution>
      <highlights>
        <highlight valence="positive" persona="Ligaya Fuentes">It's short and says everything — cheap and tasty, and it belongs in every Filipino home. Very clear.</highlight>
        <highlight valence="positive" persona="Felicity Gomez">I understood it immediately. Family, affordable, present. Very Filipino.</highlight>
        <highlight valence="negative" persona="Ana Bautista">Clear enough but doesn't really tell me anything new about the product.</highlight>
      </highlights>
    </dimension>
    <dimension name="personal_relevance" mean="4.10" std="0.85" mode="4" ci_low="3.71" ci_high="4.49">
      <distribution>
        <score value="1" count="0"/>
        <score value="2" count="2"/>
        <score value="3" count="4"/>
        <score value="4" count="9"/>
        <score value="5" count="5"/>
      </distribution>
      <highlights>
        <highlight valence="positive" persona="Nilda Batungbakal">This is my life. When funds are short, Lucky Me is always there. This ad speaks to me.</highlight>
        <highlight valence="positive" persona="Elena Castillo">After everything we went through, Lucky Me was comfort food. This caption brings that back.</highlight>
        <highlight valence="negative" persona="Patricia Abad">I appreciate the sentiment but I'm more into premium noodles now. Doesn't feel like it's for me.</highlight>
      </highlights>
    </dimension>
  </results>
  <hint>Run complete. Use ssr_panel_results with run_id='f9e1c2d3-4a5b-6c7d-8e9f-0a1b2c3d4e5f' to retrieve results, or call ssr_panel_run again with the same panel_id to test Version B.</hint>
</panel-run-complete>
```

---

## Step 8: Daimon Interstitial Message

```
Version A scored. Running Version B now... (~60s)
```

---

## Step 9: Tool Call — `ssr_panel_run` (Version B)

```json
{
  "panel_id": "a3f7b2e1-9d04-4c8a-b561-2e7f90c1d4a8",
  "stimulus_type": "social_caption",
  "stimulus_text": "Luto sa 3 minuto, masustansya pa. Lucky Me — mabilis, mura, masarap.",
  "stimulus_label": "Version B — practical/functional",
  "stimulus_context": null,
  "evaluation_dimensions": ["purchase_intent", "message_clarity", "personal_relevance"],
  "response_format": "summary"
}
```

---

## Step 10: Tool Output — `ssr_panel_run` (Version B)

```xml
<panel-run-complete run_id="a0b1c2d3-e4f5-6789-abcd-ef0123456789" panel_id="a3f7b2e1-9d04-4c8a-b561-2e7f90c1d4a8" personas_scored="20" dimensions="3" status="complete">
  <stimulus type="social_caption" label="Version B — practical/functional">
    Luto sa 3 minuto, masustansya pa. Lucky Me — mabilis, mura, masarap.
  </stimulus>
  <results>
    <dimension name="purchase_intent" mean="3.60" std="0.95" mode="4" ci_low="3.16" ci_high="4.04">
      <distribution>
        <score value="1" count="2"/>
        <score value="2" count="2"/>
        <score value="3" count="5"/>
        <score value="4" count="8"/>
        <score value="5" count="3"/>
      </distribution>
      <highlights>
        <highlight valence="positive" persona="Annalisa Corpuz">Three minutes is exactly why I buy it. This ad gets me — fast, affordable, done.</highlight>
        <highlight valence="positive" persona="Luz Manalo">Quick and cheap — that's what I need. I'd pick it up next time I see it.</highlight>
        <highlight valence="negative" persona="Rosa Dela Paz">"Masustansya" is a stretch. I know what's in it. That claim makes me trust the ad less.</highlight>
      </highlights>
    </dimension>
    <dimension name="message_clarity" mean="4.55" std="0.60" mode="5" ci_low="4.27" ci_high="4.83">
      <distribution>
        <score value="1" count="0"/>
        <score value="2" count="0"/>
        <score value="3" count="3"/>
        <score value="4" count="7"/>
        <score value="5" count="10"/>
      </distribution>
      <highlights>
        <highlight valence="positive" persona="Rowena Alcantara">Straight to the point. Time, nutrition, cost — three things in one line. I like that.</highlight>
        <highlight valence="positive" persona="Rosario Magtanggol">Very clear. I understood everything immediately. No fluff.</highlight>
        <highlight valence="negative" persona="Maricel Domingo">Clear, yes. But saying "masustansya" when I know it has a lot of sodium feels slightly misleading.</highlight>
      </highlights>
    </dimension>
    <dimension name="personal_relevance" mean="3.55" std="1.00" mode="4" ci_low="3.08" ci_high="4.02">
      <distribution>
        <score value="1" count="1"/>
        <score value="2" count="3"/>
        <score value="3" count="6"/>
        <score value="4" count="8"/>
        <score value="5" count="2"/>
      </distribution>
      <highlights>
        <highlight valence="positive" persona="Joy Dela Cruz">This is my life on a busy day. Quick, cheap, and I can eat while working — yes, this is for me.</highlight>
        <highlight valence="negative" persona="Nilda Batungbakal">Functional but cold. It doesn't feel warm or homey. Lucky Me means more to me than just fast and cheap.</highlight>
      </highlights>
    </dimension>
  </results>
  <hint>Run complete. Use ssr_panel_results with comparison_run_id='f9e1c2d3-4a5b-6c7d-8e9f-0a1b2c3d4e5f' to compare Version A vs B.</hint>
</panel-run-complete>
```

---

## Step 11: Daimon Results Post (Discord Message)

The bot synthesizes both results into a comparison post. Because this is a comparison with 3 dimensions in summary format (~1,100 chars), it fits in a single message:

```
**Panel Results: Lucky Me Captions — A vs B**
Panel: Filipino Moms 30-45 · Lucky Me · 20 personas

**A:** *"Ang sarap, tipid pa! Lucky Me — laging presente sa mesa ng pamilya."* (emotional)
**B:** *"Luto sa 3 minuto, masustansya pa. Lucky Me — mabilis, mura, masarap."* (practical)

| Dimension | A Mean | B Mean | Delta |
|-----------|--------|--------|-------|
| Purchase Intent | 3.85 | 3.60 | A +0.25 ↑ |
| Message Clarity | 4.40 | 4.55 | B +0.15 ↑ |
| Personal Relevance | 4.10 | 3.55 | A +0.55 ↑ |

**Version A wins overall** — stronger purchase intent and personal relevance.
Version B is marginally clearer but the emotional appeal of A drives stronger resonance
with this segment. Note: the "masustansya" claim in B created skepticism with health-
aware personas (nurses, health workers).

**Key voice:**
> *"This is my life. When funds are short, Lucky Me is always there."* — Nilda Batungbakal (A, ✅)
> *"Masustansya is a stretch. That claim makes me trust the ad less."* — Rosa Dela Paz (B, ❌)

Run IDs: `f9e1c2d3` (A) · `a0b1c2d3` (B)
```

---

## Step 12: Optional Follow-Up — Detailed Results

If the user follows up asking for more detail:

```
@daimon show me the full distribution for purchase intent on both versions
```

Claude calls `ssr_panel_results` with `response_format="detailed"` for each run and posts in a thread:

**Tool call:**
```json
{
  "run_id": "f9e1c2d3-4a5b-6c7d-8e9f-0a1b2c3d4e5f",
  "response_format": "detailed",
  "comparison_run_id": "a0b1c2d3-e4f5-6789-abcd-ef0123456789"
}
```

**Discord thread post:**
```
**Purchase Intent — Detailed Comparison**

**Version A** (emotional) · Mean: 3.85 · Std: 0.91 · Mode: 4 · 95% CI: [3.43–4.27]
1 ▌ 1     2 ▌▌ 2     3 ▌▌▌▌ 4     4 ▌▌▌▌▌▌▌▌▌ 9     5 ▌▌▌▌ 4

Positives:
> *"I'd definitely grab another pack — Lucky Me is always on our table."* — Maria Santos
> *"This made me smile. It's exactly how I feel."* — Corazon Espiritu
> *"This is my life — when funds are short, Lucky Me is always there."* — Nilda Batungbakal

Negatives:
> *"I don't buy Lucky Me as much — I'm cutting sodium."* — Rosa Dela Paz
> *"I've switched to a cheaper brand when Lucky Me is out of stock."* — Celine Vera

---

**Version B** (practical) · Mean: 3.60 · Std: 0.95 · Mode: 4 · 95% CI: [3.16–4.04]
1 ▌▌ 2     2 ▌▌ 2     3 ▌▌▌▌▌ 5     4 ▌▌▌▌▌▌▌▌ 8     5 ▌▌▌ 3

Positives:
> *"Three minutes is exactly why I buy it. This ad gets me."* — Annalisa Corpuz
> *"Quick and cheap — I'd pick it up next time."* — Luz Manalo

Negatives:
> *"Masustansya is a stretch. That claim makes me trust the ad less."* — Rosa Dela Paz
> *"Doesn't feel warm or homey — Lucky Me means more to me than fast and cheap."* — Nilda Batungbakal
```

---

## Summary of Tool Calls in This Example

| Step | Tool | Input Fields | Output |
|------|------|-------------|--------|
| 1 | `ssr_panel_create` | `panel_name`, `demographics` (age 30–45, female, Philippines), `psychographics`, `product_category="instant noodles"`, `panel_size=20` | `panel_id=a3f7b2e1`, 20 personas, `estimated_run_cost_usd=0.0600` |
| 2 | `ssr_panel_run` | `panel_id=a3f7b2e1`, `stimulus_type=social_caption`, stimulus text (Version A), `evaluation_dimensions=[purchase_intent, message_clarity, personal_relevance]` | `run_id=f9e1c2d3`, 3 dimensions scored, highlights |
| 3 | `ssr_panel_run` | Same `panel_id`, Version B stimulus | `run_id=a0b1c2d3`, 3 dimensions scored |
| 4 | `ssr_panel_results` *(optional)* | `run_id=f9e1c2d3`, `response_format=detailed`, `comparison_run_id=a0b1c2d3` | Detailed comparison per dimension |

**Total estimated cost**: 1 panel creation + 2 runs = $0.00 (creation) + $0.06 + $0.06 = **~$0.12**
**Total wall time**: ~15s (panel generation: 20 concurrent personas) + ~60s per run = **~135s**
