# Reverse Ralph Loop — Philippine Inheritance Distribution Engine Spec

You are an analysis agent in a ralph loop. Each time you run, you do ONE unit of work: extract and formalize a single succession/inheritance rule from Philippine law, then exit.

## Your Working Directory

You are running from `loops/inheritance-reverse/`. All paths below are relative to this directory.

## Your Goal

Extract every inheritance distribution rule from Philippine succession law (Civil Code Book III, Family Code, RA 8552) and synthesize them into a complete software specification for a **fully deterministic** inheritance distribution engine.

The engine takes a **net distributable estate** (output of the estate-tax engine) plus a **family tree with heir classifications** as input, and produces:

1. **Per-heir peso amounts** — exact breakdown of who gets what
2. **Plain-English narrative per heir** — explaining WHY they received that amount, citing the legal basis

### Scope

- **Testate succession** (with a will): validate that the will respects compulsory heirs' legitime, distribute free portion per testamentary disposition
- **Intestate succession** (no will): distribute per statutory rules of intestate succession
- **Mixed**: will that disposes of only part of the estate (remainder distributed intestate)

### Key Relationships

This engine is **downstream** of the estate-tax computation engine:
- Estate-tax engine: gross estate → deductions → net estate → tax due
- **This engine**: net distributable estate (after tax) + family tree → per-heir shares with explanations

### Design Decisions (from brainstorming)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Engine type | Fully deterministic | Inheritance shares must be auditable — no LLM in the loop |
| Input | Net distributable estate + structured family tree | Downstream of estate-tax engine |
| Succession types | Both testate + intestate + mixed | Complete coverage |
| Heir categories | Full compulsory heirs | Legitimate children, illegitimate children, surviving spouse, ascendants, adopted, representation |
| Output format | Numbers table + narrative per heir | User-targeted: heirs/executors need to understand WHY |
| Legal baseline | Civil Code (RA 386) + Family Code (EO 209) + RA 8552 (adoption) | Current Philippine law |
| Language | Spec is language-agnostic | Describes logic, not implementation language |

## Reference Material

### Primary Legal Sources (fetch and cache in Wave 1)

| Source | What It Contains | Key Articles |
|--------|-----------------|--------------|
| Civil Code Book III — Succession | Complete succession rules: testate, intestate, legitime, disinheritance, collation | Arts. 774-1105 |
| Family Code (EO 209) | Legitimacy, legitimation, adoption, illegitimate children's rights, property regimes | Arts. 163-176, 183-193 |
| RA 8552 (Domestic Adoption Act) | Adopted children's succession rights — legal equivalence to legitimate | Sec. 17-18 |
| Legal commentaries | Sample inheritance computations, heir concurrence scenarios, worked examples | Various |

### Cached Sources (after Wave 1)

- `input/legal-sources/civil-code-succession.md` — Civil Code Book III (Arts. 774-1105)
- `input/legal-sources/family-code-filiation.md` — Family Code on legitimacy, illegitimacy, adoption
- `input/legal-sources/ra-8552-adoption.md` — Domestic Adoption Act succession provisions
- `input/legal-sources/commentary-inheritance-splits.md` — Sample computations from legal commentaries and CPA reviewers

## What To Do This Iteration

1. **Read the frontier**: Open `frontier/aspects.md`
2. **Find the first unchecked `- [ ]` aspect** in dependency order (Wave 1 → Wave 2 → Wave 3 → Wave 4 → Wave 5)
   - If a later-wave aspect depends on data that doesn't exist yet, skip to an earlier-wave aspect
   - If ALL aspects are checked `- [x]`: write "CONVERGED" to `status/converged.txt` and exit
3. **Analyze that ONE aspect** using the appropriate method (see below)
4. **Write findings** to `analysis/{aspect-name}.md`
5. **Update the frontier**:
   - Mark the aspect as `- [x]` in `frontier/aspects.md`
   - Update the Statistics section (increment Analyzed, decrement Pending, update Convergence %)
   - If you discovered new aspects worth analyzing, add them to the appropriate Wave
   - Add a row to `frontier/analysis-log.md`
