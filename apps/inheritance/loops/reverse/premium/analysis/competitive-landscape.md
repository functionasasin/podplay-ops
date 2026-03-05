# Competitive Landscape — Analysis

## Overview

Research into global estate planning software, Philippine legal tech, and conceptually analogous inheritance calculators (Islamic Faraid tools). Goal: identify what no competitor does, locate pricing benchmarks, and define the moat for this PH-specific platform.

---

## 1. Competitor Matrix

### Category A — Global Estate Planning Practice Management

| Tool | URL | Target Market | Key Features | Pricing | Strengths | Weaknesses |
|------|-----|---------------|--------------|---------|-----------|------------|
| **Clio** | clio.com | All law firms, especially US/CA small firms | Case management, billing, client intake (Clio Grow), document automation (Clio Draft), 250+ integrations, Clio Duo AI | $39–$139/user/month (4 tiers) | Dominant market share, WealthCounsel integration, AI drafting, full practice management | US/CA-centric, no succession computation, no jurisdiction-specific legal logic |
| **MyCase** | mycase.com | Solo practitioners, small US firms | Case management, document storage, client intake, billing, payments | $39–$109/user/month | Simple UI, all-in-one, strong client portal | Limited integrations, no estate computation, less customizable than Clio |
| **WealthCounsel (Wealth Docx)** | wealthcounsel.com | US estate planning attorneys | Document drafting templates (wills, trusts, POA, ILITs, GRATs), CLE library, compliance updates | Membership: Essential ~$1,500/yr, Complete ~$3,000/yr (est.) | Deep US estate law encoding, trusted by 5,000+ firms, WealthCounsel + Clio integration | US law only, document drafting only (not computation), no PH equivalent |
| **LEAP** | leaplegalsoftware.com | Law firms AU/UK/US/CA | Case management, estate accounting (court-ready), document automation, deadline tracking via LawToolBox integration | Custom quote (~$100–$200/user/month) | Estate accounting module, deadline tracking, integrated billing | Custom pricing opacity, AU/UK/US law focus, not for PH |
| **Vanilla** | justvanilla.com | Wealth advisors, family offices | AI-powered estate visualization, estate flow diagrams/waterfalls, complex structure modeling (GRATs, SLATs, CLTs), robust reporting | Custom per-firm pricing | Beautiful visualizations, handles billionaire-level complexity, financial advisor focused | Advisor tool (not lawyer tool), US-only tax law, no computation engine |
| **NaviPlan** | naviplan.com | Financial planners, RIAs | Financial planning + estate scenarios, Monte Carlo, unlimited scenarios, tax analysis | Custom enterprise pricing | Precise calculation engine, scenario modeling, tax optimization | Financial planning focus (not legal), US-only, not for lawyers |
| **Gavel** | gavel.io | Document-automation-focused law firms | Intake questionnaires, document automation, 90% reduction in drafting time | ~$83–$167/user/month | Extreme drafting automation, client-facing intake | No estate computation, US-centric templates |
| **Actionstep** | actionstep.com | Mid-size law firms | Workflow automation, customizable dashboards, document management | Custom quote | Flexible workflows | Generic legal tool, not estate-specific |
| **InterActive Legal** | interactivelegal.com | US estate planning attorneys | AI-driven document drafting, planning document generation | Custom | AI-first document generation | US-only, document drafting only |
| **Holistiplan** | holistiplan.com | Financial advisors (RIAs) | Tax return OCR, Roth conversion analysis, estate planning modules (upcoming) | ~$99/user/month | Tax analysis automation, estate planning modules in development | Advisor-not-attorney tool, US only |

---

### Category B — Philippine Online Calculators (Direct Search Space)

