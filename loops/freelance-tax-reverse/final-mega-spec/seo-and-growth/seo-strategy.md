# SEO Strategy
## Source: competitive-analysis aspect (Wave 1)
## Status: INITIAL DRAFT — to be expanded in seo-strategy aspect (Wave 5)

---

## Target Keywords and Current SERP Ownership

Based on Google search analysis (February 2026):

| Keyword | Monthly Intent | Current #1 | Gap / Opportunity |
|---------|---------------|------------|-------------------|
| "freelance tax calculator philippines" | High | taxumo.com (blog, not a tool) | Build tool page — will outrank blog |
| "8% income tax calculator philippines" | High | codingace.net (obscure), basic calculators | No authoritative branded tool — high opportunity |
| "BIR 1701 calculator philippines" | High | Taxumo blog, JuanTax blog | No interactive tool page — build one |
| "freelance tax philippines" | Very High | Taxumo.com, Filipiknow | Informational; tool page adds transactional intent |
| "8% vs graduated income tax philippines" | High | Taxumo blog | Comparison landing page + tool — uncontested |
| "BIR regime comparison philippines" | Medium | codingace.net only | Almost no competition |
| "mixed income earner tax philippines" | Medium | Taxumo blog | No tool for mixed income scenario |
| "BIR 1701Q calculator" | Medium | Basic calculators | No quarterly tracker tool |
| "bir form 2551q calculator" | Low-Medium | Basic calculators | Build |
| "self-employed tax optimizer philippines" | Low | No dedicated result | Own the term |
| "freelance tax philippines 2025" | Seasonal | Taxumo blog | Update annually |
| "philippines income tax 8 percent option" | Medium | BIR circulars, Taxumo | Tool page with election guidance |
| "tax calculator philippines freelancer" | High | Various calculators | Tool page |
| "how to file 1701q philippines" | High | YouTube, Taxumo blog | Tutorial + tool combo |

---

## Domain Strategy

All exact-match domains are taken:
- taxcalculatorphilippines.com ✗
- taxcalculatorphilippines.net ✗
- taxcalculatorphilippines.online ✗
- philippinetaxcalculator.ph ✗
- incometaxcalculator.ph ✗

Available framing angles:
- Regime/optimizer framing: taxregimeoptimizer.ph, freelancetaxph.com
- Clarity framing: birclarity.ph, taxclearph.com
- Comparison framing: taxcompare.ph

**Recommended approach**: Choose a brand name that's distinctive rather than exact-match, and build domain authority through content.

---

## Content Strategy Notes

### High-Priority Blog Topics (from gap analysis)

1. "8% vs Graduated Income Tax Philippines: Which Saves You More? [2026 Calculator]"
   - Target query: "8% vs graduated income tax philippines"
   - Include interactive calculator embedded in page
   - Show concrete breakeven analysis table

2. "Philippine Freelance Tax Guide 2026: Complete Step-by-Step"
   - Target query: "freelance tax philippines 2026"
   - Replace Taxumo's dominant guide with more comprehensive version

3. "Mixed Income Earner Philippines: How to File Taxes When You Have a Day Job AND Freelance Income"
   - Target query: "mixed income earner tax philippines"
   - High pain point, underserved content

4. "BIR Form 2307 Complete Guide: How to Use Creditable Withholding Tax to Reduce Your Bill"
   - Target query: "bir form 2307 guide"
   - High pain point around CWT accounting

5. "May 15 Deadline for Freelancers: What You Need to Know About Quarterly ITR"
   - Target query: "1701q deadline philippines"
   - Seasonal/deadline-driven traffic

6. "OSD vs Itemized Deductions: When Does Itemizing Beat the 40% Standard Deduction?"
   - Target query: "osd vs itemized philippines"
   - Underserved content

7. "Philippine Tax Regime Election: How to Choose 8% on Your Q1 1701Q Filing"
   - Target query: "how to elect 8% income tax philippines"
   - Captures first-year filers at high-intent moment

8. "Taxumo vs JuanTax vs eBIRForms: Which Tax Tool is Right for You?"
   - Comparison page — captures branded search traffic
   - Present our tool as the better alternative

9. "Why I Overpaid My BIR Taxes by 30% (And How You Can Avoid It)"
   - Educational/emotional hook
   - Target query: "overpaying taxes philippines freelance"

10. "BIR Registration for Freelancers 2026: Complete Guide with Checklist"
    - Pre-acquisition: capture users before they register, build trust

---

## Schema Markup

Tool pages should use `WebApplication` schema:
```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "[Tool Name] — Philippine Freelance Tax Optimizer",
  "description": "Compute your Philippine income tax under all three BIR-allowed methods and find which saves you the most money.",
  "applicationCategory": "FinanceApplication",
  "operatingSystem": "Web Browser",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "PHP"
  },
  "featureList": [
    "8% flat rate computation",
    "Graduated + OSD computation",
    "Graduated + itemized deductions computation",
    "Tax regime comparison",
    "BIR Form 2307 CWT offset",
    "Quarterly 1701Q tracking"
  ]
}
```

Blog posts should use `Article` schema. Calculator pages should use `SoftwareApplication` schema.

---

## Competitive SEO Notes

- Taxumo's blog content dominates informational queries but Taxumo's tool pages are gated behind signup + subscription
- Free calculator sites rank well but have zero brand authority and minimal content
- No competitor has a regime comparison landing page — this is a gap we can own from launch
- JuanTax has strong technical content for accountants but weak individual freelancer content
- Seasonal spikes: April (annual ITR), May (Q1 quarterly), August (Q2 quarterly), November (Q3 quarterly)
- Target acquisition: new freelancers registering with BIR (high intent, searching before Q1 filing)