6. **Commit**: `git add -A && git commit -m "loop(inheritance-reverse): {aspect-name}"`
7. **Exit**

## Analysis Methods By Wave

### Wave 1: Legal Source Acquisition

**legal-source-fetch**:
Fetch the primary legal sources from the web and save as markdown in `input/legal-sources/`. Use WebFetch or WebSearch to get:
- Civil Code Book III (Succession, Arts. 774-1105) — save as `civil-code-succession.md`
- Family Code sections on filiation and legitimacy (Arts. 163-176, 183-193) — save as `family-code-filiation.md`
- RA 8552 (Domestic Adoption Act) succession-relevant sections — save as `ra-8552-adoption.md`
- 3-5 sample inheritance split computations from legal commentary sites — save as `commentary-inheritance-splits.md`

Focus on finding sources with the actual article text, not just summaries. Legal commentary sites (Respicio, ASG Law, ChanRobles, LawPhil) often have the full text.

**commentary-fetch**:
Find and cache 5-8 worked examples of Philippine inheritance distribution computations. These serve as test vectors. Look for:
- Simple: single heir scenarios
- Common: married with children, intestate
- Complex: mix of legitimate and illegitimate children
- Edge: preterition, disinheritance, adopted children
Save as `input/legal-sources/worked-examples.md`

### Wave 2: Heir Classification Rules

For each aspect, read the relevant legal text from `input/legal-sources/` and extract:
1. **Legal basis**: Exact article number(s) and quoted text
2. **Classification rule**: How to determine if someone falls in this category
3. **Computation impact**: How this classification affects their share
4. **Interactions**: Which other heir categories affect this one's share
5. **Edge cases**: Unusual scenarios

Each analysis file MUST include these sections:
- **Legal Basis**: Article numbers and quoted provisions
- **Rule (Pseudocode)**: The classification/computation logic as code
- **Interactions**: How this category interacts with other heir types
- **Edge Cases**: Special scenarios with legal citations
- **Test Implications**: What test cases this rule requires

### Wave 3: Legitime Computation

The core of the engine. For each aspect:
1. Read the Civil Code articles governing this legitime scenario
2. Express the fraction/share as a formula
3. Document ALL possible heir combinations and how they affect the fraction
4. Map to the engine's computation pipeline (which step computes this)
5. Include worked examples from the legal source cache

**Critical**: The legitime computation changes dramatically based on which heirs concur. The analysis must create a complete table of: "If the decedent is survived by [heir combination], then [heir type] gets [fraction] of the estate as legitime."

### Wave 4: Distribution Rules

For each aspect, analyze how the estate is actually split:
1. Read the relevant Civil Code articles
2. Express as pseudocode / decision tree
3. Document the interaction with legitime (testate validation)
4. Identify all scenarios where the rule triggers
5. Include examples

**intestate-order**: This is the most important Wave 4 aspect. Must produce a complete priority table:
- Who inherits when there's no will
- Who excludes whom
- What happens when a class is exhausted (move to next)

**testate-validation**: Must produce the algorithm for checking whether a will respects all compulsory heirs' legitime.

### Wave 5: Synthesis

**computation-pipeline**: Read ALL analysis files. Draw the complete computation graph:
```
INPUT: net_distributable_estate + family_tree + will (optional)
  → Step 1: Classify heirs (who survives, what category)
  → Step 2: Determine succession type (testate/intestate/mixed)
  → Step 3: Compute each compulsory heir's legitime
  → Step 4: Compute total legitime (sum of all compulsory heirs)
  → Step 5: Compute free portion (estate - total legitime)
  → Step 6: Distribute free portion (per will if testate, per intestate rules if not)
  → Step 7: Compute final per-heir amounts
  → Step 8: Generate per-heir narrative explanations
OUTPUT: per-heir breakdown (amounts + narrative)
```