| Tool | URL | What It Does | Limitations |
|------|-----|--------------|-------------|
| **taxcalculatorphilippines.online** | taxcalculatorphilippines.online/estate-tax-computation-philippines/ | Guide + basic estate tax computation (TRAIN Law: 6% on net estate after ₱5M standard deduction) | Text-based guide only, no interactive calculator, no succession distribution |
| **incometaxcalculator.ph** | incometaxcalculator.ph/estate-tax-calculator/ | Interactive estate tax calculator (gross estate → deductions → 6% rate → tax due) | Tax computation only (TRAIN Law), no succession distribution, no heir-by-heir shares |
| **respicio.ph** | respicio.ph/commentaries/inheritance-law-in-the-philippines | Legal commentary / explainer site | Text only, no calculator, no computation |
| **LawPhil** | lawphil.net | Philippine laws and jurisprudence database, includes BIR Form 1801 PDF | Read-only law reference, zero computation |
| **BIR official site** | bir.gov.ph/estate-tax | Official BIR estate tax info page + forms | Forms for download only, no computation |
| **pdfFiller (BIR 1801)** | bir-form-1801.pdffiller.com/ | Fillable BIR Form 1801 PDF | PDF fill only, no computation engine, no succession |

**Critical finding:** No tool anywhere computes **Philippine NCC succession shares** (heir-by-heir fractional distribution based on family tree). The existing PH tools compute only estate tax (a simpler single formula), not the much more complex succession algorithm.

---

### Category C — Islamic Faraid Calculators (Closest Conceptual Analog)

These are the closest existing tools to what this platform does — they compute legally-mandated fractional inheritance shares from a family tree. Useful for UX and feature benchmarking.

| Tool | URL | Features | Strengths | Weaknesses |
|------|-----|----------|-----------|------------|
| **IslamicInheritance.com** | islamicinheritance.com/calculator/ | Free Faraid calculator; all 5 Sunni schools; handles 'Awl (reduction) and Radd (redistribution); cites Quran verses | Multi-school support, legal citations, free | Islamic law only (not NCC), no PDF export, no case persistence |
| **Almwareeth.com** | almwareeth.com/islamic-inheritance-calculator | Supports 9 Muslim-country law variants; Arabic + English | Multi-jurisdiction Faraid, clean UI | Islamic only, no PH law |
| **Faraid.net** | faraid.net/ | Qur'an/Sunnah-cited computation, heir tree input | Evidence citations in results (like legal_basis[]) | Islamic only |
| **CalculateNow.net** | calculatenow.net/islamic-inheritance-calculator/ | Estate value input + debt + wasiyyah deduction + heir selection → shares + export | Export results, deduction handling | No PDF, Islamic only |
| **Faraid iOS App** | apps.apple.com/app/faraid | Mobile app; 4 major schools; 6 languages; unlimited family relationships | Mobile-first, multilingual, unlimited heirs | Mobile only, Islamic only |

