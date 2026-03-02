# Content Strategy — TaxKlaro
## Philippine Freelance & Self-Employed Income Tax Optimizer

This document specifies the complete content strategy: audience personas, all blog post topics with full SEO metadata and content outlines, pillar and comparison pages, social media post templates, email newsletter templates, editorial voice guidelines, internal link architecture, image specifications, and launch calendar.

Cross-references:
- [seo-strategy.md](seo-strategy.md) — Full keyword list, page-by-page meta for tool pages, schema.org markup
- [landing-page.md](landing-page.md) — Hero copy, value prop, full landing page sections
- [../ui/branding.md](../ui/branding.md) — Brand name TaxKlaro, domain taxklaro.ph, color palette, logo

---

## 1. Target Audience Personas

### Persona 1: "First-Time Filer Faye"
- **Description**: Recently registered with BIR after landing first Upwork contract. No idea what regime to choose for Q1 1701Q.
- **Income**: ₱500,000–₱800,000/year (intermediate Fiverr/Upwork level)
- **Primary question**: "Should I choose 8% or graduated? What's the difference?"
- **Secondary concern**: "When are the deadlines? What happens if I miss one?"
- **Emotional state**: Anxious, overwhelmed, trusts CPAs but doesn't want to spend ₱8,000 just to learn which button to click
- **Where she searches**: Google ("freelancer tax philippines 2026"), Facebook groups (Freelancing PH, SPARK PH)
- **Content that converts**: Simple explainer + instant regime comparison tool

### Persona 2: "Overpaying Oscar"
- **Description**: Has been filing for 3+ years using graduated rates. Has a CPA who just files without explaining regime options. Suspects he's overpaying.
- **Income**: ₱1,000,000–₱2,500,000/year (experienced developer)
- **Primary question**: "I've been using graduated rates. Am I leaving money on the table?"
- **Secondary concern**: "Can I switch to 8% now or is it too late?"
- **Emotional state**: Skeptical but hopeful; needs numbers to convince him
- **Where he searches**: Reddit (r/phinvest, r/Philippines), CPA forums
- **Content that converts**: Side-by-side comparison tool + article on "How much you've been overpaying"

### Persona 3: "Mixed-Income Maya"
- **Description**: Government employee with a side hustle (graphic design, tutoring). Receives both BIR 2316 from employer and freelance income. Confused about which form to file.
- **Income**: ₱480,000 (employment) + ₱300,000 (freelance) = ₱780,000 combined
- **Primary question**: "I have a day job AND freelance income. What form do I file? Which regime?"
- **Secondary concern**: "Does my employer's tax withholding apply to my freelance income?"
- **Emotional state**: Confused and afraid of getting it wrong; would pay a CPA just for peace of mind
- **Where she searches**: Google ("mixed income earner ITR philippines"), Facebook (Filipino Freelancers group)
- **Content that converts**: Mixed-income decision tree tool + dedicated guide

### Persona 4: "CPA Charlie"
- **Description**: Certified Public Accountant handling 30–50 self-employed/freelance clients. Wants a tool that computes all three regimes automatically so he can advise clients faster.
- **Income**: Professional; tool is a productivity and quality tool for him
- **Primary question**: "Is there a batch tool where I enter multiple clients' numbers and get regime recommendations?"
- **Secondary concern**: "Can I generate a PDF of the computation to share with my client?"
- **Emotional state**: Pragmatic; evaluates tools by time saved per client
- **Where he searches**: Google, CPA Philippines Facebook groups, referrals from other accountants
- **Content that converts**: Professional/batch demo + PDF export feature highlight + API access

---

## 2. Editorial Voice and Style Guidelines

### Brand Voice
TaxKlaro writes like a knowledgeable Filipino CPA friend: clear, direct, a bit conversational, never condescending. We explain tax concepts in plain Filipino English — we don't hide behind jargon, but we don't oversimplify to the point of inaccuracy.

### Tone Rules
1. **Plain language first**: Replace "gross sales/receipts" with "your total income from freelance/business" in introductory sentences; use the technical term parenthetically on first use only.
2. **Active voice**: Write "You compute 8% of your gross receipts" not "The 8% income tax is computed on gross receipts."
3. **No fear-mongering**: Never say "You will go to jail" or "BIR will audit you." Say "Here's what the penalty looks like if you file late, and here's how to avoid it."
4. **Show the math**: Always include a worked example with real peso amounts. ₱500,000 earner is the default example character throughout the blog.
5. **Confidence in technical accuracy**: Cite the exact BIR regulation (e.g., "per RR 8-2018, Section 2") when making definitive claims. No hedging on things the law clearly states.
6. **Philippine-specific**: All amounts in ₱, dates in Philippine format (April 15 not 4/15), use "BIR" not "IRS," reference Philippine holidays when relevant to deadlines.
7. **Calls to action are utility-first**: Never "Sign up for our premium plan!" Instead: "Compute your exact tax now — free."

### Reading Level
- Target: Grade 8–10 Filipino English (clear to anyone who finished high school)
- Technical terms are always explained on first use
- Sentence length: max 25 words per sentence
- Paragraphs: max 4 sentences

### Content Accuracy Standard
- Every peso amount, percentage, and deadline must match the domain rules in [../domain/computation-rules.md](../domain/computation-rules.md)
- Every claim about a BIR form must match [../domain/bir-form-1701-field-mapping.md](../domain/bir-form-1701-field-mapping.md) or [../domain/bir-form-1701a-field-mapping.md](../domain/bir-form-1701a-field-mapping.md)
- Every legal citation must appear in [../domain/legal-basis.md](../domain/legal-basis.md)
- All blog posts must be reviewed against latest computation rules before publishing; update whenever BIR issues new regulations

---

## 3. Blog Posts — Complete Specifications

### Post 1: "8% Income Tax Option Philippines: Complete Guide for Freelancers (2026)"

| Attribute | Value |
|-----------|-------|
| URL slug | /blog/8-percent-income-tax-option-philippines |
| SEO title tag | 8% Income Tax Option Philippines 2026: Complete Freelancer Guide |
| Meta description | Should you choose the 8% flat income tax option? Learn eligibility rules (≤₱3M gross), how to elect it, why it saves money, and when it doesn't. Free calculator included. |
| Target keyword | 8% income tax option philippines |
| Secondary keywords | 8 percent tax option bir, freelancer tax option philippines, rr 8-2018 8 percent option |
| Target persona | Faye (first-time filer) |
| Search intent | Informational + Transactional |
| Word count | 2,800–3,200 words |
| CTA text | "Compute whether 8% saves YOU money — it's free" |
| CTA destination | / (tool homepage) |

**H1**: 8% Income Tax Option Philippines: The Complete Guide for Freelancers (2026)

**H2 Outline**:
1. What Is the 8% Income Tax Option? (Definition + governing law: NIRC Sec. 24(A)(2)(b) as amended by TRAIN Law / RA 10963)
2. Who Is Eligible for the 8% Option? (Conditions: purely self-employed or professional; gross receipts ≤ ₱3,000,000; not VAT-registered; not a GPP partner)
3. How to Compute Tax Under the 8% Option (Formula: (Gross Receipts − ₱250,000) × 8%; worked example at ₱600,000 gross = ₱28,000 tax)
4. How to Elect the 8% Option (Procedure: annotate Q1 Form 1701Q; signification of intent per RR 8-2018 Sec. 2; irrevocability rule)
5. What Is the Deadline to Elect? (Q1 1701Q due May 15; first quarter of taxable year; no mid-year switching)
6. Does the 8% Option Eliminate Percentage Tax? (Yes — 8% income tax replaces both income tax AND percentage tax obligation per RR 8-2018; explain the waiver)
7. When Is 8% NOT the Best Option? (High expense ratio scenarios: itemized deductions beat 8% when expense ratio ≥ 67%; worked breakeven table)
8. 8% Option vs Graduated + OSD vs Graduated + Itemized: Side-by-Side for 5 Income Levels (Comparison table: ₱300K, ₱600K, ₱1M, ₱1.5M, ₱2.5M gross with 0% and 40% expense ratios)
9. Can Mixed-Income Earners Use the 8% Option? (Yes — but ₱250K deduction is NOT available; business income is taxed at 8% separately from compensation)
10. Frequently Asked Questions (10 Q&As covering: mixed income, switching, GPP, foreign income, no expenses, late election, second year, etc.)

**Featured image spec**: Two side-by-side calculators showing ₱600,000 freelancer paying ₱28,000 under 8% vs ₱100,000 under graduated. Text overlay: "The 8% Option Could Save You ₱72,000 This Year." Brand colors: #1D4ED8 background, #FFFFFF text. Dimensions: 1200×630px.

**Internal links from this post**:
- → Post 2 (8% vs graduated comparison) at "which regime wins" section
- → Post 4 (1701Q how-to) at "how to elect" section
- → Tool homepage (inline CTA after Section 3)
- → Post 12 (mixed income) at Section 9

---

### Post 2: "8% vs Graduated Income Tax Philippines: Which Saves You More Money? (With Calculator)"

| Attribute | Value |
|-----------|-------|
| URL slug | /blog/8-percent-vs-graduated-income-tax-philippines |
| SEO title tag | 8% vs Graduated Income Tax Philippines 2026: Calculator + Side-by-Side Comparison |
| Meta description | Compare 8% flat tax vs graduated income tax for Philippine freelancers. Use our free calculator to see which saves you more money at your income level. |
| Target keyword | 8% vs graduated income tax philippines |
| Secondary keywords | freelancer tax comparison philippines, which tax regime philippines, 8 percent vs graduated tax computation |
| Target persona | Oscar (overpaying veteran) |
| Search intent | Informational + Transactional |
| Word count | 3,200–3,800 words |
| CTA text | "Enter your income and see your savings right now" |
| CTA destination | / (tool homepage) |

**H1**: 8% vs Graduated Income Tax Philippines: Which Saves You More? (2026 Comparison with Calculator)