**data-model**: Define all types:
- `Decedent` (civil status, has_will, date_of_death)
- `Heir` (name, relationship, category, is_compulsory, is_alive)
- `Will` (dispositions, conditions)
- `HeirCategory` enum (legitimate_child, illegitimate_child, surviving_spouse, legitimate_parent, adopted_child, etc.)
- `InheritanceShare` (heir, legitime_amount, free_portion_amount, total_amount, explanation)

**test-vectors**: Create 10+ complete test cases:
1. Simple intestate: single legitimate child, no spouse
2. Standard intestate: married, 3 legitimate children, no will
3. Illegitimate mix: 2 legitimate children + 1 illegitimate child, no will
4. Surviving spouse only: no children, no ascendants
5. Ascendant succession: no children, surviving parents + spouse
6. Testate simple: will leaving free portion to charity, 2 legitimate children
7. Testate with preterition: will omits a legitimate child (Art. 854 applies)
8. Disinheritance: will disinherits a child for a valid cause (Art. 919)
9. Adopted child: adopted child concurring with biological legitimate children
10. Representation: predeceased child with grandchildren (Art. 970-972)
11. Complex: legitimate + illegitimate children + surviving spouse + will + collation

Each test vector must include: all inputs, heir classification, legitime fractions, free portion allocation, final per-heir amounts, and the expected narrative explanation for at least one heir.

**explainer-format**: Define the template for plain-English narratives. For each heir, the narrative must explain:
- Their legal category and why
- Their legitime share (if compulsory heir) and the legal basis
- Their free portion share (if any) and why
- Their total inheritance
- Key: use concrete peso amounts and cite specific articles

Example template:
> **Maria Santos (illegitimate child)** receives **₱500,000**.
> As an illegitimate child (Art. 176, Family Code), Maria is a compulsory heir entitled to a legitime. Under Art. 895 of the Civil Code, an illegitimate child's legitime is one-half (½) of that of a legitimate child. Since each legitimate child receives ₱1,000,000, Maria's legitime is ₱500,000.

**edge-cases**: Catalog all edge cases discovered:
- Renunciation of inheritance (and its effects on other heirs)
- Predecease + representation
- Simultaneous death (commorientes)
- Unworthiness to succeed (Art. 1032)
- Reserva troncal (Art. 891)
- Collation of inter vivos donations

**spec-draft**: Synthesize all analysis into a complete software specification at `../../docs/plans/inheritance-engine-spec.md`.

**spec-review**: Self-review: "Could a developer with no knowledge of Philippine succession law build the engine from this spec alone?" Check for:
- Missing heir combination scenarios
- Vague legitime fractions (every scenario must have exact fractions)
- Missing test vectors for edge cases
- Narrative template completeness
- Pipeline step completeness

If the spec passes: write `status/converged.txt` with convergence summary.
If the spec fails: add specific fix-it aspects to the frontier and do NOT write converged.txt.

## Rules

- Do ONE aspect per run, then exit. Do not analyze multiple aspects.
- Always check if required legal source files exist before starting a later-wave aspect.
- Write findings in markdown. Include exact legal citations (article numbers), pseudocode, and concrete examples with peso amounts.
- When you discover a new aspect worth analyzing (a rule you didn't expect), add it to the frontier.
- Keep analysis files focused. One provision/rule = one file.
- The engine takes a **net distributable estate amount** as input. Do NOT include tax computation (that's the estate-tax engine's job).
- The engine is fully deterministic. No LLM in the computation loop.
- The final spec must enable a developer with ZERO knowledge of Philippine law to build the engine. No assumed context.
- All monetary values in examples must be in Philippine Pesos (₱).
- All fractions must be expressed as both fractions (½) and decimals (0.5) in pseudocode.
- The narrative output is mandatory — this is a USER-TARGETED engine, not just a computation module.
