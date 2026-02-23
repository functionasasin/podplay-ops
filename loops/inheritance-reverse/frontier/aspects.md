# Analysis Frontier — Inheritance Distribution Engine

## Statistics
- Total aspects discovered: 28
- Analyzed: 6
- Pending: 22
- Convergence: 21.4%

## Pending Aspects (ordered by dependency)

### Wave 1: Legal Source Acquisition
- [x] legal-source-fetch — Fetch and cache Civil Code Book III (Succession), Family Code (filiation), RA 8552 (adoption), legal commentaries
- [x] commentary-fetch — Find and cache 5-8 worked examples of Philippine inheritance distribution computations

### Wave 2: Heir Classification Rules
- [x] compulsory-heirs-categories — Art. 887: enumerate all compulsory heir categories (legitimate children/descendants, illegitimate children, surviving spouse, legitimate parents/ascendants)
- [x] heir-concurrence-rules — Arts. 888-903: which heirs inherit together, who excludes whom from succession
- [x] representation-rights — Arts. 970-977: when descendants step into the shoes of a predeceased parent
- [x] adopted-children-rights — RA 8552 Sec. 17-18 + Family Code: adopted children's legal equivalence to legitimate children
- [ ] illegitimate-children-rights — Art. 176 Family Code, Art. 895 Civil Code: recognition, half-share rule, proof of filiation

### Wave 3: Legitime Computation
- [ ] legitime-table — Arts. 888-903: complete legitime fraction table for every possible heir combination
- [ ] legitime-with-illegitimate — half-share computation when legitimate and illegitimate children concur (Art. 895)
- [ ] legitime-surviving-spouse — Arts. 892, 893, 896-900: spouse's legitime varying by who they concur with (children, parents, alone)
- [ ] legitime-ascendants — Arts. 889-891: parents/ascendants' legitime when there are no descendants
- [ ] free-portion-rules — computation of disposable free portion: total estate minus total legitime of all compulsory heirs

### Wave 4: Distribution Rules
- [ ] intestate-order — Arts. 960-1014: complete priority order for intestate succession (descendants → ascendants → spouse → collaterals → state)
- [ ] testate-institution — Arts. 840-856: institution of heirs in a will, conditions, modal institutions
- [ ] testate-validation — algorithm for checking if a will respects all compulsory heirs' legitime (inofficious disposition reduction)
- [ ] disinheritance-rules — Arts. 915-923: valid grounds for disinheritance, effect on disinherited heir's descendants
- [ ] preterition — Art. 854: effect of totally omitting a compulsory heir from a will (annuls institution, preserves legacies/devises if within free portion)
- [ ] accretion-rules — Arts. 1015-1023: how a vacant share distributes to co-heirs
- [ ] collation — Arts. 1061-1077: accounting for inter vivos donations/advances when computing legitime and free portion

### Wave 5: Synthesis
- [ ] computation-pipeline — end-to-end computation flow: inputs → heir classification → legitime → free portion → distribution → per-heir amounts → narrative
- [ ] data-model — complete type definitions (Decedent, Heir, Will, HeirCategory, InheritanceShare, etc.)
- [ ] test-vectors — 10+ complete test cases across intestate, testate, mixed, with illegitimate children, adopted children, representation, preterition
- [ ] explainer-format — template for per-heir plain-English narrative explanations with peso amounts and article citations
- [ ] edge-cases — catalog of all edge cases: renunciation, commorientes, unworthiness, reserva troncal, collation
- [ ] spec-draft — synthesize all analysis into complete software spec at `../../docs/plans/inheritance-engine-spec.md`
- [ ] spec-review — self-review: can a developer with no Philippine law knowledge build the engine from this spec?

## Recently Analyzed
- **legal-source-fetch** (2026-02-23): Fetched and cached 4 legal source files covering Civil Code Book III (succession arts. 774-1077), Family Code Title VI (filiation arts. 163-182), RA 8552 (adoption secs. 16-20), and comprehensive commentary with 11 testate scenarios, 15 intestate scenarios, and 7 worked examples.
- **commentary-fetch** (2026-02-23): Compiled 8 complete test-vector-quality worked examples covering: testate simple, inofficious will, preterition, disinheritance with representation, adopted children, mixed succession, collation, and complex intestate with representation. Also confirmed complete 15-row legitime table. Saved to `input/legal-sources/worked-examples.md`.
- **compulsory-heirs-categories** (2026-02-23): Analyzed Art. 887 compulsory heir enumeration. Defined 4 effective categories (LEGITIMATE_CHILD_GROUP, LEGITIMATE_ASCENDANT_GROUP, SURVIVING_SPOUSE_GROUP, ILLEGITIMATE_CHILD_GROUP) with 7 raw sub-categories. Key: adopted (RA 8552) and legitimated (FC 179) children map to legitimate child group. Groups 1 & 2 mutually exclusive; Groups 3 & 4 always concur. Documented 8 edge cases (rescinded adoption, posthumous child, guilty spouse, unproved filiation, unworthiness, articulo mortis, stepparent adoption, parents of illegitimate decedent). Proposed data model for Heir struct. 16 test case scenarios identified.
- **heir-concurrence-rules** (2026-02-23): Complete concurrence and exclusion analysis. Defined 4 exclusion rules (primary vs secondary, concurring heirs never excluded, nearer excludes more remote, intestate-only hierarchy). Mapped 13 testate scenarios (T1-T13) + 2 special (T14-T15 for illegitimate decedent) and 15 intestate scenarios (I1-I15). Key insights: testate vs intestate produce DIFFERENT shares for same heir combo; Art. 895 ¶3 cap rule limits illegitimate children when many concur; Art. 892 branches on count=1 vs count≥2 legitimate children; collateral relatives only in intestate when all 4 compulsory groups absent (except spouse+siblings per Art. 1001). Pseudocode for concurrence determination algorithm, eligibility filter, and cap rule. 21 test scenarios identified.
- **representation-rights** (2026-02-23): Complete analysis of Arts. 970-977 right of representation. Defined 4 triggers (predecease, disinheritance, incapacity/unworthiness) and 1 non-trigger (renunciation per Art. 977). Key rules: per stirpes distribution (Art. 974), lines-not-heads counting for concurrence, recursive multi-level representation in descending line with no depth limit, collateral representation limited to children of siblings only (Art. 972) with per-capita switch when alone (Art. 975), renunciation asymmetry (Arts. 976 vs 977), illegitimate children can be represented (Art. 902). Introduced Step 1.5 "Build Lines" to pipeline between heir classification and concurrence. 9 edge cases, 22 test scenarios.
- **adopted-children-rights** (2026-02-23): Deep analysis of adopted children's succession rights under dual legal regimes: RA 8552 (1998) and RA 11642 (2022). Core rule: adopted child = legitimate child for ALL computation purposes (no distinction allowed). Key discovery: RA 11642 Sec. 41 breaks the old "exclusivity rule" — filiation now extends to adopter's parents, siblings, and descendants, enabling inheritance from/to adopter's relatives. Analyzed stepparent adoption (biological ties preserved for spouse-parent), rescission timing effects, Art. 984 supersession, preterition applicability, and transitional regime handling. Added Adoption struct to data model with regime tracking. 18 test scenarios, 8 edge cases including the RA 8552/11642 transitional ambiguity for pre-2022 adoptions.