**H2 Outline**:
1. The Three Tax Regimes: A Quick Overview (Path A: Graduated + Itemized; Path B: Graduated + OSD; Path C: 8% Flat Rate)
2. How the 8% Option Works (Formula with ₱250K exemption, worked example)
3. How Graduated + OSD Works (40% deduction, graduated rate table, worked example)
4. How Graduated + Itemized Works (Actual expenses, documentation, when it's relevant)
5. Side-by-Side Comparison: ₱300,000 Gross Receipts (Full computation showing all 3 paths; 8% wins by ₱5,400 vs OSD/graduated)
6. Side-by-Side Comparison: ₱600,000 Gross Receipts (8% wins by ₱36,200 vs OSD/graduated at 0% expenses)
7. Side-by-Side Comparison: ₱1,000,000 Gross Receipts (8% wins by ₱100,000 vs OSD at low expense ratio)
8. Side-by-Side Comparison: ₱1,500,000 Gross Receipts (8% wins; at 40% expense ratio itemized starts competitive)
9. Side-by-Side Comparison: ₱2,500,000 Gross Receipts (8% still wins unless expenses exceed ₱1.4M)
10. The Breakeven Table: When Does Itemized Beat 8%? (Table showing expense ratio threshold at each gross income level)
11. "I've Been Filing Graduated for 3 Years — How Much Did I Overpay?" (Calculator embed + sample calculations for ₱600K/year × 3 years = ₱108,600 overpaid)
12. How to Switch to 8% for Next Year (Q1 1701Q election procedure)

**Featured image spec**: Bar chart comparison showing 3 tax regimes for ₱600K earner. Bar 1 (red): Graduated ₱100,000. Bar 2 (yellow): OSD ₱100,000. Bar 3 (green): 8% ₱28,000. Caption: "At ₱600K, the 8% option saves ₱72,000." Dimensions: 1200×630px.

**Internal links from this post**:
- → Post 1 (8% complete guide) at Section 2
- → Post 9 (OSD deep dive) at Section 3
- → Post 10 (itemized deductions) at Section 4
- → Post 11 (high-income strategy) at breakeven section
- → Tool homepage (after every comparison table)

---

### Post 3: "The 8% Flat Tax: 5 Things Filipino Freelancers Get Wrong"

| Attribute | Value |
|-----------|-------|
| URL slug | /blog/8-percent-tax-freelancer-philippines-common-mistakes |
| SEO title tag | 5 Mistakes Filipino Freelancers Make About the 8% Income Tax Option |
| Meta description | Are you making these costly mistakes about the 8% income tax option? Cleared up with exact BIR rules: percentage tax, election timing, GPP income, and the ₱250K deduction. |
| Target keyword | 8% tax rate freelancer philippines mistakes |
| Secondary keywords | 8% income tax option misconceptions, 8 percent tax rules philippines, common tax mistakes freelancer philippines |
| Target persona | Oscar and Faye |
| Search intent | Informational |
| Word count | 2,000–2,400 words |
| CTA text | "Check if you're eligible for the 8% option — takes 2 minutes" |
| CTA destination | / (tool homepage) |

**H1**: 5 Things Filipino Freelancers Get Wrong About the 8% Income Tax Option

**H2 Outline**:
1. Mistake 1: "8% Means I Still Pay Percentage Tax" (Truth: per RR 8-2018 Sec. 2(B), electing 8% income tax waives percentage tax obligation; show the net savings)
2. Mistake 2: "I Can Switch to 8% Any Time" (Truth: election is made on Q1 Form 1701Q and is irrevocable for the entire taxable year; must wait until next year to switch)
3. Mistake 3: "8% Is Always Cheaper Than Graduated" (Truth: at high expense ratios — ≥67% of gross — itemized deductions can produce lower tax; show breakeven examples at ₱2M gross with ₱1.4M in legitimate expenses)
4. Mistake 4: "GPP Partners Can Use the 8% Option" (Truth: General Professional Partnerships distribute net income to partners; partner's distributive share from GPP is NOT eligible for 8% per RR 8-2018 Sec. 3; must use graduated rates on GPP income)
5. Mistake 5: "The ₱250,000 Deduction Applies Whether or Not I Have a Day Job" (Truth: ₱250K exemption exists only for purely self-employed earners; mixed-income earners who also receive compensation cannot claim ₱250K against business income per RMC 50-2018)
6. Bonus Mistake: "I Don't Need to File 1701Q if I Elect 8%" (Truth: must still file quarterly Form 1701Q to track cumulative receipts and CWT credits)
7. Quick Eligibility Checklist (Yes/No checklist: gross ≤ ₱3M, not VAT-registered, not GPP partner, purely self-employed OR mixed income earner; links to tool)

**Featured image spec**: List-style graphic with 5 numbered red "X" items: "8% = no percentage tax? WRONG." "Can switch anytime? WRONG." etc. with TaxKlaro branding. 1200×630px.

**Internal links from this post**:
- → Post 1 (8% complete guide) throughout
- → Post 4 (1701Q how-to) at Mistake 6
- → Post 12 (mixed income) at Mistake 5

---

### Post 4: "How to File BIR Form 1701Q: Freelancer Quarterly Income Tax Return (Step by Step)"

| Attribute | Value |
|-----------|-------|
| URL slug | /blog/how-to-file-bir-form-1701q-freelancer-philippines |
| SEO title tag | How to File BIR Form 1701Q for Freelancers Philippines 2026: Step-by-Step Guide |
| Meta description | Step-by-step guide to filing BIR Form 1701Q as a freelancer. Covers both 8% and graduated computation methods, cumulative totals, CWT credits, and where to pay. |
| Target keyword | how to file bir form 1701q philippines |
| Secondary keywords | quarterly income tax return freelancer, 1701q freelancer guide 2026, bir 1701q step by step |
| Target persona | Faye (first-time filer) |
| Search intent | Instructional |
| Word count | 3,200–3,600 words |
| CTA text | "Let TaxKlaro pre-compute your 1701Q numbers — free" |
| CTA destination | / (tool homepage) |

**H1**: How to File BIR Form 1701Q for Freelancers: Step-by-Step Guide (2026)

**H2 Outline**:
1. What Is BIR Form 1701Q? (Definition: quarterly income tax return for self-employed individuals; when required: Q1 by May 15, Q2 by Aug 15, Q3 by Nov 15; Q4 covered by annual ITR)
2. What Is the Cumulative Method? (Explanation: each 1701Q reports total year-to-date income, not just the current quarter; worked example Q1/Q2/Q3 for ₱400K/₱600K/₱900K cumulative)
3. Which Schedule Do You Use? (Schedule I: Graduated + OSD or Itemized; Schedule II: 8% Flat Rate; Decision: depends on regime election in Q1)
4. How to Complete Schedule I (Graduated + OSD): Step by Step (Item-by-item guide: Item 36 gross receipts, Item 37 OSD = 40%, Item 38 NTI, Item 39–44 graduated tax, Item 45–49 credits and payments, Item 50 balance due)
5. How to Complete Schedule II (8% Rate): Step by Step (Item 47 current quarter gross, Item 50 prior 1701Q Item 51, Item 51 cumulative gross, Item 52 ₱250K exemption, Item 53 taxable, Item 54 8% × Item 53, Item 55–58 credits, Item 59 tax payable)
6. How to Credit Your BIR 2307 (Creditable Withholding Tax) (What 2307 is; how to total the amounts; where to enter on 1701Q; what if 2307 exceeds tax due)
7. How to Compute the Balance Due or Overpayment (Formula: Tax Due − CWT Credits − Previous Quarter Payments = Balance Due or (Overpayment); worked example)
8. How to File the 1701Q (eBIRForms submission; authorized agent banks; EFPS if required; no need to go to RDO under EOPT)
9. How to Pay the Tax Due (Over-the-counter at AAB; GCash (LandBank Link.BizPortal); BancNet; timing: same deadline as filing)
10. What Happens If You Miss the Deadline? (Penalty computation: 25% surcharge + 12% annual interest + ₱1,000–₱25,000 compromise; worked example for ₱5,000 tax due filed 30 days late = ₱6,578 total)
11. Common Mistakes to Avoid (7 mistakes: wrong form, forgetting prior quarter payments, wrong gross receipts basis, etc.)

**Featured image spec**: Screenshot mockup of Form 1701Q Schedule II with arrows pointing to key items (47, 50, 52, 54, 59) with labels. TaxKlaro branded header. 1200×630px.

**Internal links from this post**:
- → Post 7 (2307 guide) at Section 6
- → Post 5 (1701 vs 1701A) at Section 1
- → Post 20 (BIR penalties) at Section 10
- → Tool homepage (multiple inline CTAs)

---

### Post 5: "BIR Form 1701 vs 1701A: Which Form Does a Filipino Freelancer File?"

| Attribute | Value |
|-----------|-------|
| URL slug | /blog/bir-form-1701-vs-1701a-which-form-freelancer-philippines |
| SEO title tag | BIR Form 1701 vs 1701A Philippines 2026: Which Form Does a Freelancer File? |
| Meta description | Not sure whether to file Form 1701 or Form 1701A? Use our decision tree: 1701A is for purely self-employed 8% or OSD filers. 1701 is for mixed income, losses, or itemized deductions. |
| Target keyword | bir form 1701 vs 1701a |
| Secondary keywords | which itr form freelancer philippines, 1701 or 1701a self-employed, annual itr form selection |
| Target persona | Faye and Maya |
| Search intent | Informational |
| Word count | 2,000–2,400 words |
| CTA text | "Not sure which form applies to you? Answer 3 questions" |
| CTA destination | / (tool homepage) |

**H1**: BIR Form 1701 vs Form 1701A: Which Annual ITR Form Does a Freelancer File?

**H2 Outline**:
1. The Short Answer: Two Rules That Determine Your Form (Rule 1: Mixed income = always Form 1701; Rule 2: Purely self-employed and using 8% or OSD and no net operating loss = Form 1701A)
2. What Is BIR Form 1701A? (For whom: purely self-employed or professional, using 8% option OR OSD, NOT mixed income, no NOLCO; simpler 2-page form; one schedule for 8% (items 47–56) and one for OSD (items 36–46))
3. What Is BIR Form 1701? (For whom: anyone who does NOT qualify for 1701A; 4 pages + schedules; covers itemized deductions, mixed income, losses, partnerships)
4. Decision Tree: Which Form Is Yours? (Flowchart: Step 1: Any compensation income from employer? → Yes → Form 1701. Step 2: Claiming itemized deductions? → Yes → Form 1701. Step 3: Have net operating loss carryover (NOLCO)? → Yes → Form 1701. Step 4: Registered general professional partnership → Yes → Form 1701. All No → Form 1701A.)
5. Scenario Examples (4 concrete personas: Maria 8% freelancer → 1701A; Jose graduated+itemized → 1701; Ana mixed income → 1701; Pedro OSD only → 1701A)
6. What If You File the Wrong Form? (BIR accepts and processes; may issue a letter of inquiry; difference is usually procedural not substantive; amend if discovered; no penalty for honest form selection error if tax due is correct)
7. Where to File and When (eBIRForms or EFPS; April 15 annual deadline; file-where-you-want under EOPT)

**Featured image spec**: Two-column comparison table visual: "Form 1701A" (simple icon, green checkmarks for qualifying cases) vs "Form 1701" (complex icon, red checkmarks for required cases). 1200×630px.

**Internal links from this post**:
- → Post 4 (1701Q quarterly guide) at Section 7
- → Post 12 (mixed income) at Section 4
- → Post 6 (complete freelancer tax guide) at Section 1
- → Tool homepage (inline CTA)

---

### Post 6: "Freelancer Tax Philippines: Complete Guide to Filing Your Income Tax Return (2026)"

| Attribute | Value |
|-----------|-------|
| URL slug | /blog/freelancer-tax-philippines-complete-guide |
| SEO title tag | Freelancer Tax Philippines 2026: Complete Guide to Filing Your Income Tax Return |
| Meta description | Everything a Filipino freelancer needs to know about taxes: BIR registration, three income tax regimes, quarterly filing, deadlines, forms, and how to pay the least legally. |
| Target keyword | freelancer tax philippines 2026 |
| Secondary keywords | self employed income tax philippines, how to file taxes freelancer philippines, freelancer bir registration guide |
| Target persona | Faye (first-time filer) — pillar page for all personas |
| Search intent | Informational (pillar) |
| Word count | 5,000–7,000 words |
| CTA text | "Skip the confusion — compute your tax in 5 minutes" |
| CTA destination | / (tool homepage) |

**H1**: Freelancer Tax Philippines: The Complete 2026 Guide (Registration, Regimes, Filing, Deadlines)

**H2 Outline**:
1. Do Filipino Freelancers Need to Pay Income Tax? (Yes — all PH-sourced income; threshold: ₱250,000 exempt only under 8% option; link to graduated table)
2. Step 1: Register with BIR (Form 1901, TIN, Certificate of Registration, Books of Accounts, Official Receipts; post-EOPT simplified procedures; estimated cost ₱530; estimated time 1–2 days)
3. Step 2: Understand Your Three Tax Options (Brief overview of 8%, Graduated+OSD, Graduated+Itemized with one-line verdict: "8% wins for most freelancers below ₱3M")
4. Step 3: Elect Your Regime (How and when; Q1 Form 1701Q; what happens if you miss the election)
5. Step 4: File Quarterly Returns (1701Q mechanics, cumulative method, deadlines: May 15, Aug 15, Nov 15)
6. Step 5: Credit Your BIR 2307 Certificates (What CWT is, how to collect 2307 from clients, how to enter on 1701Q)
7. Step 6: File Your Annual Income Tax Return (Form 1701 or 1701A; April 15 deadline; reconciliation with quarterly payments)
8. Do You Need to File Percentage Tax? (2551Q for non-8% filers; 3% quarterly; not applicable if you elected 8%)
9. What If Your Income Exceeds ₱3 Million? (VAT registration required; 8% option gone; different forms and computation)
10. Deadlines at a Glance (Table: all 2026 deadlines)
11. Common Mistakes (10 mistakes with fixes)
12. Frequently Asked Questions (15 Q&As)

**Featured image spec**: Infographic timeline showing "Your Year in Freelancer Taxes": Q1 → elect regime → May 15 → Q2 → Aug 15 → Q3 → Nov 15 → Annual Apr 15. Clean horizontal layout with TaxKlaro brand colors. 1200×630px.

**Internal links from this post**:
- Links to all Posts 1–5, 7, 8, 12, 14, 15, 19, 20
- → Tool homepage (every major section)

---

### Post 7: "How to Use BIR Form 2307: Creditable Withholding Tax for Freelancers Philippines"

| Attribute | Value |
|-----------|-------|
| URL slug | /blog/bir-form-2307-freelancer-philippines-guide |
| SEO title tag | BIR Form 2307 Philippines: How Freelancers Use Creditable Withholding Tax (2026) |
| Meta description | What is BIR Form 2307 and how does it save you money? Learn how to collect 2307 from clients, compute your CWT credits, and offset them against your quarterly and annual income tax. |
| Target keyword | bir form 2307 freelancer philippines |
| Secondary keywords | creditable withholding tax how to use, cwt freelancer philippines, 2307 certificate usage guide |
| Target persona | Faye and Oscar |
| Search intent | Instructional |
| Word count | 2,500–3,000 words |
| CTA text | "Track all your 2307s and compute your net tax due — free" |
| CTA destination | / (tool homepage) |

**H1**: BIR Form 2307: How Filipino Freelancers Use Creditable Withholding Tax (Complete Guide)

**H2 Outline**:
1. What Is BIR Form 2307? (Certificate of Creditable Tax Withheld at Source; issued by your client when they deduct tax before paying you; pre-payment of your income tax)
2. What Are the Withholding Tax Rates? (Table: professional fees 8% if payor ≤₱720K/year to payee, 15% if payor >₱720K/year; management/consultancy 15%; other services 2%; includes BIR ATC codes WI010, WI020, WC010)
3. How to Request a 2307 From Your Client (What to tell your client; timing: issued quarterly or per payment; your right to request under NIRC Sec. 58; template message to send a client)
4. How to Read Your 2307 (What each field means: Box 1 payor info, Box 5 gross amount, Box 7 total tax withheld; what ATC code to check)
5. How to Enter 2307 on BIR Form 1701Q (Where: Schedule I Item 55–56 or Schedule II Item 56–57; worked example: ₱800K gross, three 2307s totaling ₱60,000; balance due = ₱4,000 instead of ₱14,000)
6. What Happens If CWT Exceeds Your Tax Due? (Excess CWT = overpayment; options: carry forward to next quarter OR apply for refund OR claim credit on annual ITR)
7. E-Marketplace 2307 Equivalents: Upwork, Fiverr, Payoneer (BIR RR 16-2023: platforms and e-marketplace operators must withhold 1% on PH-based service providers; equivalent certificate should be requested quarterly)
8. Common 2307 Problems and How to Fix Them (Client refuses to issue; wrong amounts; lost certificates; 2307 not matching income)

**Featured image spec**: Sample completed BIR Form 2307 with boxes highlighted showing where tax withheld appears. Overlay text: "This ₱24,000 reduces your next tax bill." 1200×630px.

**Internal links from this post**:
- → Post 4 (1701Q) at Section 5
- → Post 13 (Upwork/Fiverr tax) at Section 7
- → Tool homepage (after Section 5 worked example)

---

### Post 8: "BIR Form 2551Q: Quarterly Percentage Tax Return for Freelancers Philippines"

| Attribute | Value |
|-----------|-------|
| URL slug | /blog/bir-form-2551q-freelancer-percentage-tax-philippines |
| SEO title tag | BIR Form 2551Q Philippines 2026: Quarterly Percentage Tax for Freelancers (Step-by-Step) |
| Meta description | Do you need to file BIR Form 2551Q? Most freelancers who don't use the 8% option pay 3% quarterly percentage tax. Here's exactly how to compute and file it. |
| Target keyword | bir form 2551q freelancer philippines |
| Secondary keywords | percentage tax quarterly freelancer, 2551q step by step guide, 3 percent percentage tax self-employed |
| Target persona | Faye |
| Search intent | Instructional |
| Word count | 2,000–2,400 words |
| CTA text | "Check if you need to file 2551Q — and compute your amount free" |
| CTA destination | / (tool homepage) |

**H1**: BIR Form 2551Q: Quarterly Percentage Tax Return for Filipino Freelancers (2026 Guide)

**H2 Outline**:
1. What Is BIR Form 2551Q? (Quarterly percentage tax return; 3% of gross quarterly sales/receipts; separate from income tax)
2. Who Must File 2551Q? (Non-VAT registered; NOT electing 8% income tax option; self-employed with gross < ₱3M)
3. Who Does NOT File 2551Q? (VAT-registered taxpayers: file 2550Q instead; 8% income tax option electors: percentage tax waived per RR 8-2018)
4. How to Compute Your Percentage Tax (Formula: 3% × gross receipts for the quarter; no deductions; worked example Q1 ₱200,000 gross → ₱6,000 percentage tax)
5. Important: 3% Rate History (CREATE Law temporarily reduced to 1% from July 1, 2020 to June 30, 2023; rate returned to 3% on July 1, 2023 per RA 11534 transition; as of 2026 the rate is 3%)
6. How to Complete and File 2551Q (Schedule 1, ATC code PT010 for professional services; due dates: Q1 Jan 25, Q2 Apr 25, Q3 Jul 25, Q4 Oct 25; file via eBIRForms)
7. Is Percentage Tax Deductible From Income Tax? (Yes — percentage tax paid is deductible under Sec. 34(C)(1) as a tax expense when computing Path A income tax; not deductible for OSD filers)
8. Common Mistakes (5 mistakes: filing 2551Q when you elected 8%; wrong quarter date; not deducting on annual ITR)

**Featured image spec**: Side-by-side graphic: "8% Option" (no 2551Q icon with checkmark) vs "Graduated" (2551Q required icon with ₱6,000 example). 1200×630px.

**Internal links from this post**:
- → Post 1 (8% option) at Section 2–3
- → Post 4 (1701Q) at Section 6
- → Tool homepage (after Section 4)

---

### Post 9: "Optional Standard Deduction (OSD) Philippines: Is 40% Better Than 8%?"

| Attribute | Value |
|-----------|-------|
| URL slug | /blog/optional-standard-deduction-philippines-osd-vs-8-percent |
| SEO title tag | Optional Standard Deduction (OSD) Philippines 2026: Is 40% Better Than the 8% Option? |
| Meta description | OSD lets you deduct 40% of gross receipts without receipts. But is it better than the 8% flat rate? See the exact comparison with numbers — and when OSD makes sense. |
| Target keyword | optional standard deduction philippines freelancer |
| Secondary keywords | OSD vs 8% income tax, 40 percent optional standard deduction, nirc section 34l osd |
| Target persona | Oscar |
| Search intent | Informational |
| Word count | 2,500–3,000 words |
| CTA text | "Compute OSD vs 8% for YOUR numbers — free" |
| CTA destination | / (tool homepage) |

**H1**: Optional Standard Deduction (OSD) Philippines: When Does 40% Beat the 8% Flat Rate?

**H2 Outline**:
1. What Is the Optional Standard Deduction? (NIRC Sec. 34(L); 40% of gross sales/receipts; no need to substantiate with receipts; available under graduated method only)
2. How to Compute OSD (Formula: NTI = Gross Receipts × 60%; then apply graduated rate; worked example ₱600K → NTI ₱360K → tax ₱59,000)
3. How to Compare OSD to the 8% Option (₱600K: 8% tax = ₱28,000; OSD tax = ₱59,000; 8% wins by ₱31,000)
4. Is There EVER a Scenario Where OSD Beats 8%? Below ₱3M? (Answer: Almost never below ₱3M; for service providers OSD produces graduated-rate tax on 60% of income, almost always higher than 8% on 92.5%; show mathematically)
5. When OSD Beats 8% for VAT-Registered Freelancers Above ₱3M (Above ₱3M, 8% option is not available; choice is OSD vs itemized; OSD wins when expense ratio < 40%; formula and worked example ₱5M gross)
6. When Does Itemized Beat OSD? (When actual deductible expenses > 40% of gross; threshold: if you can substantiate > ₱240,000 in expenses on ₱600K gross, itemized beats OSD)
7. OSD Pros and Cons (Pro: no receipt-keeping; Con: always loses to 8% below ₱3M; Con: can lose to itemized above ₱3M if high expenses)
8. Decision Guide: Which Regime Is Right for You? (3-question flowchart; CTA to tool)

**Featured image spec**: Three-bar chart at ₱600K income level: 8% = ₱28K (green, shortest); OSD = ₱59K (yellow); Itemized (0% expenses) = ₱100K (red). Text: "OSD is not your best option below ₱3M." 1200×630px.

**Internal links from this post**:
- → Post 1 (8% complete guide) at Section 2
- → Post 10 (itemized) at Section 6
- → Tool homepage (after Section 3 comparison)

---

### Post 10: "Itemized Deductions Philippines: What Freelancers Can Legally Deduct From Their Taxes"

| Attribute | Value |
|-----------|-------|
| URL slug | /blog/itemized-deductions-freelancer-philippines |
| SEO title tag | Itemized Deductions Philippines 2026: What Freelancers Can Legally Deduct From Income Tax |
| Meta description | Full list of tax-deductible expenses for Philippine freelancers under NIRC Sec. 34: equipment, rent, salaries, depreciation, interest, charitable donations. With documentation requirements. |
| Target keyword | itemized deductions freelancer philippines |
| Secondary keywords | what can freelancers deduct philippines, nirc section 34 allowable deductions, tax deductions self-employed philippines |
| Target persona | Oscar (high-expense professional) |
| Search intent | Informational |
| Word count | 3,000–3,500 words |
| CTA text | "See if itemized deductions beat 8% for your expenses — compute free" |
| CTA destination | / (tool homepage) |

**H1**: Itemized Deductions for Philippine Freelancers: What You Can Legally Deduct From Your Tax (2026)

**H2 Outline**:
1. What Are Itemized Deductions? (NIRC Sec. 34(A)–(K); substantiated actual expenses; requires official receipts or BIR-approved invoices; available only under graduated method)
2. The Full List of Allowable Deductions (Table: all deduction categories — ordinary and necessary expenses, salaries, rentals, interest net of arbitrage reduction, taxes paid, losses, bad debts, depreciation, depletion, charitable contributions with caps, R&D, pension trust; with NIRC citation for each)
3. What You CANNOT Deduct (Table: personal living expenses, fines and penalties, bribes, political contributions, non-business meals, luxury vehicle excess over ₱2,400,000 cost, insurance on life of owner, etc.)
4. Documentation Requirements (Official Receipt from BIR-registered supplier; minimum information on receipt; retention period 10 years; what to do for foreign suppliers without PH OR)
5. Entertainment, Amusement and Recreation (EAR) Expenses: The Cap (0.5% of net sales for service; max deductible EAR for ₱600K service income = ₱3,000; applies to client entertainment, meals, gifts)
6. Depreciation: How to Deduct Equipment Over Time (Straight-line and declining balance; useful life table for common freelancer assets; worked example for ₱120,000 laptop over 5 years = ₱24,000/year)
7. Home Office Deduction: Is It Allowed? (Yes — proportional to exclusive business use area; formula: (business floor area / total floor area) × rent/utilities/mortgage interest; documentation required; MRF flag if home is dual-use)
8. NOLCO: When You Have More Expenses Than Income (Net Operating Loss Carry-Over; up to 3 consecutive years; requires taxable income in prior year; worked example ₱150K loss → deduction in following years)
9. When Does Itemized Beat 8%? (Break-even analysis: need expense ratio ≥ 67% for ₱600K earner; table showing threshold at various income levels; most freelancers can't hit this with legitimate deductible expenses)
10. How to Claim Itemized Deductions on Your Return (Form 1701 Schedules; list of supporting documents to attach; common audit triggers)

**Featured image spec**: Two-column layout: "Deductible ✓" column (laptop, rent, internet, salaries, depreciation) vs "Not Deductible ✗" column (personal groceries, fines, bribes, non-business travel). Clean icon-based design. 1200×630px.

**Internal links from this post**:
- → Post 2 (8% vs graduated comparison) at Section 9
- → Post 9 (OSD) for comparison
- → Post 11 (high-income strategy) at Section 9
- → Tool homepage (inline CTAs)

---

### Post 11: "High-Income Freelancer Tax Strategy Philippines: When Itemized Deductions Beat the 8% Option"

| Attribute | Value |
|-----------|-------|
| URL slug | /blog/high-income-freelancer-tax-strategy-philippines |
| SEO title tag | High-Income Filipino Freelancer Tax Strategy 2026: When Itemized Deductions Beat 8% |
| Meta description | Earn ₱1.5M+ per year? There's a specific expense ratio where itemized deductions produce lower tax than the 8% option. Here's the exact calculation and strategy. |
| Target keyword | high income freelancer tax philippines |
| Secondary keywords | freelancer tax deductions philippines strategy, when itemized beats 8 percent, tax planning self-employed philippines |
| Target persona | Oscar (₱1.5M+ earner) |
| Search intent | Informational |
| Word count | 2,500–3,000 words |
| CTA text | "Enter your income and expenses — see which regime saves you more" |
| CTA destination | / (tool homepage) |

**H1**: When Itemized Deductions Beat the 8% Option: A Tax Strategy for High-Income Filipino Freelancers

**H2 Outline**:
1. The Rule Most CPAs Know But Don't Explain (8% is almost always better below ₱3M unless expense ratio exceeds a threshold; most freelancers don't know their threshold)
2. The Breakeven Formula (At each income level, the exact expense ratio where itemized tax = 8% tax; table for ₱500K, ₱1M, ₱1.5M, ₱2M, ₱2.5M gross)
3. Worked Example: ₱2,000,000 Earner with ₱1,400,000 in Expenses (Path C 8%: ₱140,000 tax; Path A itemized: NTI ₱600,000 → ₱130,000 tax; itemized wins by ₱10,000)
4. What Counts as a Legitimate Expense? (Brief checklist; links to Post 10 for full list)
5. The Documentation Trap (Must have official receipts; BIR audits high-deduction returns more frequently; risks of aggressive deductions)
6. The Tax Planning Decision (Should you go itemized? Decision matrix: income level × expense ratio × documentation quality)
7. What If Your Income Is Above ₱3M? (8% no longer available; only choice is OSD vs itemized; OSD beats itemized at expense ratio < 40%; detailed example at ₱4M gross)
8. Year-End Planning: Should You Accelerate Expenses? (Strategic timing of legitimate deductible expenses; purchase timing before December 31; works for real freelancers, not fake receipts)

**Featured image spec**: Line graph showing "Tax Due vs Expense Ratio" for 8% (flat line) and Itemized (declining line that crosses 8% at ~67% expense ratio). TaxKlaro branded. 1200×630px.

**Internal links from this post**:
- → Post 10 (itemized deductions full list) at Section 4
- → Post 14 (VAT threshold) at Section 7
- → Tool homepage (after breakeven table)

---

### Post 12: "Mixed Income Earner Philippines: How to File Taxes When You Have a Day Job AND Freelance Income"

| Attribute | Value |
|-----------|-------|
| URL slug | /blog/mixed-income-earner-philippines-tax-guide |
| SEO title tag | Mixed Income Earner Philippines 2026: Tax Guide for Employees with Freelance Side Hustle |
| Meta description | Have a day job AND earn freelance income? Learn how Philippine mixed income earners file taxes: Form 1701, which regime applies, how the ₱250K exemption works, and what your tax due really is. |
| Target keyword | mixed income earner philippines tax |
| Secondary keywords | employee and freelancer philippines tax, day job and freelance income tax, mixed income 8 percent option |
| Target persona | Maya (mixed income) |
| Search intent | Informational |
| Word count | 3,000–3,500 words |
| CTA text | "Compute your mixed income tax in 5 minutes — free" |
| CTA destination | / (tool homepage) |

**H1**: Mixed Income Earner Philippines: Complete Tax Guide for Employees with Freelance Income (2026)

**H2 Outline**:
1. What Is a Mixed Income Earner? (Philippine tax definition: earns BOTH compensation income from employment AND business/professional income from freelance work)
2. Which Tax Form Do Mixed Income Earners File? (Always Form 1701 — never Form 1701A; employer's 2316 is attached; annual filing required even if employer already withheld)
3. How Your Compensation Income Is Taxed (Employer withholds via graduated rates; you get BIR Form 2316; compensation income always uses graduated rates — you cannot opt this to 8%)
4. How Your Freelance Income Is Taxed (Can still choose 8%, OSD, or itemized for the BUSINESS PORTION ONLY; critical: ₱250,000 exemption is NOT deducted when you have compensation income — per RMC 50-2018)
5. The ₱250,000 Exemption Rule for Mixed Income Earners (The ₱250K deduction under 8% exists because purely self-employed earners don't get a personal exemption; mixed income earners DO get the personal exemption via the compensation income zero-bracket; so ₱250K is set to ₱0 for 8% computation when compensation > 0)
6. Worked Example: Maya (₱480K employment + ₱300K freelance, 8% path) (Step-by-step: compensation NTI via graduated, business income 8% × ₱300,000 = ₱24,000, total tax due = compensation tax + business tax − employer withholding)
7. Worked Example: Maya (₱480K employment + ₱300K freelance, OSD path) (Show OSD computation for business income; compare to 8%; 8% wins at this level)
8. Quarterly Filing Obligation for Mixed Income Earners (File 1701Q for business income only; compensation is employer-handled; Q1 by May 15, Q2 by Aug 15, Q3 by Nov 15)
9. Annual Reconciliation: How to Combine Both Income Sources (Form 1701: aggregate on annual return; employer's withholding from 2316 credited against final tax; balance due or refundable)
10. Common Mistakes for Mixed Income Earners (5 mistakes: trying to use Form 1701A, forgetting 2316, applying ₱250K deduction, wrong quarterly form, not filing quarterly at all)

**Featured image spec**: Two-part income breakdown graphic: "Your Income Split: ₱480K Compensation (employer handles) + ₱300K Freelance (you manage)" with arrows showing different computation paths that merge into Form 1701. 1200×630px.

**Internal links from this post**:
- → Post 1 (8% option) at Section 4
- → Post 5 (1701 vs 1701A) at Section 2
- → Post 4 (1701Q quarterly) at Section 8
- → Tool homepage (multiple inline CTAs)

---

### Post 13: "Foreign Income Philippines Tax: How Upwork and Fiverr Freelancers Are Taxed"

| Attribute | Value |
|-----------|-------|
| URL slug | /blog/upwork-fiverr-freelancer-philippines-income-tax |
| SEO title tag | Upwork and Fiverr Philippines Tax 2026: How to File Your Foreign Freelance Income |
| Meta description | Filipino freelancers on Upwork and Fiverr still owe Philippine income tax. Learn how foreign-sourced income is taxed, how BIR 2307 equivalents work for Payoneer/PayPal, and how to file. |
| Target keyword | upwork philippines tax |
| Secondary keywords | fiverr philippines income tax, foreign income freelancer philippines, payoneer philippines tax |
| Target persona | Faye (platform freelancer) |
| Search intent | Informational |
| Word count | 2,500–3,000 words |
| CTA text | "Compute your Philippine income tax on your Upwork/Fiverr earnings — free" |
| CTA destination | / (tool homepage) |

**H1**: How Upwork and Fiverr Freelancers in the Philippines Pay Income Tax (Complete 2026 Guide)

**H2 Outline**:
1. Is Foreign Freelance Income Taxable in the Philippines? (Yes — Philippine resident citizens are taxed on worldwide income; no exception for foreign-client platform income; gross receipts include all Upwork/Fiverr earnings converted to PHP)
2. Currency Conversion: When and How? (Use BSP reference rate on date of receipt or bank credit; or monthly average rate; document the rate used; example: $500 × ₱56.50 = ₱28,250)
3. Does BIR Know About My Upwork/Fiverr Income? (Yes — BIR RR 16-2023 requires e-marketplace operators and payment processors to report Philippine-based recipients; Payoneer, PayPal, GCash required to report and withhold)
4. The 1% Withholding on Platform Income (BIR RR 16-2023: digital payment and e-marketplace platforms withhold 1% on gross remittances to PH-based sellers/freelancers effective January 2024; this becomes your BIR 2307 equivalent)
5. How to Claim the 1% Withholding as a Tax Credit (Request certificate from payment processor; enter as CWT on 1701Q and annual 1701/1701A; reduces your income tax liability peso-for-peso)
6. No Foreign Tax Credit for Services Rendered in Philippines (If you physically performed the service in the Philippines, there is no double taxation treaty relief — Philippine tax applies in full; no credit for any tax that may have been withheld by a foreign client in another country)
7. Which Income Tax Regime Can Platform Freelancers Use? (All three regimes available as long as gross receipts ≤ ₱3M; 8% is most common recommendation; worked example ₱600K Upwork earnings = ₱28,000 PH tax)
8. Step-by-Step for First-Time Platform Filer (Register with BIR using platform income as source; elect regime on Q1 1701Q; request 2307-equivalent from Payoneer/PayPal; file quarterly; file annual)

**Featured image spec**: Map showing PH flag + US client + Upwork logo, with peso symbol and BIR logo. Caption: "₱600K Upwork income = ₱28,000 Philippine income tax." 1200×630px.

**Internal links from this post**:
- → Post 7 (BIR 2307) at Section 5
- → Post 1 (8% option) at Section 7
- → Post 6 (complete freelancer guide) at Section 8
- → Tool homepage (inline CTA)

---

### Post 14: "VAT Registration Philippines: When Your Freelance Income Hits ₱3 Million"

| Attribute | Value |
|-----------|-------|
| URL slug | /blog/vat-registration-philippines-freelancer-3-million-threshold |
| SEO title tag | VAT Registration Philippines for Freelancers: What Happens When You Hit ₱3 Million (2026) |
| Meta description | Approaching ₱3M in annual freelance income? Here's exactly when VAT registration is required, how to register, what changes in your tax computation, and why the 8% option disappears. |
| Target keyword | VAT registration philippines freelancer |
| Secondary keywords | 3 million VAT threshold philippines, vat registered freelancer philippines, freelancer vat computation |
| Target persona | Oscar (high earner approaching threshold) |
| Search intent | Informational |
| Word count | 2,500–3,000 words |
| CTA text | "Check if you're near the ₱3M VAT threshold — compute your current total" |
| CTA destination | / (tool homepage) |

**H1**: VAT Registration for Philippine Freelancers: What Happens When You Earn ₱3 Million (2026)

**H2 Outline**:
1. The ₱3M Threshold: Three Things That Change Simultaneously (1: 8% option is no longer available; 2: percentage tax obligation is replaced by VAT; 3: Form 2550Q replaces Form 2551Q)
2. When Exactly Is VAT Registration Required? (When gross sales/receipts EXCEED ₱3,000,000 in any 12-month period; exact crossing triggers 30-day voluntary registration window; penalty for failure to register)
3. How to Register for VAT (BIR Form 1905 amendment of COR; update to VAT taxpayer class; Books of Accounts update; Official Receipts must now state "VAT OR")
4. How Income Tax Changes for VAT-Registered Freelancers (8% option gone; only Path A (itemized) or Path B (OSD) available; OSD still 40% of gross; itemized requires receipts)
5. How VAT Works for Service Freelancers (12% output VAT on every invoice; input VAT credits from business purchases; net VAT due = output − input; Form 2550Q quarterly)
6. Worked Example: ₱5,000,000 Gross Receipts VAT-Registered Freelancer (Compute Path B (OSD): NTI = ₱3,000,000; graduated tax = ₱890,000; output VAT = ₱600,000 − input VAT credits; total tax burden comparison)
7. Can You Avoid VAT Registration? (No — it is mandatory once threshold is exceeded; can de-register if receipts drop below ₱3M for 12 consecutive months under EOPT procedures)
8. Zero-Rating for Exports / Upwork Foreign Clients (Services rendered to non-residents and consumed abroad are VAT zero-rated; if all Upwork clients are foreign, you may qualify for 0% VAT on service income; requires BIR certification; complex — see CPA for export VAT refund)

**Featured image spec**: Income gauge showing ₱0 → ₱3M → beyond, with markers: "8% Zone" (₱0–₱3M, green), "VAT Zone" (₱3M+, orange). 1200×630px.

**Internal links from this post**:
- → Post 9 (OSD) for ₱3M+ regime options
- → Post 11 (high-income strategy) for VAT-registered income tax planning
- → Tool homepage (CTA)

---

### Post 15: "BIR Registration for Freelancers Philippines: Step-by-Step Guide (2026)"

| Attribute | Value |
|-----------|-------|
| URL slug | /blog/bir-registration-freelancer-philippines-guide |
| SEO title tag | BIR Registration for Freelancers Philippines 2026: Complete Step-by-Step Guide |
| Meta description | New freelancer in the Philippines? Here's exactly how to register with BIR: Form 1901, TIN application, Certificate of Registration, Official Receipts, Books of Accounts. Updated for EOPT Act 2024. |
| Target keyword | bir registration freelancer philippines 2026 |
| Secondary keywords | how to register bir freelancer, bir form 1901 self-employed, freelancer bir compliance philippines |
| Target persona | Faye (first-time filer, pre-registration) |
| Search intent | Instructional |
| Word count | 3,000–3,500 words |
| CTA text | "Once you're registered, compute your tax regime for free" |
| CTA destination | / (tool homepage) |

**H1**: How to Register with BIR as a Freelancer in the Philippines (2026 Step-by-Step Guide)

**H2 Outline**:
1. Why You Need to Register (Legal requirement under NIRC; enables you to issue Official Receipts required by clients; avoids ₱20,000–₱50,000 penalty for unregistered operation)
2. What You Need to Prepare (Checklist: government ID, proof of address, proof of profession/business, TIN application if new taxpayer, ₱530 initial fees breakdown)
3. Step 1: Get a TIN (If you don't have one: BIR Form 1901 + requirements; if you have one from employment: use existing TIN, just update to self-employed)
4. Step 2: Fill Out BIR Form 1901 (Field-by-field guide: Line 1 TIN, Lines 4–6 name, Line 12 civil status, Line 20 trade name, Line 21A type of registration, Line 22 industry code, Lines 23–25 business address)
5. Step 3: Submit to Your RDO (Under EOPT Act, you can now register and file at any BIR office; pick the most convenient; bring originals + photocopies; processing time 1–3 days)
6. Step 4: Pay the Registration Fees (₱500 annual registration fee [note: post-EOPT ARF is only required for initial registration and subsequent year renewals — BIR clarified RMC 62-2023]; ₱30 loose-leaf Books of Accounts fee per set)
7. Step 5: Get Your Certificate of Registration (Form 2303; display in your home office or workspace; contains your RDO, tax type obligations, and taxpayer classification)
8. Step 6: Register Your Books of Accounts (Manual or loose-leaf BIR-registered; must be updated every transaction; BIR can inspect)
9. Step 7: Register Your Official Receipts or Sales Invoices (BIR-accredited printer; minimum 25 booklets at ~₱100–₱300 each; OR use BIR-accredited electronic OR software)
10. What's Different After EOPT Act 2024 (No more mandatory annual ₱500 registration fee renewal for existing taxpayers — only initial registration; can file anywhere; no need to update TIN address before filing from different location)

**Featured image spec**: Checklist infographic: "BIR Registration Checklist for Filipino Freelancers" with all steps checked. TaxKlaro branding. 1200×630px.

**Internal links from this post**:
- → Post 6 (complete freelancer tax guide) as next step after registration
- → Post 4 (1701Q) for quarterly filing after registration
- → Post 1 (8% option) for regime election after registration
- → Tool homepage (CTA)

---

### Post 16: "Taxumo Philippines Review 2026: Is It Worth ₱9,249/Year?"

| Attribute | Value |
|-----------|-------|
| URL slug | /blog/taxumo-philippines-review-2026 |
| SEO title tag | Taxumo Philippines Review 2026: Features, Pricing, and Is It Worth It? |
| Meta description | Honest Taxumo review 2026: ₱2,499–₱4,248/quarter pricing breakdown, what it does well (deadline reminders, filing integration), what's missing (no tax regime comparison), and better alternatives. |
| Target keyword | taxumo review philippines |
| Secondary keywords | taxumo vs alternatives, taxumo pricing 2026, taxumo freelancer review |
| Target persona | Oscar (evaluating tools) |
| Search intent | Commercial Investigation |
| Word count | 2,000–2,500 words |
| CTA text | "Compare Taxumo to TaxKlaro — see which computes your actual tax savings" |
| CTA destination | / (tool homepage) |

**H1**: Taxumo Philippines Review 2026: Is It Worth the Money for Freelancers?

**H2 Outline**:
1. What Is Taxumo? (Philippines' largest tax filing SaaS; 100K+ users; automated BIR filing; deadline reminders)
2. Taxumo Pricing 2026 (Starter ₱999/month or ₱2,499/quarter; Basic ₱1,333/month or ₱3,249/quarter; Premium ₱1,633/month or ₱4,248/quarter; annual discount available)
3. What Taxumo Does Well (Automated eBIRForms filing; deadline email/SMS reminders; stores returns; user-friendly interface; good for BIR compliance automation)
4. What Taxumo Cannot Do (No tax regime comparison — does not compute 8% vs OSD vs itemized and recommend the lowest; no quarterly tax optimization; no 2307 credit tracking across quarters)
5. Who Should Use Taxumo (Freelancers who already know their regime and just want automated filing; those who forget BIR deadlines; anyone who has already optimized their tax situation)
6. Who Should NOT Rely On Taxumo Alone (Freelancers who haven't yet chosen a regime; anyone who wants to know "am I overpaying?"; new filers who need guidance on which form and regime)
7. TaxKlaro vs Taxumo: What's Different (TaxKlaro: regime optimization first, then filing prep; Taxumo: filing automation; they're complementary — compute with TaxKlaro, file with Taxumo or eBIRForms)
8. Final Verdict (Useful tool for compliance automation; misses the core question most freelancers have; recommended to use ALONGSIDE a regime optimizer)

**Featured image spec**: Side-by-side comparison table graphic with green checkmarks and red X marks for each tool's features. 1200×630px.

**Internal links from this post**:
- → Post 17 (tax software comparison) for full comparison
- → Post 2 (8% vs graduated) to illustrate what Taxumo doesn't do
- → Tool homepage (CTA positioned right after Section 4)

---

### Post 17: "Best Tax Filing Software for Freelancers Philippines 2026 (Comparison)"

| Attribute | Value |
|-----------|-------|
| URL slug | /blog/best-tax-software-freelancer-philippines-2026 |
| SEO title tag | Best Tax Software for Freelancers Philippines 2026: Taxumo vs JuanTax vs TaxKlaro vs eBIRForms |
| Meta description | Comparison of every tax tool for Philippine freelancers in 2026: Taxumo, JuanTax, TaxWhiz, eBIRForms, and TaxKlaro. Features, pricing, regime comparison, PDF export, and verdict. |
| Target keyword | tax software freelancer philippines |
| Secondary keywords | best bir tax filing software, taxumo vs juantax philippines, freelancer tax app philippines |
| Target persona | Oscar and CPA Charlie |
| Search intent | Commercial Investigation |
| Word count | 2,500–3,000 words |
| CTA text | "Try TaxKlaro free — compute all three regimes and find your lowest tax" |
| CTA destination | / (tool homepage) |

**H1**: Best Tax Software for Filipino Freelancers 2026: The Complete Comparison (Taxumo vs JuanTax vs TaxKlaro vs eBIRForms)

**H2 Outline**:
1. What to Look for in a Philippine Freelancer Tax Tool (Regime comparison; quarterly tracking; 2307 management; deadline reminders; PDF export; BIR eBIRForms integration; mobile access; price)
2. Feature Comparison Table (Matrix: all 5 tools × 8 features with checkmarks, partial marks, and X)
3. Pricing Comparison Table (Monthly and annual cost for each tool)
4. Taxumo: Best for Deadline Automation (Summary + when to use)
5. JuanTax: Best for BIR Direct Filing (eTSP integration; Fast File vs Plus; when to use)
6. TaxWhiz by ACG: Best for Mobile-First Users (App-based; CPA advisory; when to use)
7. eBIRForms: Best for Zero-Cost Filing (Free; Windows-only; no computation; when to use)
8. TaxKlaro: Best for Tax Optimization (Regime comparison; quarterly tracking; when to use)
9. My Recommendation for Each Persona (Faye, Oscar, Maya, CPA Charlie: which tool for whom)
10. The Bottom Line: What Most Freelancers Actually Need (Regime comparison first, then filing; no one tool does both perfectly; recommended stack)

**Featured image spec**: 5-column comparison table infographic showing each tool, pricing, and top feature. TaxKlaro highlighted column. 1200×630px.

**Internal links from this post**:
- → Post 16 (Taxumo review) at Section 4
- → Tool homepage (inline CTAs after each competitor review)

---

### Post 18: "eBIRForms Alternatives for Mac Users Philippines: File BIR Returns Without Windows"

| Attribute | Value |
|-----------|-------|
| URL slug | /blog/ebirforms-mac-alternative-philippines |
| SEO title tag | eBIRForms Mac Alternative Philippines 2026: How to File BIR Returns Without Windows |
| Meta description | eBIRForms only works on Windows. Here are the best alternatives for Mac and Linux users to file BIR returns in the Philippines — including web-based tools that work on any device. |
| Target keyword | ebirforms mac alternative |
| Secondary keywords | bir tax filing mac philippines, ebirforms linux alternative, bir online filing mac |
| Target persona | Faye (Mac user) |
| Search intent | Informational |
| Word count | 1,500–1,800 words |
| CTA text | "File on any device — no Windows needed. Try TaxKlaro free." |
| CTA destination | / (tool homepage) |

**H1**: eBIRForms Mac Alternative Philippines: How to File Your BIR Returns on Mac, Chrome, or Any Device (2026)

**H2 Outline**:
1. The eBIRForms Problem for Mac Users (Official eBIRForms desktop: Windows-only; crashes on Mac via Wine/CrossOver; BIR does not maintain a Mac version)
2. Option 1: BIR's Own Online eBIRForms (Web-based version at bir.gov.ph/ebirforms; limited form availability; EFPS required for large taxpayers; works in any browser but interface is dated)
3. Option 2: Web-Based Tax Tools (Taxumo, JuanTax Fast File — both browser-based, generate and submit eBIRForms-compatible XML; pricing)
4. Option 3: TaxKlaro + Manual Submission (Compute using TaxKlaro in browser; manually transfer computed figures to BIR's web eFPS or AAB; works for 1701Q, 1701, 1701A, 2551Q)
5. Option 4: Windows Virtual Machine (Parallels Desktop or VMware Fusion on Mac; run official eBIRForms; cost ~₱3,000/year for Parallels; overkill for most freelancers)
6. Recommended Approach for Mac Freelancers (Step-by-step: compute with TaxKlaro → download PDF summary → submit via BIR Online or AAB → keep PDF as evidence)

**Featured image spec**: Mac laptop graphic with "eBIRForms Not Compatible" overlay, vs browser window showing TaxKlaro working. 1200×630px.

**Internal links from this post**:
- → Post 17 (tax software comparison) at Section 3–4
- → Tool homepage (CTA)

---

### Post 19: "BIR Filing Calendar 2026: Every Deadline for Freelancers and Self-Employed"

| Attribute | Value |
|-----------|-------|
| URL slug | /blog/bir-filing-calendar-2026-freelancer |
| SEO title tag | BIR Filing Calendar 2026: Every Deadline for Freelancers and Self-Employed Philippines |
| Meta description | Complete BIR filing deadline calendar for Filipino freelancers in 2026: quarterly income tax, annual ITR, percentage tax, VAT, registration. Never miss a BIR deadline again. |
| Target keyword | bir deadlines 2026 freelancer |
| Secondary keywords | bir filing calendar 2026 self-employed, quarterly tax deadline philippines 2026, annual itr deadline 2026 |
| Target persona | Faye |
| Search intent | Informational |
| Word count | 1,500–2,000 words |
| CTA text | "Set up deadline reminders — plus compute your tax free" |
| CTA destination | / (tool homepage with deadline calendar feature) |

**H1**: BIR Filing Calendar 2026: Every Tax Deadline for Filipino Freelancers and Self-Employed

**H2 Outline**:
1. Overview: How Many Returns Does a Filipino Freelancer File Per Year? (For 8% filers: 3 quarterly 1701Q + 1 annual 1701/1701A = 4 returns. For graduated (OSD/itemized) non-VAT filers: 3 × 1701Q + 4 × 2551Q + 1 annual = 8 returns)
2. Complete 2026 Filing Deadline Table (Every filing: date, form, description, applicable to whom; covers 1701Q Q1–Q3, annual ITR, 2551Q Q1–Q4, 1601-C monthly employer remittance for those with employees — full calendar)
3. Q1 2026 Deadlines (January–May): (Jan 25: 2551Q for Q4 2025 percentage tax; Apr 15: Annual ITR 1701/1701A for TY2025 + Q1 regime election deadline; May 15: 1701Q for Q1 2026)
4. Q2 2026 Deadlines (June–August): (Apr 25: 2551Q for Q1 2026; Aug 15: 1701Q for Q2 2026; Jul 25: 2551Q for Q2 2026)
5. Q3 2026 Deadlines (September–November): (Oct 25: 2551Q for Q3 2026; Nov 15: 1701Q for Q3 2026)
6. Q4 2026 Deadlines (December): (No income tax return — covered by April 15 annual ITR next year; Dec/Jan 25: 2551Q for Q4 2026)
7. What If a Deadline Falls on a Weekend or Holiday? (BIR rule: next working day applies; list known 2026 Philippine holidays that affect deadlines: Jan 1 New Year, Apr 9 Araw ng Kagitingan, Apr 14-15 Holy Thursday/Good Friday, May 1 Labor Day, etc.)
8. How to Never Miss a BIR Deadline (TaxKlaro deadline reminders; calendar subscription; mobile notifications)

**Featured image spec**: 12-month grid calendar for 2026 with all BIR deadlines highlighted in different colors by type. 1200×630px + printable A4 PDF version.

**Internal links from this post**:
- → Post 4 (1701Q guide) at Q1/Q2/Q3 deadline sections
- → Post 8 (2551Q guide) at percentage tax deadline sections
- → Tool homepage (deadline reminder feature CTA)

---

### Post 20: "BIR Penalties for Late Filing Philippines: What Freelancers Need to Know"

| Attribute | Value |
|-----------|-------|
| URL slug | /blog/bir-penalty-late-filing-philippines-freelancer |
| SEO title tag | BIR Penalties for Late Filing Philippines 2026: How Much Will You Owe as a Freelancer? |
| Meta description | Late on a BIR return? Here's exactly how Philippine late filing penalties are computed: 25% surcharge, 12% annual interest, and compromise penalty. With a worked example for freelancers. |
| Target keyword | bir penalty late filing philippines freelancer |
| Secondary keywords | bir surcharge interest penalty computation, late bir filing how much, bir compromise penalty freelancer |
| Target persona | Oscar (considering late catch-up) |
| Search intent | Informational |
| Word count | 2,000–2,400 words |
| CTA text | "Compute your tax due before your penalty grows — it's free" |
| CTA destination | / (tool homepage) |

**H1**: BIR Penalties for Late Filing in the Philippines: How Much Will You Owe? (2026 Guide)

**H2 Outline**:
1. The Three Components of a BIR Penalty (1: Basic tax due; 2: Surcharge (25% for negligence); 3: Interest (12% per year under RA 11976); 4: Compromise penalty (table-based by tax amount))
2. Surcharge: When Is It 25% vs 50%? (25%: ordinary late filing; 50%: willful neglect or false/fraudulent return; test for "willful neglect")
3. Interest Rate: 12% Per Year Under EOPT Act (RA 11976 reduced interest from double legal rate formula to flat 12%; prorated daily; formula with worked example)
4. Compromise Penalty Table (Per RMO 7-2015 Annex A: 9 brackets from ₱1K (≤₱5K tax due) to ₱50K (₱500K+ tax due); table reproduced in full)
5. Worked Example: Freelancer Files 1701Q 45 Days Late (Tax due ₱5,000; surcharge ₱1,250; interest = ₱5,000 × 12% × 45/365 = ₱73.97; compromise ₱1,000; total ₱7,323.97)
6. MICRO and SMALL Taxpayer Reduced Rates Under EOPT (Surcharge reduced from 25% to 10% for Micro/Small taxpayers; interest reduced to 6%; applies if gross sales < ₱3M for Micro, < ₱20M for Small — verify your EOPT tier)
7. What If You Filed But Didn't Pay? (Only penalty is interest at 12%; no surcharge for filing on time but underpaying — exception: if amount paid is deficient by more than 30%, 50% surcharge applies)
8. How to Voluntarily Pay Back Taxes (BIR Voluntary Assessment and Abatement Program; late payment with full penalty; compromise abatement application if penalty is disproportionate)
9. The Statute of Limitations (3 years from filing date or due date, whichever is later; 10 years if no return filed or fraud; after prescription: BIR cannot assess)

**Featured image spec**: Penalty breakdown graphic for ₱5,000 late tax: 4 stacked bars showing basic tax (₱5K), surcharge (₱1,250), interest (₱74), compromise (₱1,000), total ₱7,324. Red tone. 1200×630px.

**Internal links from this post**:
- → Post 4 (1701Q guide) at Section 8 (what happens if you miss deadline)
- → Post 19 (BIR filing calendar) at Section 8
- → Tool homepage (CTA to compute tax before penalty grows)

---

## 4. Pillar Pages and Comparison Pages

### Pillar Page 1: "Philippine Freelancer Tax: The Complete 2026 Guide"
- **URL**: /guide/freelancer-tax-philippines
- **Format**: Long-form SEO pillar (5,000–7,000 words)
- **This IS Post 6** from the blog cluster, promoted as a guide-format page
- **Inline tool**: Regime comparison tool embedded between Section 3 and 4
- **Table of contents**: Sticky sidebar TOC on desktop; collapsible on mobile
- **Schema**: `HowTo` + `FAQPage` schema.org markup

### Pillar Page 2: "8% vs Graduated vs OSD Tax Comparison Tool"
- **URL**: / (product homepage)
- **This IS the product** — the tool itself is the page
- **Supporting text below the fold**: Brief explanation of each regime, embedded comparison results, next steps
- **Schema**: `SoftwareApplication` schema per [seo-strategy.md](seo-strategy.md)

### Comparison Page 1: "8% Flat Rate vs Graduated Income Tax Philippines"
- **URL**: /compare/8-percent-vs-graduated
- **Format**: Comparison article + embedded tool (pre-loaded with comparison mode)
- **SEO title**: 8% Flat Rate vs Graduated Income Tax Philippines 2026: Full Comparison
- **Meta description**: Side-by-side comparison of 8% income tax option vs graduated rates for Philippine freelancers. Interactive calculator included. Which saves you more at your income?
- **Length**: 1,500 words + comparison tables
- **Schema**: `FAQPage` + embedded `SoftwareApplication`

### Comparison Page 2: "OSD vs Itemized Deductions Philippines"
- **URL**: /compare/osd-vs-itemized
- **SEO title**: OSD vs Itemized Deductions Philippines 2026: When 40% Beats Real Expenses
- **Meta description**: When should you use Optional Standard Deduction (40%) vs actual itemized deductions? Comparison with worked examples for ₱1M, ₱2M, ₱3M+ earners. Free calculator included.
- **Length**: 1,500 words + comparison tables

### Comparison Page 3: "Taxumo vs JuanTax vs TaxKlaro: Philippine Tax Software Comparison"
- **URL**: /compare/taxumo-vs-juantax-vs-taxklaro
- **SEO title**: Taxumo vs JuanTax vs TaxKlaro Philippines 2026: Which Tax Tool for Freelancers?
- **Meta description**: Detailed comparison of the top tax tools for Filipino freelancers: regime comparison capability, filing integration, pricing, and features. Which is best for you?
- **Length**: 2,000 words + feature matrix

---

## 5. Social Media Post Templates

### Facebook Post Templates (for sharing in freelancer groups)

**Template FB-001: Deadline Reminder (use 1 week before each BIR deadline)**
```
⚡ BIR REMINDER: [FORM NAME] is due on [DATE]!

📋 Who needs to file: [DESCRIPTION]
💰 What to pay: [BRIEF COMPUTATION DESCRIPTION]
📍 Where to file: eBIRForms / any authorized bank / online

Free tool to compute your exact tax due 👇
[LINK]

#FreelancerPhilippines #BIRPhilippines #TaxTips
```

**Template FB-002: Regime Comparison Hook (evergreen content)**
```
Did you know? Filipino freelancers earning ₱600,000/year have THREE choices for their income tax:

❌ Graduated (no deductions): ₱100,000 tax
⚠️ Graduated + 40% OSD: ₱59,000 tax
✅ 8% Flat Rate: ₱28,000 tax

Most freelancers are paying ₱72,000 MORE than they need to.

Find out which rate saves YOU the most → [LINK]

#FreelancerPH #Taxes #8PercentTax #BIR
```

**Template FB-003: Pain Point Hook (high engagement)**
```
Real talk: I paid a CPA ₱8,000 to file my ITR last year.

Then I found out there's a FREE calculator that computes all three tax regimes and shows which one saves you the most.

At ₱500K income, the difference between the worst and best regime is ₱52,000.

That's ₱52,000 you keep. Not pay in taxes.

[LINK]

#Freelancing #SelfEmployed #PhilippineTax
```

**Template FB-004: Educational Fact (weekly "Tax Tip")**
```
💡 TAX TIP OF THE WEEK:

If you're a self-employed freelancer earning below ₱3M, you can elect the 8% income tax option by simply checking a box on your Q1 BIR Form 1701Q.

This replaces your regular income tax AND your percentage tax obligation.

You have until May 15 to elect it for 2026.

Compute your exact savings at [LINK]

#TaxTipTuesday #FreelancerPH #BIRTax
```

**Template FB-005: Seasonal Campaign (February–March, pre-April ITR season)**
```
📅 April 15 is 6 weeks away — that's your Annual Income Tax Return deadline.

Before you pay your CPA to file, do yourself a favor:

1. Go to [LINK]
2. Enter your total income and expenses from 2025
3. See exactly which regime you should have been using

If you've been paying graduated rates without checking the 8% option, you may have overpaid by ₱30,000–₱80,000.

(That money is gone — but you can elect the better regime for 2026 before May 15)

#TaxSeason #ItrPhilippines #Freelancer
```

### Instagram / TikTok Content Briefs

**Video Script IG-001: "8% Option in 60 Seconds"**
```
Hook (0-3s): "Filipino freelancers — there's a tax option that most CPAs don't explain."
Problem (3-15s): "By default, you pay graduated income tax on your freelance income. At ₱600K, that's ₱100,000 in tax."
Solution (15-40s): "But if you earn below ₱3 million, you can elect the 8% flat rate. That same ₱600K? Only ₱28,000 in tax. That's a ₱72,000 difference."
Election (40-50s): "You elect it by checking a box on your Q1 Form 1701Q — due May 15."
CTA (50-60s): "See if 8% saves YOU money using TaxKlaro. Link in bio."
```

**Video Script IG-002: "Are You Overpaying Your Taxes?"**
```
Hook (0-3s): "I just saved ₱84,000 on my taxes. Here's how."
Story (3-30s): "For 3 years I was filing graduated income tax like my CPA told me to. Last year, I found out about the 8% option. I ran my numbers — I was overpaying ₱28,000 every year."
CTA (30-50s): "There's a free tool called TaxKlaro that computes all three regimes and shows you which one saves you the most. I wish I'd found it 3 years ago."
```

**Video Script IG-003: "Mixed Income Earner? Watch This"**
```
Hook (0-5s): "Have a day job AND a freelance side hustle? Your tax situation is different from a full-time freelancer."
Key Points (5-40s): "You still have to file Form 1701 — not 1701A. You can still elect the 8% option for your freelance income. But you lose the ₱250,000 exemption."
Example (40-50s): "At ₱480K salary + ₱300K freelance, 8% on your freelance income = ₱24,000. Not ₱0."
CTA (50-60s): "Compute your exact mixed income tax at TaxKlaro — free. Link in bio."
```

### YouTube Video Titles and Descriptions

**YT-001: "How to File BIR 1701Q on Your Own (Step by Step, 2026)"**
- Title: How to File BIR Form 1701Q for Freelancers | Step by Step 2026
- Description (first 150 chars): Learn to file BIR Form 1701Q as a freelancer: both the 8% option (Schedule II) and graduated OSD method (Schedule I). Free computation tool linked below.
- Tags: bir 1701q, quarterly income tax return, freelancer tax philippines, 8% income tax option

**YT-002: "8% Option: How to Elect It and Why It Saves You Money"**
- Title: The 8% Income Tax Option Philippines 2026: How to Elect It and Save Money
- Description: The 8% flat rate is the single most important tax rule for Filipino freelancers. Watch this to understand eligibility, how to elect it on your 1701Q, and exactly how much you save.
- Tags: 8% income tax, train law freelancer tax, philippine income tax option

**YT-003: "Mixed Income Earner Tax Guide Philippines"**
- Title: Mixed Income Earner Philippines: How to File Taxes with a Day Job + Freelance (2026)
- Description: Have employment income AND freelance income? Your taxes are more complex but manageable. This video covers Form 1701, regime options, and the ₱250K exemption rule.

---

## 6. Email Newsletter Templates

### Email NL-001: "Your TaxKlaro Computation Results" (Triggered post-computation)
- **Trigger**: User completes a tax computation on the tool
- **Subject line**: Your TaxKlaro results: you can save ₱[SAVINGS] using the [REGIME] method
- **Fallback subject (if savings < ₱1K)**: Your TaxKlaro tax computation results

**Body template**:
```
Hi [FIRST_NAME or "there"],

You just computed your Philippine income tax for [TAX_YEAR] Q[QUARTER or "Annual"].

Here's your summary:

Your recommended regime: [REGIME_NAME]
Tax due under this regime: ₱[TAX_DUE]
vs. the standard graduated method: ₱[GRADUATED_TAX]
Your potential savings: ₱[SAVINGS]

What to do next:
→ [If Q1] You have until May 15 to elect the 8% option on your 1701Q. Here's how: [LINK]
→ [If Q2/Q3] Your next 1701Q is due [NEXT_DEADLINE]. Use TaxKlaro to compute it.
→ [If Annual] Your annual ITR is due April 15. Save this computation as a reference.

Want to save this for your records?
[Button: Save My Results (Free)] → account registration page

—
TaxKlaro
taxklaro.ph | Unsubscribe
```

### Email NL-002: "Deadline Reminder" (Automated 7 days before each BIR deadline)
- **Trigger**: 7 calendar days before known BIR filing deadline; sent to users who completed a computation in the current tax year
- **Subject line**: 📋 [FORM_NAME] due in 7 days — here's your amount

**Body template**:
```
Hi [FIRST_NAME],

[FORM_NAME] is due on [DEADLINE_DATE] — that's 7 days from now.

Based on your last computation on [LAST_COMPUTATION_DATE]:

Gross receipts to date: ₱[CUMULATIVE_GROSS]
Estimated tax due this quarter: ₱[ESTIMATED_TAX]
Previous quarter payments: ₱[PRIOR_PAYMENTS]
Balance to pay by [DEADLINE_DATE]: ₱[BALANCE_DUE]

Need to update your numbers?
[Button: Recompute for [QUARTER/YEAR]] → tool homepage

How to file and pay:
→ eBIRForms (download at bir.gov.ph) or BIR's online portal
→ Pay at any authorized agent bank, GCash (via LandBank Link.BizPortal), or EFPS

Need help?
Reply to this email or visit taxklaro.ph/help

—
TaxKlaro
taxklaro.ph | Unsubscribe | Manage notifications
```

### Email NL-003: "Tax Season Push" (Sent February 1, March 1, April 1 every year)
- **Trigger**: Date-based; sent to all registered users with at least 1 computation
- **February 1 subject**: 📅 April 15 is 73 days away — have you optimized your 2025 taxes?
- **March 1 subject**: ⏰ 45 days until Annual ITR deadline — your 2025 TaxKlaro summary
- **April 1 subject**: 🚨 14 days until April 15 — file your 2025 Annual ITR

**Body template (February 1)**:
```
Hi [FIRST_NAME],

Tax season is here. Your Annual Income Tax Return (Form 1701 or 1701A) for Tax Year 2025 is due April 15, 2026.

Before you pay your CPA or scramble with eBIRForms, make sure you're using the right tax regime.

In 2025, did you earn below ₱3 million? If yes, the 8% option may have saved you money — and if you elected it on your Q1 2025 1701Q, you're already on track.

Not sure? Use TaxKlaro to run your 2025 numbers:

[Button: Compute My 2025 Annual Tax] → tool homepage (pre-fill: Annual mode, TY2025)

What you'll need:
→ Your total gross receipts for Jan–Dec 2025
→ Your total business expenses (if claiming itemized)
→ Your BIR 2307 certificates from clients

—
TaxKlaro
```

### Email NL-004: "Welcome Email" (Triggered on first account registration)
- **Trigger**: User creates an account (free tier)
- **Subject**: Welcome to TaxKlaro — here's how to save up to ₱84,000 on your taxes

**Body template**:
```
Welcome to TaxKlaro, [FIRST_NAME]!

TaxKlaro is the only Philippine tax tool that computes all three income tax regimes and shows you exactly which one is lowest for your income.

Here's what you can do right now:

1. Compute your tax for this quarter (takes 5 minutes)
   [Button: Start Computing] → tool homepage

2. Learn about the 8% option (most freelancers should be using this)
   [Button: Read the Guide] → Post 1

3. Set up deadline reminders (never miss a BIR date)
   [Button: Enable Reminders] → settings/notifications

Your next BIR deadline:
[NEXT_DEADLINE_NAME]: [NEXT_DEADLINE_DATE]

Questions? Reply to this email or visit taxklaro.ph/help.

—
The TaxKlaro Team
```

---

## 7. Internal Link Architecture

### Link Map: Which Pages Link to Which

Every content page links to the tool homepage (/) with an inline CTA. Below are the specific cross-links between content pages:

| Source Page | Links To | Context |
|-------------|----------|---------|
| Post 1 (8% option) | Post 2 (comparison), Post 4 (1701Q), Post 12 (mixed income) | Referenced in content sections |
| Post 2 (8% vs graduated) | Post 1, Post 9 (OSD), Post 10 (itemized), Post 11 (high income) | Regime descriptions |
| Post 3 (5 mistakes) | Post 1, Post 4, Post 12 | Corrections link to detail guides |
| Post 4 (1701Q guide) | Post 7 (2307), Post 5 (form selection), Post 20 (penalties) | Filing steps |
| Post 5 (1701 vs 1701A) | Post 4, Post 12, Post 6 | Form decision context |
| Post 6 (pillar) | All Posts 1–5, 7, 8, 12, 14, 15, 19, 20 | Comprehensive link hub |
| Post 7 (2307) | Post 4, Post 13 (Upwork) | CWT mechanics |
| Post 8 (2551Q) | Post 1, Post 4 | Regime and filing integration |
| Post 9 (OSD) | Post 1, Post 10, Post 11 | Regime comparison |
| Post 10 (itemized) | Post 2, Post 9, Post 11 | Regime comparison |
| Post 11 (high income strategy) | Post 10, Post 14 | VAT threshold link |
| Post 12 (mixed income) | Post 1, Post 5, Post 4 | Form and regime guidance |
| Post 13 (Upwork/Fiverr) | Post 7, Post 1, Post 6 | Platform-specific context |
| Post 14 (VAT threshold) | Post 9, Post 11 | Post-₱3M regime options |
| Post 15 (BIR registration) | Post 6, Post 4, Post 1 | Post-registration next steps |
| Post 16 (Taxumo review) | Post 17, Post 2 | Competitive context |
| Post 17 (software comparison) | Post 16, tool homepage | Competitive context |
| Post 18 (eBIRForms Mac) | Post 17 | Alternative tools |
| Post 19 (filing calendar) | Post 4, Post 8 | Deadline context |
| Post 20 (BIR penalties) | Post 4, Post 19 | Deadline and penalty link |
| Comparison Page 1 | Post 1, Post 2 | Regime deep-dives |
| Comparison Page 2 | Post 9, Post 10 | Deduction comparison |
| Comparison Page 3 | Post 16, Post 17 | Tool comparison |

### Hub and Spoke Structure
- **Primary hub**: Post 6 (pillar) → all cluster posts
- **Secondary hub**: Tool homepage (/) → all guide pages via "Learn more" links
- **Regime cluster**: Posts 1, 2, 9, 10, 11 → all link to each other
- **Filing mechanics cluster**: Posts 4, 5, 7, 8 → link to each other
- **Special cases cluster**: Posts 12, 13, 14, 15 → link to regime cluster

---

## 8. Featured Image Specifications (All Posts)

All featured images must:
- Dimensions: 1200×630px (Open Graph standard)
- Format: PNG or JPEG, max 200KB
- Include TaxKlaro logo (bottom-right, white version on dark backgrounds, dark on light)
- Use brand colors: primary #1D4ED8 (blue), accent #10B981 (green for "savings"), danger #EF4444 (red for "overpaying")
- Font: Inter or Geist (matching web typography)
- No stock photography of people — use data visualizations, form mockups, or infographic-style graphics
- Alt text format: "[Post Title] — TaxKlaro"

Blog thumbnails (sidebar/grid):
- 400×267px, same visual language, reduced text

---

## 9. Content Performance Metrics and Targets

### Primary KPIs
- Organic search impressions (Google Search Console: monthly total)
- Organic click-through rate (target: ≥3% average across all content pages)
- Tool usage rate from blog content (Blog session → tool open: target 10%)
- Email signup conversion rate from content pages (target: 3% of sessions)
- Free-to-pro conversion rate (email subscriber → paid: target 2%)

### Monthly Organic Traffic Targets (Year 1)
| Month | Unique Organic Visitors | Cumulative Posts Published |
|-------|------------------------|---------------------------|
| 1 | 2,000 | 4 |
| 2 | 5,000 | 8 |
| 3 | 10,000 | 12 |
| 4 | 18,000 | 16 |
| 5 | 28,000 | 20 |
| 6 | 40,000 | 22 (updates to existing) |
| 7 | 50,000 | 22 |
| 8–12 | 50,000–70,000 | 22 + 2 new/month |

### Revenue Targets From Content Marketing (Year 1)
- Email signups from organic: 5,000 (10% of 50K visitors × 1% signup rate on average)
- Paid conversions from email: 100 (2% of email list)
- Revenue at ₱499/month pro plan: ₱49,900/month by Month 12
- Note: Actual revenue will also come from direct tool conversions (not just email path)

---

## 10. Seasonal Campaign Calendar

| Month | Key Event | Content/Campaign |
|-------|-----------|------------------|
| January | Q4 percentage tax deadline Jan 25; New year / new tax year | "Start 2026 Right: Register with BIR" campaign; post Post 15 (BIR registration) |
| February | 73 days until April 15 ITR; pre-tax-season | "Don't Overpay This April" campaign; Email NL-003 (Feb 1 version); regime comparison push |
| March | 45 days until April 15 ITR | "Are You Filing the Right Regime?" campaign; Email NL-003 (Mar 1 version); publish Post 20 (penalties) |
| April | Annual ITR deadline April 15; Q1 2026 regime election deadline; Q1 2551Q deadline April 25 | "Last chance to elect 8% option for 2026" on Q1 1701Q (May 15 is 1701Q deadline, not the election — election is signified ON the Q1 1701Q filed by May 15); Email NL-003 (Apr 1 version); "File Your 2025 Annual ITR" push |
| May | Q1 1701Q deadline May 15 | Q1 filing reminder campaign; Email NL-002 (7 days before May 15); publish Post 4 (1701Q guide) |
| June | Mid-year check-in | "How are your 2026 taxes tracking?" email to active users |
| July | Q2 1701Q deadline August 15; Q2 2551Q deadline July 25 | July 25 2551Q reminder email; August filing season content |
| August | Q2 1701Q deadline Aug 15 | Email NL-002 (7 days before Aug 15); post 1701Q updates if any rule changes |
| September | Mid-year review | "Are you on track for 2026?" push; regime check for users approaching ₱3M |
| October | Q3 2551Q deadline October 25 | October deadline reminder campaign |
| November | Q3 1701Q deadline November 15 | Email NL-002 (7 days before Nov 15); "Last quarterly filing before annual" campaign |
| December | Year-end planning | "Is your expense tracking ready for April?"; "Consider switching regimes for 2027?" — pre-Q1 planning content |

---

## 11. Content Promotion Strategy

### Backlink Targets
1. **Philippine Institute for Development Studies (PIDS)** — target: research-based data articles on freelancer economy (PIDS published a 2019 study on gig workers; pitch follow-up analysis)
2. **PICPA (Philippine Institute of CPAs)** — target: professional guides for members; pitch guest article "How Online Tools Are Changing Freelancer Tax Preparation"
3. **Freelancing Facebook groups** — Freelancing PH (100K+ members), SPARK Philippines, Filipino Freelancers & VAs: value-first posts + link to tool; no direct affiliate spam
4. **OnlineJobs.ph blog** — one of largest Filipino freelancer platforms; guest post on "How to Handle Your BIR Taxes as an OnlineJobs.ph Freelancer"
5. **BusinessWorld Philippines** — pitch data-driven article: "The ₱100 Billion Freelancer Tax Gap: How Many Filipinos Are Overpaying Their Income Tax?"
6. **Rappler Money** — pitch angle: "The 8% Option Explained: The TRAIN Law Provision That Lets Freelancers Pay a Flat Tax"
7. **CPA bloggers** — 10+ active CPA/accountant bloggers in PH who write about taxes; outreach for co-marketing or tool reviews

### CPA Partner Program Details
- **Offer**: Free Professional tier (valued at ₱499/month or ₱4,788/year) for 12 months in exchange for:
  1. Referring at least 3 freelancer clients to use TaxKlaro
  2. Allowing TaxKlaro to display "Recommended by [CPA name/firm]" on partner page
- **Referral code**: CPA-[INITIALS]-[DIGITS] format; tracked via UTM parameter
- **Commission**: ₱150 per referred user who upgrades to Pro (30% of first month)
- **Target**: 100 CPA partners in Year 1
- **Partner benefits page URL**: /partners/cpa

### Guest Posting Program
- Accept guest posts from CPAs and financial advisors
- Topic must be original, Philippine-specific, tax-relevant
- Author bio with link to CPA website allowed
- TaxKlaro retains right to add inline CTAs to tool
- Review process: 2 weeks; editorial quality bar maintained

---

## 12. Pillar Post Editorial Checklist

Every blog post published on TaxKlaro must pass this checklist before going live:

- [ ] All peso amounts verified against [../domain/computation-rules.md](../domain/computation-rules.md)
- [ ] All filing deadlines verified against [../domain/lookup-tables/filing-deadlines.md](../domain/lookup-tables/filing-deadlines.md)
- [ ] All legal citations appear in [../domain/legal-basis.md](../domain/legal-basis.md)
- [ ] SEO title ≤ 60 characters
- [ ] Meta description ≤ 160 characters
- [ ] H1 contains primary target keyword
- [ ] Featured image created at 1200×630px with TaxKlaro logo
- [ ] At least 3 internal links per post
- [ ] At least 1 inline CTA linking to tool homepage
- [ ] Worked example with real peso amounts in post body
- [ ] Post reviewed for accuracy against latest BIR issuances (check monthly)
- [ ] Schema.org markup added (FAQPage for posts with Q&A sections; HowTo for instructional posts)

### Blog Post Schema.org Templates

**FAQPage JSON-LD (add to all posts with a Q&A section)**:
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "[QUESTION_TEXT]",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "[ANSWER_TEXT — plain text, no HTML]"
      }
    }
  ]
}
```

**HowTo JSON-LD (add to all step-by-step instructional posts)**:
```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "[POST_TITLE]",
  "description": "[META_DESCRIPTION]",
  "step": [
    {
      "@type": "HowToStep",
      "name": "[STEP_NAME]",
      "text": "[STEP_DESCRIPTION]"
    }
  ]
}
```

**BlogPosting JSON-LD (add to all blog posts)**:
```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "[SEO_TITLE]",
  "description": "[META_DESCRIPTION]",
  "datePublished": "[YYYY-MM-DD]",
  "dateModified": "[YYYY-MM-DD]",
  "author": {
    "@type": "Organization",
    "name": "TaxKlaro",
    "url": "https://taxklaro.ph"
  },
  "publisher": {
    "@type": "Organization",
    "name": "TaxKlaro",
    "logo": {
      "@type": "ImageObject",
      "url": "https://taxklaro.ph/logo.png"
    }
  },
  "image": "https://taxklaro.ph/blog/[SLUG]/og-image.png"
}
```

---

## 13. Content Update Policy

All TaxKlaro content must be reviewed and updated annually (every January) or within 30 days of:
- Any new BIR Revenue Regulation (RR) affecting self-employed income tax computation
- Any change in TRAIN rate tables (next scheduled review: 2027 if no legislative change)
- Any BIR Revenue Memorandum Circular (RMC) changing filing procedures
- Any new law amending CREATE or EOPT provisions

Posts that become outdated must be updated (not deleted) with a dated "Last Updated" notice at the top. The original publish date must remain in the schema markup.

---

## Cross-References
- See [seo-strategy.md](seo-strategy.md) for keyword targets and on-page SEO specifications for tool pages
- See [landing-page.md](landing-page.md) for hero copy and CTA specifications for the homepage
- See [../domain/scenarios.md](../domain/scenarios.md) for real scenario examples to use in blog post computations
- See [../domain/computation-rules.md](../domain/computation-rules.md) for exact formula verification in blog posts
- See [../domain/lookup-tables/filing-deadlines.md](../domain/lookup-tables/filing-deadlines.md) for deadline verification
- See [../ui/branding.md](../ui/branding.md) for brand colors, typography, and logo used in featured images
- See [../premium/tiers.md](../premium/tiers.md) for feature gating when content references premium features
