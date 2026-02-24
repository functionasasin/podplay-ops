# Philippine Compliance Moats Survey — Reverse Ralph Loop

You are an analysis agent in a ralph loop. Each time you run, you do ONE unit of work, then exit.

## Your Working Directory

You are running from `loops/ph-compliance-moats-reverse/`. All paths below are relative to this directory.

## Your Goal

Systematically survey Philippine legal codes and regulatory agencies to identify niche compliance domains ripe for automation — domains where:

1. **Market size**: Large numbers of Filipinos must do this (filing, computation, compliance)
2. **Professional moat**: Lawyers, accountants, or specialists currently gatekeep the process
3. **Computability**: The core logic is deterministic (statutes define fractions, thresholds, graduated rates, conditional rules)
4. **Pain/friction**: Current process is slow, expensive, confusing, or multi-agency

The inheritance engine proved this thesis: Philippine succession law is 100% computable, yet Filipinos pay P50K-200K for lawyers to do arithmetic the Civil Code already defines. This loop finds the next 15-20 domains where the same pattern holds.

### Exclusions

- **Estate tax** — already covered by `estate-tax-reverse`
- **Inheritance/succession distribution** — already covered by `inheritance-reverse` + `inheritance-rust-forward`
- Note these as "already in progress" if encountered, but do not analyze further

### Output

A single ranked shortlist document: `analysis/ranked-shortlist.md`

Each domain entry includes:
- Domain name and one-line description
- Governing law / regulation (specific code + sections)
- Market size estimate (annual transactions or affected population)
- Current professional cost range
- Computability assessment (fully deterministic / mostly deterministic / requires judgment)
- Pain score (1-5 scale with rationale)
- Overall opportunity score (weighted composite)
- 1-2 paragraph rationale explaining why this is automatable

## What To Do This Iteration

1. **Read the frontier**: Open `frontier/aspects.md`
2. **Find the first unchecked `- [ ]` aspect** in dependency order (Wave 1 before Wave 2 before Wave 3)
   - If ALL aspects are checked `- [x]`: write convergence summary to `status/converged.txt` and exit
   - Wave 2 aspects are blocked until ALL Wave 1 aspects are complete
   - Wave 3 aspects are blocked until ALL Wave 2 aspects are complete
3. **Analyze that ONE aspect** using the appropriate method (see below)
4. **Write findings** to `analysis/{aspect-name}.md`
5. **Update the frontier**:
   - Mark the aspect as `- [x]`
   - Update Statistics (increment Analyzed, decrement Pending, update Convergence %)
   - If you discovered new aspects, add them to the appropriate Wave
   - Add a row to `frontier/analysis-log.md`
6. **Commit**: `git add -A && git commit -m "loop(ph-compliance-moats-reverse): {aspect-name}"`
7. **Exit**

## Analysis Methods

### Wave 1: Source Scanning (12 aspects)

For each legal code or agency assigned as an aspect:

1. **Fetch the source text** — Use WebFetch to retrieve the actual legal code or regulation.
   Key sources:
   - lawphil.net for codified laws (Civil Code, Labor Code, NIRC, Corporation Code, etc.)
   - bir.gov.ph for BIR forms, revenue regulations, revenue memorandum circulars
   - sec.gov.ph for SEC filing requirements and forms
   - dole.gov.ph for labor compliance requirements
   - Official Gazette (officialgazette.gov.ph) for executive orders, proclamations

2. **Identify computation-heavy sections** — Scan for:
   - Fractional shares, percentages, graduated rate tables
   - Threshold-based rules (if X > Y, then Z)
   - Multi-step computations (gross -> deductions -> net -> rate -> tax)
   - Conditional logic trees (if married, if minor, if resident, etc.)
   - Time-based rules (prescriptive periods, aging computations)
   - Penalty/interest computations (surcharges, interest rates on delinquency)

3. **For each domain found**, document:
   - **Domain name** and brief description
   - **Governing sections** (e.g., "NIRC Sec. 24-25" for individual income tax)
   - **Computation sketch** — high-level input -> output description
   - **Who currently does this** — lawyers, CPAs, HR departments, the person themselves?
   - **Rough market size** — how many people/businesses deal with this annually?
   - **Professional fee range** — what do specialists charge? (use WebSearch if needed)
   - **Pain indicators** — BIR penalties for late filing, common errors, confusing forms

4. **Write analysis** to `analysis/wave1-{aspect-name}.md`

### Sources per aspect

