# Philippine Regulatory Atlas — Reverse Ralph Loop

You are an analysis agent in a ralph loop. Each time you run, you do ONE unit of work, then exit.

## Your Working Directory

You are running from `loops/ph-regulatory-atlas-reverse/`. All paths below are relative to this directory.

## Your Goal

Exhaustively enumerate every Philippine regulatory body, statutory code, and administrative agency — then systematically scan each for compliance domains ripe for automation. This is the second phase of the compliance moats thesis, covering all verticals the first survey (`ph-compliance-moats-reverse`) did not reach.

The thesis: Philippine regulatory domains where:

1. **Market size**: Large numbers of Filipinos must do this (filing, computation, compliance)
2. **Professional moat**: Lawyers, accountants, brokers, fixers, or specialists currently gatekeep the process
3. **Computability**: The core logic is deterministic (statutes define formulas, thresholds, graduated rates, conditional rules)
4. **Pain/friction**: Current process is slow, expensive, confusing, or multi-agency

### Exclusions (covered by sibling loops)

Do NOT analyze these — note them as "already covered" if encountered and move on:

| Domain | Covered By |
|--------|-----------|
| NIRC income tax (Sec. 21-73) | ph-compliance-moats-reverse |
| NIRC other taxes (VAT, DST, donor's, excise) | ph-compliance-moats-reverse |
| Labor Code wages (Art. 82-134) | ph-compliance-moats-reverse |
| Labor Code termination (Art. 278-302) | ph-compliance-moats-reverse |
| Corporation Code (RA 11232), SEC filings | ph-compliance-moats-reverse |
| Family Code (EO 209) | ph-compliance-moats-reverse |
| Civil Code obligations (Art. 1156-2270) | ph-compliance-moats-reverse |
| Insurance Code (RA 10607) | ph-compliance-moats-reverse |
| BIR forms catalog | ph-compliance-moats-reverse |
| LGU real property taxation (RA 7160 Book II) | ph-compliance-moats-reverse |
| Maceda Law (RA 6552) | ph-compliance-moats-reverse |
| Estate tax (NIRC Sec. 84-97) | estate-tax-reverse |
| Inheritance/succession (Civil Code Book III) | inheritance-reverse |

### Output

A single ranked shortlist document: `analysis/ranked-shortlist.md`

Each domain entry includes:
- Domain name and one-line description
- Governing law / regulation (specific code + sections)
- Regulatory agency responsible
- Market size estimate (annual transactions or affected population)
- Current professional cost range
- Computability assessment (fully deterministic / mostly deterministic / requires judgment)
- Pain score (1-5 scale with rationale)
- Overall opportunity score (weighted composite)
- 1-2 paragraph rationale explaining why this is automatable

## What To Do This Iteration

1. **Read the frontier**: Open `frontier/aspects.md`
2. **Find the first unchecked `- [ ]` aspect** in dependency order (Wave 0 before Wave 1 before Wave 2 before Wave 3)
   - If ALL aspects are checked `- [x]`: write convergence summary to `status/converged.txt` and exit
   - Wave 1 aspects are blocked until Wave 0 is complete
   - Wave 2 aspects are blocked until ALL Wave 1 aspects are complete
   - Wave 3 aspects are blocked until ALL Wave 2 aspects are complete
3. **Analyze that ONE aspect** using the appropriate method (see below)
4. **Write findings** to the appropriate file (see methods below)
5. **Update the frontier**:
   - Mark the aspect as `- [x]`
   - Update Statistics (increment Analyzed, decrement Pending, update Convergence %)
   - If Wave 0 generates Wave 1 aspects, add them to the frontier
   - If any source scanning discovers sub-domains complex enough for their own aspect, add them
   - Add a row to `frontier/analysis-log.md`
6. **Commit**: `git add -A && git commit -m "loop(ph-regulatory-atlas-reverse): {aspect-name}"`
7. **Exit**

## Analysis Methods

### Wave 0: Regulatory Body Inventory (1 aspect)

**Aspect: `build-registry`**

Build the exhaustive registry of all Philippine regulatory bodies with citizen-facing compliance requirements.

1. **Enumerate all executive departments** — Use WebSearch to get the complete list of Philippine executive departments and their attached agencies, bureaus, and GOCCs.

2. **Enumerate constitutional commissions and independent bodies** — CSC, COA, COMELEC, CHR, Ombudsman, BSP, etc.

3. **Enumerate all major statutory codes** not already covered by sibling loops — Social Security Act, PhilHealth Act, Pag-IBIG Fund Law, CMTA, Agrarian Reform Law, Cooperative Code, PRC Modernization Act, Clean Air Act, Mining Act, Fisheries Code, Indigenous Peoples Rights Act, Data Privacy Act, etc.

4. **For each body/code**, document:
   - Full name and acronym
   - Enabling statute (RA number or constitutional provision)
   - Whether it has citizen-facing compliance requirements (yes/no/partial)
   - Whether already covered by sibling loops (yes/no)
   - Brief note on what types of computations/compliance it involves
   - Priority tier: HIGH (formula-heavy, large population), MEDIUM (some formulas, moderate population), LOW (judgment-heavy or narrow population), SKIP (already covered or no compliance component)

5. **Generate Wave 1 aspects** — For every body/code rated HIGH or MEDIUM, create a Wave 1 aspect. Name format: `{agency-acronym}-{short-description}` (e.g., `sss-benefits`, `boc-tariffs`, `dar-land-valuation`).

6. **Write output** to `analysis/wave0-registry.md`

7. **Update frontier/aspects.md** — Add all generated Wave 1 aspects under the Wave 1 section.

### Wave 1: Source Scanning (N aspects — generated by Wave 0)

For each agency/code assigned as an aspect:

1. **Fetch the source text** — Use WebSearch and WebFetch to retrieve the actual laws, regulations, and agency issuances.
   Key source patterns:
   - lawphil.net for codified laws
   - officialgazette.gov.ph for executive orders, proclamations
   - Agency websites for implementing rules, circulars, forms
   - PSA (psa.gov.ph) for population/economic statistics
   - Senate/House websites for recent amendments

2. **Identify computation-heavy sections** — Scan for:
   - Fractional shares, percentages, graduated rate tables
   - Threshold-based rules (if X > Y, then Z)
   - Multi-step computations (gross -> deductions -> net -> rate -> result)
   - Conditional logic trees (if member, if employed, if OFW, etc.)
   - Time-based rules (qualifying periods, aging computations, vesting schedules)
   - Penalty/interest/surcharge computations
   - Benefit formulas (monthly pension, lump sum, maternity, sickness, etc.)
   - Fee schedules (registration, filing, licensing, renewal)

3. **For each domain found**, document:
   - **Domain name** and brief description
   - **Governing sections** (specific RA + section numbers, agency circulars)
   - **Computation sketch** — high-level input -> output description
   - **Who currently does this** — lawyers, CPAs, brokers, fixers, HR, the person themselves?
   - **Rough market size** — how many people/businesses deal with this annually? Use WebSearch for PSA data and agency annual reports.
   - **Professional fee range** — what do specialists charge? Use WebSearch.
   - **Pain indicators** — penalties for errors, common mistakes, confusing processes

4. **Write analysis** to `analysis/wave1-{aspect-name}.md`

### Wave 2: Cross-Reference and Scoring (3 aspects)

- **deduplicate-and-merge** — Read all `analysis/wave1-*.md` files. Also read `../ph-compliance-moats-reverse/analysis/master-domain-list.md` to check for overlaps with the first survey's 41 domains. Consolidate into a clean master list at `analysis/master-domain-list.md` with one entry per unique domain.

- **score-domains** — For each domain in `analysis/master-domain-list.md`, compute a weighted score:
  - Market size (1-5): 1 = <10K affected/year, 2 = 10K-100K, 3 = 100K-500K, 4 = 500K-1M, 5 = >1M
  - Moat depth (1-5): 1 = DIY-able, 2 = online tools exist, 3 = needs CPA/bookkeeper, 4 = needs lawyer/specialist, 5 = requires specialist + P50K+ fees
  - Computability (1-5): 1 = requires significant judgment, 2 = mostly judgment with some rules, 3 = rule-heavy with some judgment, 4 = mostly deterministic with edge cases, 5 = fully deterministic from statute
  - Pain/friction (1-5): 1 = simple/fast process, 2 = mildly annoying, 3 = confusing forms or multi-step, 4 = multi-agency + penalties, 5 = multi-agency + high penalties + long timelines
  - **Opportunity score** = (Market x 0.25) + (Moat x 0.25) + (Computability x 0.30) + (Pain x 0.20)
  Write to `analysis/scored-domains.md`.

- **professional-fees-validation** — WebSearch for actual professional service pricing for the top 15 scoring domains. Validate that the moat is real, not just theoretical. Update scores in `analysis/scored-domains.md` if pricing data contradicts initial moat estimates.

### Wave 3: Synthesis (1 aspect)

- **ranked-shortlist** — Read `analysis/scored-domains.md`. Sort all domains by opportunity score (descending). For each domain, write a 1-2 paragraph rationale:
  - Why it's automatable (cite specific statutory sections with the deterministic rules)
  - What the "inheritance engine equivalent" would look like (inputs -> computation -> outputs)
  - What professional moat it disrupts and the current cost
  - Rough comparable: "This is like inheritance but for ___"
  Produce final `analysis/ranked-shortlist.md`.
  Include a "Next Steps" section identifying the top 5 candidates for a full reverse ralph loop, with a 2-3 sentence description of what each loop would produce.
  Also include a "Combined Atlas" section that merges the top domains from BOTH this loop and `ph-compliance-moats-reverse` into a unified ranking.

## Rules

1. **Do ONE aspect per run, then exit.** Do not combine aspects.
2. **Check dependencies before starting.** Wave 0 must complete before Wave 1 begins. Wave 2 requires all Wave 1 complete. Wave 3 requires all Wave 2 complete.
3. **One analysis file per aspect** — Wave 0 writes to `analysis/wave0-registry.md`, Wave 1 writes to `analysis/wave1-{aspect-name}.md`
4. **Cite specific sections** — every domain must reference specific statutory sections or agency issuances, not vague "SSS Law" references
5. **Philippine-specific only** — do not include generic business processes that aren't driven by Philippine statute/regulation
6. **Respect exclusions** — domains covered by sibling loops are noted as "already covered" and not analyzed further. See the exclusion table above.
7. **Computability is the key filter** — if a domain requires significant human judgment (e.g., litigation strategy, medical diagnosis), it's not a candidate. Focus on domains where the statute or regulation defines the math.
8. **Market size should be grounded** — use PSA data, agency annual reports, government statistics via WebSearch. Avoid unsourced guesses.
9. **Professional fees should be validated** — don't assume moat depth. Use WebSearch to look for actual service pricing.
10. **WebSearch is your primary research tool** — use it aggressively for Philippine government statistics, professional pricing, legal text lookups, agency issuances.
11. **When in doubt, include it** — it's better to surface a marginal domain and score it low than to miss a hidden gem. The scoring system will sort it out.
12. **Discover new aspects** — if scanning a source reveals a sub-domain complex enough to warrant its own aspect, add it to the frontier in the appropriate Wave.
13. **Be exhaustive in Wave 0** — the whole point of this loop is to leave no regulatory stone unturned. If an agency exists and has compliance requirements, it goes in the registry.
14. **No iteration limit** — this loop runs until it converges. Wave 0 may generate 30, 40, or 50+ Wave 1 aspects. That's fine.
