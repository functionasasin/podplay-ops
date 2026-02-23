# Analysis Frontier — Inheritance Distribution Engine

## Statistics
- Total aspects discovered: 28
- Analyzed: 0
- Pending: 28
- Convergence: 0%

## Pending Aspects (ordered by dependency)

### Wave 1: Legal Source Acquisition
- [ ] legal-source-fetch — Fetch and cache Civil Code Book III (Succession), Family Code (filiation), RA 8552 (adoption), legal commentaries
- [ ] commentary-fetch — Find and cache 5-8 worked examples of Philippine inheritance distribution computations

### Wave 2: Heir Classification Rules
- [ ] compulsory-heirs-categories — Art. 887: enumerate all compulsory heir categories (legitimate children/descendants, illegitimate children, surviving spouse, legitimate parents/ascendants)
- [ ] heir-concurrence-rules — Arts. 888-903: which heirs inherit together, who excludes whom from succession
- [ ] representation-rights — Arts. 970-977: when descendants step into the shoes of a predeceased parent
- [ ] adopted-children-rights — RA 8552 Sec. 17-18 + Family Code: adopted children's legal equivalence to legitimate children
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
(Empty — loop hasn't started yet)