| Aspect | Primary Sources |
|--------|----------------|
| nirc-income-tax | NIRC Title II (Sec. 21-73), BIR Forms 1700/1701/1702/1701Q |
| nirc-other-taxes | NIRC Titles IV-VII, BIR Forms 2550/2551/2000 series |
| labor-code-wages | Labor Code Book III (Art. 82-134), DOLE wage orders |
| labor-code-termination | Labor Code Book VI (Art. 278-302), RA 7641 (Retirement) |
| corporation-code | RA 11232, SEC forms, annual compliance calendar |
| family-code | EO 209 (Family Code), RA 8552 (Adoption), RA 9262 (VAWC) |
| civil-code-obligations | Civil Code Book IV (Art. 1156-2270), interest/damages |
| insurance-code | RA 10607, Insurance Commission circulars |
| bir-forms-catalog | bir.gov.ph/forms, all numbered BIR forms requiring computation |
| sec-filings-catalog | sec.gov.ph filing requirements, GIS, AFS, beneficial ownership |
| dole-compliance | DOLE compliance requirements, OSH standards (RA 11058) |
| lgu-real-property | RA 7160 Book II (Local Taxation), PD 1529 (Property Registration) |

### Wave 2: Cross-Reference and Scoring (3 aspects)

- **deduplicate-and-merge** — Read all `analysis/wave1-*.md` files. Consolidate domains found across multiple Wave 1 sources (e.g., "withholding tax" might appear in both nirc-income-tax and bir-forms-catalog). Produce a clean master list in `analysis/master-domain-list.md` with one entry per unique domain.

- **score-domains** — For each domain in `analysis/master-domain-list.md`, compute a weighted score:
  - Market size (1-5): 1 = <10K affected/year, 2 = 10K-100K, 3 = 100K-500K, 4 = 500K-1M, 5 = >1M
  - Moat depth (1-5): 1 = DIY-able, 2 = online tools exist, 3 = needs CPA/bookkeeper, 4 = needs lawyer/specialist, 5 = requires specialist + P50K+ fees
  - Computability (1-5): 1 = requires significant judgment, 2 = mostly judgment with some rules, 3 = rule-heavy with some judgment, 4 = mostly deterministic with edge cases, 5 = fully deterministic from statute
  - Pain/friction (1-5): 1 = simple/fast process, 2 = mildly annoying, 3 = confusing forms or multi-step, 4 = multi-agency + penalties, 5 = multi-agency + high penalties + long timelines
  - **Opportunity score** = (Market x 0.25) + (Moat x 0.25) + (Computability x 0.30) + (Pain x 0.20)
  Write to `analysis/scored-domains.md`.

- **professional-fees-validation** — WebSearch for actual professional service pricing for the top 10 scoring domains. Validate that the moat is real, not just theoretical. Update scores in `analysis/scored-domains.md` if pricing data contradicts initial moat estimates.

### Wave 3: Synthesis (1 aspect)

- **ranked-shortlist** — Read `analysis/scored-domains.md`. Sort all domains by opportunity score (descending). For each domain, write a 1-2 paragraph rationale:
  - Why it's automatable (cite specific statutory sections with the deterministic rules)
  - What the "inheritance engine equivalent" would look like (inputs -> computation -> outputs)
  - What professional moat it disrupts and the current cost
  - Rough comparable: "This is like inheritance but for ___"
  Produce final `analysis/ranked-shortlist.md`.
  Include a "Next Steps" section identifying the top 3 candidates for a full reverse ralph loop, with a 2-3 sentence description of what each loop would produce.

## Rules

1. **Do ONE aspect per run, then exit.** Do not combine aspects.
2. **Check dependencies before starting.** Wave 2 requires all Wave 1 complete. Wave 3 requires all Wave 2 complete.
3. **One analysis file per Wave 1 aspect** — write to `analysis/wave1-{aspect-name}.md`
4. **Cite specific sections** — every domain must reference specific statutory sections, not vague "Labor Code" references
5. **Philippine-specific only** — do not include generic business processes that aren't driven by Philippine statute/regulation
6. **Exclude inheritance and estate tax** — already covered by sibling loops. Note them as "already in progress" if encountered.
7. **Computability is the key filter** — if a domain requires significant human judgment (e.g., litigation strategy, contract negotiation), it's not a candidate. Focus on domains where the statute defines the math.
8. **Market size should be grounded** — use PSA data, BIR annual reports, SEC statistics where available via WebSearch. Avoid unsourced guesses.
9. **Professional fees should be validated** — don't assume moat depth. Use WebSearch to look for actual service pricing from law firms, CPA firms, HR consultancies.
10. **WebSearch is your primary research tool** — use it aggressively for Philippine government statistics, professional pricing, legal text lookups.
11. **When in doubt, include it** — it's better to surface a marginal domain and score it low than to miss a hidden gem. The scoring system will sort it out.
12. **Discover new aspects** — if scanning a source reveals a sub-domain complex enough to warrant its own aspect, add it to the frontier in the appropriate Wave.