**Key benchmarks from Faraid tools:**
- Legal citations directly in results (Quran verse, hadith → this platform's NCC article citations)
- "Awl" (oversubscription correction) and "Radd" (surplus redistribution) ≈ this platform's legitime/free portion/intestate splits
- Multi-school support ≈ this platform's 30-scenario engine
- Some export results (but no PDF generation)
- None have: case persistence, firm accounts, client CRM, BIR integration, deadline tracker

---

### Category D — Philippine Legal Tech Startups

| Tool | What It Does | Estate Planning? |
|------|--------------|-----------------|
| **Legaldex / Digest** | AI legal research, semantic search on PH jurisprudence and laws | No — legal research only |
| **LexMeet** | Online legal consultation marketplace, location-based attorney finder | No — marketplace only |
| **Omnibus** | Cloud case management: matters, clients, billing, document management | No estate-specific features |
| **UNAWA** | Digital identity and document solutions | No |

**Finding:** Zero PH legal tech startups focus on estate planning computation or practice management for estate lawyers. The PH legal tech ecosystem is in early stage, focused on access-to-justice (lawyer matching) and research, not on specialist workflow tools.

---

## 2. Feature Gap Analysis

The following features exist in **NO competitor** (globally or locally):

| Gap | Why It Matters |
|-----|---------------|
| **Philippine NCC succession computation (30 scenarios, 10-step pipeline)** | The core algorithmic moat. No tool encodes PH civil law succession rules at this depth. Even Islamic Faraid tools with similar structure exist only for Sharia law. |
| **NCC article citations per heir (legal_basis[])** | Every Faraid tool cites Quran verses; no PH tool cites NCC articles in computation output. This is table stakes for a professional legal tool. |
| **Three-regime estate tax engine (TRAIN/PRE_TRAIN/AMNESTY)** | The estate tax spec handles amnesty scenarios and pre-2018 progressive rates. No existing PH calculator handles multi-regime. |
| **Combined inheritance distribution + BIR 1801 in one workflow** | No tool connects succession computation → estate tax → BIR form pre-fill. Lawyers do this manually, often in Excel. |
| **Scenario comparison: testate vs. intestate side by side** | Estate planning use case — "what does a will actually change?" No tool globally offers this for any civil law jurisdiction. |
| **BIR filing deadline tracker (1-year window + publication windows)** | PH-specific deadline management. LEAP has generic deadline tracking but not PH-specific. |
| **Per-heir narrative with statute citations, exportable to PDF** | Faraid tools show fractions; Western tools show dollar amounts. None produce court-quality narratives with statute citations. |
| **Extrajudicial vs. judicial track decision routing at intake** | PH-specific workflow intelligence. |
| **Philippine TIN + government ID fields in client profiles** | PH-specific client data model. |

---

## 3. Pricing Benchmarks

### Professional Legal SaaS (Per Seat)
| Tier | Monthly (per user) | Target | Example |
|------|--------------------|--------|---------|
| Entry | $39–$50 | Solo practitioners | Clio EasyStart, MyCase Basic |
| Mid | $79–$109 | Small firms (2–10 attorneys) | Clio Essentials, MyCase Pro |
| Advanced | $109–$139 | Growing firms | Clio Advanced/Complete |
| Enterprise | Custom (~$200+) | Large firms | LEAP, Actionstep |

### Flat Monthly Tools
| Type | Price | Example |
|------|-------|---------|
| Specialized drafting | $100–$250/month | WealthCounsel Essential |
| Financial planning + estate | $99/month | Holistiplan |

### Free / Freemium
- Islamic Faraid tools: universally free (consumer tools, not professional)
- PH estate tax calculators: free, minimal functionality
- Clio/MyCase: free trials, then paid

### Recommended Pricing for PH Market

PH lawyer median income is significantly lower than US/AU counterparts. PH-specific pricing:
- **Solo / Freelance**: ₱1,500–₱3,000/month (~$26–$52 USD) — competitive with Philippine SaaS norms
- **Small firm (2–5 attorneys)**: ₱4,000–₱8,000/month (~$70–$140 USD)
- **Per-case for occasional users**: ₱500–₱800/case (~$9–$14 USD) — lowers barrier for low-volume practitioners
- **Freemium base**: Anonymous computation (current app) stays free; persistence + PDF + CRM = paid

---

## 4. UX Patterns Worth Adopting

From competitor analysis:

| Pattern | Source | Application |
|---------|---------|-------------|
| **Legal citations inline with each output row** | Faraid tools (Quran verse citations) | Implement spec-statute-citations-ui: show NCC articles expandable per heir |
| **Family tree builder → compute → results** | Faraid apps (iOS) | Already implemented in wizard; reinforce with visual tree in spec-family-tree-visualizer |
| **Client intake → auto-populate case** | Clio Grow, Gavel | spec-intake-form pre-populates wizard from intake answers |
| **Document automation from case data** | Clio Draft, WealthCounsel | spec-pdf-export generates report from EngineOutput automatically |
| **Deadline tracking with color-coded status** | LEAP + LawToolBox integration | spec-deadline-tracker: green/yellow/red BIR milestones |
| **Read-only client portal for sharing** | Clio's client portal | spec-shareable-links: URL with token for read-only case view |
| **Case notes + timestamping** | All practice management tools | spec-case-notes |
| **Conflict check before intake** | Clio, all legal CRM | spec-conflict-check: search existing clients/heirs |
| **Scenario comparison / "what if"** | NaviPlan (financial), none for legal | spec-scenario-comparison: unique differentiator |

---

## 5. Defensive Moats

Ranked by difficulty to replicate:

| Moat | Difficulty to Replicate | Explanation |
|------|------------------------|-------------|
| **Philippine NCC succession algorithm (30 scenarios)** | Very High | 2,568-line spec with all edge cases, fractions, and scenario logic. Requires deep PH civil law expertise + engineers. Took months to specify. |
| **Three-regime estate tax engine (TRAIN/PRE_TRAIN/AMNESTY)** | Very High | 2,040-line spec covering 3 tax regimes, 14 computation phases, BIR Form 1801 mapping. |
| **NCC article citations mapped to each computation step** | High | Every output step cites specific NCC articles. No competitor has done this mapping for any civil law jurisdiction's succession rules. |
| **WASM client-side computation** | Medium-High | Sub-50ms computation in browser, no server cost at scale, offline-capable. Rust → WASM pipeline already built. |
| **PH-specific workflow intelligence** | Medium | Extrajudicial vs. judicial routing, BIR deadline knowledge, TIN field, Philippine court formats. |
| **First-mover in PH estate legal tech** | Medium | No competitors in PH. Market capture + word-of-mouth in PH legal community (small, tight-knit). |
| **Tested scenario coverage (13 test vectors, all 30 scenarios)** | Medium | Trust and reliability in computation output — lawyers will recommend after seeing it validated. |

---

## 6. Market Positioning Recommendation

**Target segment:** Solo and small-firm (2–5 attorney) Philippine estate lawyers. Estimated market: ~5,000–10,000 active PH estate lawyers based on IBP membership data.

**Positioning statement:** "The only platform built specifically for Philippine succession law — computes NCC inheritance shares and BIR estate tax in one workflow, generates court-quality reports with statute citations."

**Go-to-market angle:**
1. Free tier converts: anonymous computation (current app) → drive lawyer discovery
2. Viral via clients: lawyers share read-only links (spec-shareable-links) → clients refer other lawyers
3. IBP (Integrated Bar of the Philippines) chapter presentations / CLE credit
4. LawPhil / Chan Robles community (PH legal research users are the target audience)

**Pricing structure recommendation:**
- **Free**: Anonymous computation, no persistence, basic results
- **Solo** (₱1,999/month): Case persistence, PDF export, client profiles, shareable links, case notes
- **Firm** (₱5,999/month for up to 5 seats): + multi-seat, firm branding, admin dashboard
- **Per-case** (₱699/case): For occasional users — cap at 20 cases/month before plan upgrade makes sense

---

## 7. Discovered Features (During Research)

The following features surfaced during competitive analysis that should be added to Wave 2:

1. **spec-timeline-report** — A visual settlement timeline (Gantt-style or milestone list) generated from case facts showing all milestones (BIR filing, publication, RD transfer, etc.) that a lawyer can share with clients. Surfaced from: LEAP's LawToolBox integration and ph-practice-workflow pattern.

2. **spec-document-checklist** — Per-case document checklist (PSA death certificate, TCT/CCT, ITR, bank certs) with check-off status tracking. Surfaced from: ph-practice-workflow stages 1–5 document requirements. This is a common need in every case and Clio/LEAP both have document management modules.

---

## Sources

- [Clio Pricing](https://www.clio.com/pricing/)
- [Clio vs MyCase Comparison — Capterra](https://www.capterra.com/compare/105428-115613/Clio-vs-MyCase)
- [Best Estate Administration Software — thelegalpractice.com](https://thelegalpractice.com/tools/best-estate-administration-software/)
- [Vanilla Estate Planning](https://www.justvanilla.com/)
- [WealthCounsel](https://www.wealthcounsel.com/)
- [Estate Planning Software Guide — RightCapital](https://www.rightcapital.com/blog/estate-planning-software-for-financial-advisors/)
- [Top Legal Tech Startups Philippines — Tracxn](https://tracxn.com/d/explore/legal-tech-startups-in-philippines/)
- [IslamicInheritance.com Faraid Calculator](https://islamicinheritance.com/calculator/)
- [Faraid.net](https://faraid.net/)
- [Almwareeth.com](https://almwareeth.com/islamic-inheritance-calculator)
- [PH Estate Tax Calculator](https://incometaxcalculator.ph/estate-tax-calculator/)
- [BIR Estate Tax](https://www.bir.gov.ph/estate-tax)
- [respicio.ph — Inheritance Law PH](https://www.respicio.ph/commentaries/inheritance-law-in-the-philippines)
- [MyCase Estate Planning](https://www.mycase.com/blog/legal-case-management/best-estate-planning-attorney-software/)
- [LEAP Estate Planning](https://leap.us/area-of-law/estate-planning-and-probate-software/)
- [Gavel vs WealthCounsel](https://www.gavel.io/comparison/gavel-v-wealthcounsel-estate-planning-software)
