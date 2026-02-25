# Frontier — Philippine Compliance Moats Survey

## Statistics
- Total aspects: 17
- Analyzed: 15
- Pending: 2
- Convergence: 88%

## Wave 1: Source Scanning

- [x] **nirc-income-tax** — NIRC Title II (Sec. 21-73): personal income tax (graduated rates, 8% option), corporate income tax (RCIT, MCIT, OSD), capital gains tax (6% real property, 15% shares), final/creditable withholding taxes, tax credits. BIR Forms 1700/1701/1702/1701Q.
- [x] **nirc-other-taxes** — NIRC Titles IV-VII: VAT (12% output/input, zero-rated, exempt), percentage tax (3% non-VAT), excise tax (ad valorem + specific), documentary stamp tax (rate schedules per instrument type), donor's tax (6% flat post-TRAIN). BIR Forms 2550Q/2551Q/2000-series.
- [x] **labor-code-wages** — Labor Code Book III (Art. 82-134): minimum wage (regional), overtime (25%/30%), night differential (10%), holiday pay (regular/special/double), 13th month pay (RA 10653), service incentive leave, meal/rest periods. DOLE Wage Orders.
- [x] **labor-code-termination** — Labor Code Book VI (Art. 278-302): separation pay (authorized causes: 1/2 month or 1 month per year of service), retirement pay (RA 7641: 1/2 month per year, expanded definition), back wages, final pay computation, illegal dismissal remedies. DOLE Department Orders.
- [x] **corporation-code** — RA 11232 (Revised Corporation Code): incorporation requirements and fees, annual compliance (GIS, AFS, SEC-MC-19 beneficial ownership), stock issuance/transfer computations, dissolution timeline, corporate governance compliance, SEC penalty computations.
- [x] **family-code** — EO 209 (Family Code): property regime computations (ACP vs CPG vs complete separation), support computation (proportional to means/needs), liquidation of conjugal/community property, annulment property division. Titles IV and VIII.
- [x] **civil-code-obligations** — Civil Code Book IV (Art. 1156-2270): legal interest computation (6% p.a. per BSP Circ. 799), damages taxonomy (actual, moral, exemplary, nominal, temperate, liquidated), prescriptive period calculations, penalty/liquidated damages.
- [x] **insurance-code** — RA 10607 (Amended Insurance Code): premium computations, policy valuation, claims computation rules, compulsory insurance requirements (motor vehicle, fire), HMO coverage computations. Insurance Commission circulars.
- [x] **bir-forms-catalog** — bir.gov.ph forms catalog: comprehensive survey of every BIR form requiring computation — income tax (1700-series), estate/donor (1800-series), VAT/percentage (2550/2551), withholding (1601/1602/1603-series), DST (2000-series), registration (0605/1901-1903). Cross-reference with other Wave 1 tax aspects.
- [x] **sec-filings-catalog** — sec.gov.ph filing requirements: annual filing calendar (GIS, AFS, beneficial ownership), compliance monitoring penalties, SEC fee computations, reportorial requirements for listed companies, registration and licensing fees.
- [x] **dole-compliance** — DOLE Department Orders, RA 11058 (OSH Law): labor standards compliance (self-audit), occupational safety and health compliance, mandatory contributions (SSS/PhilHealth/Pag-IBIG employer+employee share computations), DOLE reporting requirements.
- [x] **lgu-real-property** — RA 7160 Book II (Local Government Code — Local Taxation): real property tax computation (assessment level x tax rate x assessed value), business permit fees (graduated by gross revenue), community tax (cedula), transfer tax (local), idle land tax, special education fund. Sample LGU revenue codes.
- [x] **maceda-law-real-estate** — RA 6552 (Maceda Law): cash surrender value computation (50% of total payments for 2+ years, +5% per additional year up to 90% cap), grace period formula (1 month per year of installment paid), notarial cancellation notice requirements, refund timeline. Discovered via civil-code-obligations analysis; affects millions of real estate installment buyers and is fully deterministic.

## Wave 2: Cross-Reference and Scoring (blocked by Wave 1)

- [x] **deduplicate-and-merge** — Consolidate all domains from Wave 1 into clean master list, resolve overlaps between sources
- [x] **score-domains** — Score each domain on 4 dimensions (market/moat/computability/pain), compute weighted opportunity score
- [ ] **professional-fees-validation** — WebSearch for actual professional service pricing for top-scoring domains, validate moat depth

## Wave 3: Synthesis (blocked by Wave 2)

- [ ] **ranked-shortlist** — Produce final ranked shortlist with rationale, next-step recommendations for top 3 candidates
