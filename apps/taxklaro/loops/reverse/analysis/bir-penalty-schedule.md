# Analysis Working Notes: bir-penalty-schedule

**Aspect:** bir-penalty-schedule (Wave 1)
**Date:** 2026-03-01
**Analyst:** ralph loop iteration

---

## Objective

Extract the complete BIR penalty structure applicable to self-employed freelancers: interest rates, surcharge rates, compromise penalties, failure-to-file penalties, prescriptive periods, and tax amnesty status.

## Key Sources Consulted

1. NIRC Sections 247–282 (Penalties chapter)
2. NIRC Section 203, 222 (Prescriptive periods)
3. RMO No. 7-2015, Annex A (Compromise penalty schedule)
4. RMO No. 19-2007 (Older compromise schedule, superseded by RMO 7-2015)
5. RA 11976 (EOPT Act) — amended Sections 248 (surcharge), 249 (interest), 250 (info returns)
6. RR No. 6-2024 (EOPT implementing regulations for penalties)
7. RR No. 13-2021 (Enhanced penalties for unauthorized receipt printing)
8. Supreme Court G.R. No. 247737 (McDonald's PH Realty Corp. v. CIR — intent required for 10-year period)
9. Senate Bill 60 / House Bill 2653 (Proposed General Tax Amnesty Act — NOT yet enacted)

---

## Key Findings

### 1. The Penalty Stack (for a Single Late Return with Tax Due)

Three components accumulate independently:
1. **Surcharge** (one-time): 10% for MICRO/SMALL; 25% for MEDIUM/LARGE; 50% for fraud
2. **Interest** (daily, simple): 6%/yr for MICRO/SMALL; 12%/yr for MEDIUM/LARGE — computed on basic tax due
3. **Compromise penalty** (voluntary but effectively mandatory): from table based on tax due bracket

Formula: `Total = Basic Tax + Surcharge + Interest + Compromise`

### 2. EOPT Penalty Reductions (Critical for Target Users)

Most freelancers are MICRO (<₱3M gross). EOPT cut their penalties:
- Surcharge: 25% → **10%** (60% reduction)
- Interest: 12% → **6%** (50% reduction)
- Info return failures: ₱1,000/failure → **₱500/failure** (50% reduction)
- Info return annual cap: ₱25,000 → **₱12,500** (50% reduction)
- Invoicing violations: 50% reduction (Sec. 237/238 only)

The EOPT 50% reduction does NOT apply to:
- Fraud surcharge (always 50% regardless of tier)
- Compromise penalty under Sec. 255 (late filing table amounts apply to all tiers)

### 3. Compromise Penalty Scope

The RMO 7-2015 Annex A table (Tax Due brackets → fixed penalty amounts) applies to Sec. 255 violations (failure to file/pay). It is NOT the same as:
- Section 250 penalties (info returns — separate per-failure schedule)
- Invoicing violation amounts (Sec. 264 — separate per-offense schedule)

### 4. Prescriptive Period — Critical for Catch-Up Filers

Ordinary: 3 years from filing deadline (or actual filing if late).
Extraordinary (fraud/no filing): 10 years from DISCOVERY — engine cannot know when BIR discovered, so must always flag as potentially assessable.

SC ruling: mere underdeclaration size does not trigger 10-year period without proof of INTENT. But the 30% Section 248(B) prima facie presumption effectively does trigger it until taxpayer proves otherwise.

### 5. Tax Amnesty Status as of March 2026

No active general tax amnesty exists. The General Tax Amnesty (SB 60/HB 2653) covering TY2007-2024 at 2% of assets is PROPOSED, pending both chambers. NOT enacted. Engine should not rely on this.

---

## Files Written

1. `final-mega-spec/domain/lookup-tables/bir-penalty-schedule.md` — NEW complete penalty reference (written by subagent)
2. `final-mega-spec/domain/computation-rules.md` — Added CR-020 (compromise penalty), CR-021 (Section 250 info returns), CR-022 (prescriptive period check)
3. `final-mega-spec/domain/edge-cases.md` — Added EC-P01 through EC-P07 (penalty-related edge cases)
4. `final-mega-spec/README.md` — Updated entries for computation-rules.md and edge-cases.md

---

## New Aspects Discovered

None. All penalty-adjacent topics were already captured by existing aspects (eopt-taxpayer-tiers covered the surcharge/interest structure; this aspect completed the compromise penalties and prescriptive periods).

The existing frontier already captures the related upcoming work:
- `scenario-enumeration` (Wave 2) — penalty scenarios should be included as scenario codes
- `edge-cases` (Wave 2) — penalty edge cases started here (EC-P group) but Wave 2 will expand further
- `test-vectors-edge` (Wave 3) — must include penalty computation verification vectors
