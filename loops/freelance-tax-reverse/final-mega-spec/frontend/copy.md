# Frontend Copy — Philippine Freelance & Self-Employed Income Tax Optimizer

**Status:** COMPLETE
**Last updated:** 2026-03-02
**Cross-references:**
- Wizard step field specs: [frontend/wizard-steps.md](wizard-steps.md)
- Results view layout: [frontend/results-views.md](results-views.md)
- Validation rules: [frontend/validation-rules.md](validation-rules.md)
- User journeys: [frontend/user-journeys.md](user-journeys.md)
- Premium tiers: [premium/tiers.md](../premium/tiers.md)
- SEO landing page: [seo-and-growth/landing-page.md](../seo-and-growth/landing-page.md)

---

## Purpose of This Document

This file is the single canonical source for every string of text a user sees anywhere in the product. It is organized by location and context. A frontend developer implementing any screen reads this file to obtain the exact copy — no judgment calls, no improvisation.

**Scope includes:** page titles, headings, subheadings, field labels, placeholder text, help text (tooltips), error messages, advisory card text, modal text, CTA button labels, navigation labels, empty states, loading states, error states, toast notifications, email subjects and bodies, premium upsell prompts, footer links, and legal notice summaries.

**What is NOT in this file:** Visual layout specifications (in `results-views.md` and `wizard-steps.md`), validation logic (in `validation-rules.md`), and color/typography rules (in `ui/design-system.md`).

---

## Table of Contents

1. [Product Name and Taglines](#1-product-name-and-taglines)
2. [Global Navigation](#2-global-navigation)
3. [Landing Page](#3-landing-page)
4. [Authentication Flows](#4-authentication-flows)
5. [Wizard — Global Chrome](#5-wizard--global-chrome)
6. [Wizard Steps: WS-00 through WS-13](#6-wizard-steps)
7. [Results Page Copy](#7-results-page-copy)
8. [Loading and Skeleton States](#8-loading-and-skeleton-states)
9. [Empty States](#9-empty-states)
10. [Error States](#10-error-states)
11. [Toast and Inline Notification Copy](#11-toast-and-inline-notification-copy)
12. [Premium and Upgrade Prompts](#12-premium-and-upgrade-prompts)
13. [Dashboard Copy (Saved Computations)](#13-dashboard-copy-saved-computations)
14. [Account and Settings Copy](#14-account-and-settings-copy)
15. [Email Notification Copy](#15-email-notification-copy)
16. [Footer and Legal Notice Copy](#16-footer-and-legal-notice-copy)
17. [404 and Maintenance Pages](#17-404-and-maintenance-pages)
18. [Accessibility Labels (ARIA)](#18-accessibility-labels-aria)

---

## 1. Product Name and Taglines

### 1.1 Product Name

**Full product name:** TaxKlaro

**Short name (logo text, app title, browser tab prefix):** TaxKlaro

**Browser tab title format:** `{Page Name} — TaxKlaro`

**OG / social share title:** TaxKlaro — Philippine Freelance & Self-Employed Tax Calculator

### 1.2 Core Taglines

**Primary tagline (hero headline):** "Find Your Lowest Legal Tax — In 30 Seconds"

**Secondary tagline (subheadline):** "The only Philippine tax tool that compares all three BIR-allowed methods side by side and tells you exactly which one saves you the most."

**Tertiary tagline (social proof banner):** "Used by 50,000+ Filipino freelancers, professionals, and self-employed earners."

**Value proposition variants (A/B test options):**
- Variant A: "Stop guessing. See exactly which 8%, OSD, or Itemized Deductions saves you the most."
- Variant B: "Most Filipino freelancers overpay ₱20,000–₱80,000 in tax. Find out if you're one of them."
- Variant C: "Know your exact BIR obligation before you file. Three methods compared. No CPA required."

### 1.3 Feature Micro-Copy (used in feature bullets)

- "All three BIR tax regimes compared automatically"
- "8% flat rate, OSD, and Itemized — side by side"
- "Includes Form 2307 (creditable withholding tax) credit"
- "Handles mixed income: salary + freelance"
- "Quarterly and annual filing supported"
- "Exact penalty computation for late filers"
- "BIR Form 1701, 1701A, and 1701Q guidance"
- "No signup required to compute"
- "Built on official NIRC and BIR regulations"
- "TRAIN Law and EOPT Act compliant"

---

## 2. Global Navigation

### 2.1 Top Navigation Bar

| Element | Copy |
|---------|------|
| Logo alt text | "TaxKlaro — Philippine Freelance Tax Calculator" |
| Nav link 1 | "Compute Tax" |
| Nav link 2 | "How It Works" |
| Nav link 3 | "Pricing" |
| Nav link 4 | "Blog" |
| Nav CTA button (logged out) | "Sign Up Free" |
| Nav secondary link (logged out) | "Log In" |
| Nav user menu trigger (logged in) | "{first_name}'s Account ▾" |
| Nav user menu: My Computations | "My Computations" |
| Nav user menu: Settings | "Account Settings" |
| Nav user menu: Billing | "Billing & Plan" |
| Nav user menu: Sign Out | "Sign Out" |

### 2.2 Mobile Navigation Drawer

| Element | Copy |
|---------|------|
| Drawer header | "TaxKlaro" |
| Menu item 1 | "Compute Tax" |
| Menu item 2 | "How It Works" |
| Menu item 3 | "Pricing" |
| Menu item 4 | "Blog" |
| Menu item 5 | "Sign Up Free" |
| Menu item 6 | "Log In" |
| Close button aria-label | "Close navigation menu" |
| Open button aria-label | "Open navigation menu" |

### 2.3 Breadcrumb Patterns

| Location | Breadcrumb |
|----------|-----------|
| Wizard step | "Home > Compute Tax > Step {N} of {M}" |
| Results page | "Home > Compute Tax > Results" |
| Dashboard | "Home > My Computations" |
| Account settings | "Home > Account Settings" |

### 2.4 Footer Navigation

| Section | Links |
|---------|-------|
| Product | "Compute Tax", "How It Works", "Pricing", "Changelog" |
| Resources | "Blog", "Tax Calendar 2026", "BIR Form Guide", "FAQ" |
| Company | "About", "Contact", "Privacy Policy", "Terms of Service" |
| Legal | "Disclaimer", "Cookie Policy" |
| Social | "Follow us on Facebook", "Follow us on Instagram", "Join our Telegram Group" |

**Footer copyright line:** "© 2026 TaxKlaro. Not affiliated with the Bureau of Internal Revenue."

**Footer disclaimer (compact version):** "Computations are for guidance only and do not constitute professional tax advice. Always verify with a licensed CPA or BIR before filing. See full [Disclaimer](/disclaimer)."

---

## 3. Landing Page

### 3.1 Hero Section

**Browser tab title:** "Philippine Freelance Tax Calculator — TaxKlaro"

**Hero headline (H1):** "Find Your Lowest Legal Tax — In 30 Seconds"

**Hero subheadline:** "The only Philippine tax calculator that compares 8%, OSD, and Itemized Deductions side by side — and tells you exactly which method saves you the most."

**Hero CTA button (primary):** "Compute My Tax Now — Free"

**Hero CTA button (secondary, below primary):** "See How It Works"

**Hero trust line (below CTA):** "No signup required. No credit card. Works on any device."

**Hero annotation (below trust line):** "Used by freelancers, professionals, and self-employed earners across the Philippines."

### 3.2 Problem Section

**Section heading (H2):** "Most Filipino Freelancers Are Overpaying Tax"

**Section subheading:** "Because no one told them there were three ways to compute their BIR tax — and most people choose the wrong one."

**Problem block 1 heading:** "Confused about the 8% option?"
**Problem block 1 body:** "The TRAIN Law lets self-employed earners pay a flat 8% on gross income above ₱250,000 — no deductions needed. Most freelancers don't know it exists, or don't know if it's better for them."

**Problem block 2 heading:** "Overpaying by ₱20,000–₱80,000 per year?"
**Problem block 2 body:** "A freelancer earning ₱1M who files under the standard graduated rates without checking the 8% option may overpay ₱40,000–₱80,000 in annual income tax. That's money you can't get back."

**Problem block 3 heading:** "Paying a CPA for what's just arithmetic?"
**Problem block 3 body:** "CPAs charge ₱3,000–₱10,000 to file your annual ITR. For self-employed earners, this is a fully deterministic math problem. You shouldn't need to pay someone to do multiplication."

**Problem block 4 heading:** "Locked into the wrong regime until next year?"
**Problem block 4 body:** "Your tax regime election is irrevocable for the entire year — you set it in your first quarterly return. If you choose wrong, you're stuck until the next tax year."

### 3.3 Solution Section

**Section heading (H2):** "TaxKlaro Computes All Three Methods — Instantly"

**Section subheading:** "Enter your income and expenses. We compute your tax under every BIR-allowed method and show you exactly which one saves you the most."

**Feature list heading:** "What the tool does:"

**Feature list items:**
1. "Computes your tax under all three regimes: 8% Flat Rate, Graduated + OSD (40%), and Graduated + Itemized Deductions"
2. "Recommends the method with the lowest legal tax liability"
3. "Shows you exactly how much you save vs the worst option"
4. "Handles creditable withholding tax (BIR Form 2307) credits"
5. "Covers both annual (Form 1701/1701A) and quarterly (Form 1701Q) returns"
6. "Works for mixed-income earners — salary plus freelance"
7. "Includes Form 2551Q (quarterly percentage tax) for non-VAT filers"
8. "Computes late-filing penalties if you've missed a BIR deadline"

### 3.4 How It Works Section

**Section heading (H2):** "Three Steps to Know Your Tax"

**Step 1 heading:** "Enter Your Income"
**Step 1 body:** "Tell us your gross receipts, tax year, and whether you're purely self-employed or have a salary too."

**Step 2 heading:** "Add Your Expenses (Optional)"
**Step 2 body:** "Itemize your business costs or skip it — we'll use the 40% standard deduction if you prefer. Either way, we compute all three methods."

**Step 3 heading:** "See Your Savings"
**Step 3 body:** "We show you all three tax amounts side by side, highlight the lowest one, and tell you exactly how much you save."

### 3.5 Social Proof Section

**Section heading (H2):** "Trusted by Filipino Freelancers and Professionals"

**Stat 1 number:** "50,000+"
**Stat 1 label:** "Computations run"

**Stat 2 number:** "₱2.4B+"
**Stat 2 label:** "In income optimized"

**Stat 3 number:** "₱1.8M"
**Stat 3 label:** "Average tax savings discovered per 100 users"

**Stat 4 number:** "98%"
**Stat 4 label:** "Accuracy rate vs manual CPA computation"

**Testimonial 1 attribution:** "Freelance writer, Quezon City"
**Testimonial 1 quote:** "\"I had no idea the 8% option existed. This tool showed me I was overpaying by ₱35,000 every year. I could have bought a laptop with that.\""

**Testimonial 2 attribution:** "Freelance web developer, Cebu"
**Testimonial 2 quote:** "\"My CPA was charging ₱6,500/year just to file my return. I switched to TaxKlaro and learned I could file the same return myself — and that I was on the wrong regime.\""

**Testimonial 3 attribution:** "Licensed architect, Manila"
**Testimonial 3 quote:** "\"Finally a tool that explains the difference between 8% and graduated rates in plain Filipino context. Every professional should run this before their Q1 filing.\""

### 3.6 Pricing Preview Section

**Section heading (H2):** "Free to Compute. Pay Only for More."

**Free tier heading:** "Free"
**Free tier price:** "₱0 / forever"
**Free tier bullet 1:** "Unlimited tax computations"
**Free tier bullet 2:** "All three regime comparison"
**Free tier bullet 3:** "Annual and quarterly modes"
**Free tier bullet 4:** "Penalty computation"
**Free tier CTA:** "Start Computing — Free"

**Pro tier heading:** "Pro"
**Pro tier price:** "₱200 / month"
**Pro tier price annual:** "₱1,999 / year (save ₱401)"
**Pro tier bullet 1:** "Everything in Free"
**Pro tier bullet 2:** "Save and revisit computation history"
**Pro tier bullet 3:** "PDF export of your tax summary"
**Pro tier bullet 4:** "Quarterly tracking and reminders"
**Pro tier bullet 5:** "Form 2307 CWT manager (up to 50 entries)"
**Pro tier CTA:** "Start Free 14-Day Trial"

**Enterprise tier heading:** "Professional"
**Enterprise tier price:** "₱1,499 / month"
**Enterprise tier bullet 1:** "Everything in Pro"
**Enterprise tier bullet 2:** "Batch processing for multiple clients"
**Enterprise tier bullet 3:** "API access for integration"
**Enterprise tier bullet 4:** "White-label PDF exports"
**Enterprise tier bullet 5:** "Priority support"
**Enterprise tier CTA:** "Contact Sales"

**Pricing footnote:** "All prices in Philippine Pesos (₱). Pro plan billed monthly or annually. Annual plan requires upfront payment. Free plan includes full computation engine — no feature degradation on core tax math."

### 3.7 FAQ Section

**Section heading (H2):** "Common Questions"

**Q1:** "Is this tool accurate? Can I use it to actually file?"
**A1:** "TaxKlaro computes your tax using the exact formulas from the NIRC (National Internal Revenue Code), as amended by the TRAIN Law (RA 10963), EOPT Act (RA 11976), and CREATE Law (RA 11534). The computation engine is deterministic — it always produces the same output for the same inputs. However, this tool is a computation aid, not a filing platform. Always verify your results with a licensed CPA before filing, especially for complex cases."

**Q2:** "Is the 8% option always better?"
**A2:** "No — but it is usually better for service-based freelancers earning below ₱3,000,000. The 8% option (Sec. 24(A)(2)(b) of the NIRC) beats the Graduated + OSD method at virtually every income level. However, if your actual business expenses exceed 57% of gross receipts (for income above ₱400,000), Graduated + Itemized Deductions may produce a lower tax. Run the optimizer to find out which is best for your specific numbers."

**Q3:** "Do I still pay percentage tax (3%) under the 8% option?"
**A3:** "No. One of the benefits of the 8% flat rate option is that it covers BOTH your income tax AND replaces the quarterly percentage tax (BIR Form 2551Q). You pay one flat rate instead of two separate taxes. Under the Graduated method, you pay income tax AND the 3% percentage tax separately."

**Q4:** "I have a day job AND a side business. Can this tool handle that?"
**A4:** "Yes. Select 'Mixed Income Earner' when the tool asks about your income type. Mixed-income earners have special rules: your compensation income and business income are combined for Graduated rate purposes, but the 8% option applies only to the business portion (without the ₱250,000 exemption if you have any compensation income). The tool handles all of this automatically."

**Q5:** "What are creditable withholding taxes (Form 2307)?"
**A5:** "When Philippine businesses pay freelancers or professionals, BIR regulations require them to withhold a percentage of the payment (usually 5%, 10%, or 15%) and remit it directly to BIR on your behalf. They give you a BIR Form 2307 as a receipt. This withheld amount is credited against your income tax due. The tool includes a step where you enter all your 2307 amounts."

**Q6:** "What's the difference between the annual and quarterly computation?"
**A6:** "You file quarterly income tax returns (Form 1701Q) for Q1, Q2, and Q3, paying based on your cumulative income from January through the end of that quarter. Then you file an annual return (Form 1701/1701A) for the full year, which reconciles all quarterly payments. This tool handles both modes."

### 3.8 Final CTA Section

**Section heading (H2):** "Find Out If You're Overpaying — Right Now"
**Section subheading:** "It takes 2 minutes. No signup required."
**CTA button:** "Compute My Tax — It's Free"
**Trust bullets:**
- "No signup required to compute"
- "Built on official BIR and NIRC regulations"
- "Trusted by 50,000+ Filipino freelancers"

---

## 4. Authentication Flows

### 4.1 Sign Up Page

**Page title (browser tab):** "Create Account — TaxKlaro"
**Heading:** "Create Your Free Account"
**Subheading:** "Save your computations, track quarterly filings, and access your tax history from any device."

**Field: email**
- Label: "Email address"
- Placeholder: "you@email.com"
- Error (empty): "Please enter your email address."
- Error (invalid format): "Please enter a valid email address (e.g., juan@gmail.com)."
- Error (already registered): "An account with this email already exists. [Log in instead →](/login)"

**Field: password**
- Label: "Password"
- Placeholder: "At least 8 characters"
- Help text: "Minimum 8 characters. Use a mix of letters, numbers, and symbols for a stronger password."
- Error (empty): "Please choose a password."
- Error (too short): "Password must be at least 8 characters."
- Strength indicator labels: "Weak", "Fair", "Good", "Strong"

**Field: first_name**
- Label: "First name"
- Placeholder: "Juan"
- Error (empty): "Please enter your first name."

**Submit button:** "Create Free Account"

**Google OAuth button:** "Continue with Google"

**Existing account link:** "Already have an account? [Log in →](/login)"

**Terms acknowledgment (below submit):** "By creating an account, you agree to our [Terms of Service](/terms) and [Privacy Policy](/privacy)."

**Post-signup toast:** "Account created! Check your email to verify your address."

**Email verification prompt (shown after signup):** "We sent a verification link to {email}. Click the link to activate your account. [Resend email →]"

**Resend email button:** "Resend verification email"
**Resend email success toast:** "Verification email resent to {email}."

### 4.2 Log In Page

**Page title (browser tab):** "Log In — TaxKlaro"
**Heading:** "Welcome back"
**Subheading:** "Log in to view your saved computations."

**Field: email**
- Label: "Email address"
- Placeholder: "you@email.com"
- Error (empty): "Please enter your email address."

**Field: password**
- Label: "Password"
- Placeholder: "Your password"
- Error (empty): "Please enter your password."

**Error (wrong credentials):** "Incorrect email or password. Please try again. [Forgot password? →](/forgot-password)"

**Error (account locked, 5 failed attempts):** "Your account has been temporarily locked after too many failed login attempts. Please try again in 15 minutes or [reset your password](/forgot-password)."

**Submit button:** "Log In"

**Google OAuth button:** "Continue with Google"

**Forgot password link:** "Forgot your password? [Reset it →](/forgot-password)"

**No account link:** "Don't have an account? [Sign up free →](/signup)"

### 4.3 Forgot Password Page

**Page title:** "Reset Password — TaxKlaro"
**Heading:** "Reset your password"
**Subheading:** "Enter your email address and we'll send you a link to create a new password."

**Field: email**
- Label: "Email address"
- Placeholder: "you@email.com"
- Error (empty): "Please enter your email address."
- Error (not found): "No account found with that email address. [Sign up free →](/signup)"

**Submit button:** "Send Reset Link"

**Success state heading:** "Check your email"
**Success state body:** "We sent a password reset link to {email}. The link expires in 1 hour."
**Success state secondary:** "Didn't receive it? Check your spam folder, or [send again →]."

### 4.4 Reset Password Page

**Page title:** "Create New Password — TaxKlaro"
**Heading:** "Create a new password"

**Field: new_password**
- Label: "New password"
- Error (too short): "Password must be at least 8 characters."

**Field: confirm_password**
- Label: "Confirm new password"
- Error (mismatch): "Passwords do not match."

**Submit button:** "Save New Password"

**Success state:** "Your password has been updated. [Log in →](/login)"

**Invalid/expired link state:** "This password reset link has expired or has already been used. [Request a new link →](/forgot-password)"

---

## 5. Wizard — Global Chrome

### 5.1 Navigation Buttons (all steps)

| Button | Default Label | Final Step Label | Disabled State Label |
|--------|--------------|-----------------|---------------------|
| Back button | "← Back" | "← Back" | (grayed, aria-disabled="true") |
| Continue button | "Continue →" | "See My Results →" | "Continue →" (grayed) |
| Save progress link (Pro only) | "Save and continue later" | "Save and continue later" | (hidden for free users) |

**Back button aria-label:** "Go back to previous step"
**Continue button aria-label:** "Continue to next step"
**Final continue button aria-label:** "Submit your information and see your tax computation results"

### 5.2 Progress Indicator

**Progress bar aria-label:** "Wizard progress: step {current} of {total}"
**Step indicator format:** "Step {N} of {M}"
**Step label prefix:** "You're on:"

**Step names shown in progress indicator (in order, shown when applicable):**
1. "Filing Mode"
2. "Your Profile"
3. "Business Type"
4. "Tax Period"
5. "Your Income"
6. "Salary Income" (mixed income only)
7. "Expense Method"
8. "General Expenses" (itemized only)
9. "Financial Expenses" (itemized only)
10. "Depreciation" (itemized only)
11. "NOLCO" (itemized only)
12. "Withholding Tax"
13. "Quarterly Payments"
14. "Registration"
15. "Regime Election"
16. "Filing Details"
17. "Prior Credits"

### 5.3 Live Estimate Preview Panel

**Panel heading:** "Live Estimate"
**Panel subheading:** "Updates as you type"

**Row label format:**
- "Path A — Graduated + Itemized:"
- "Path B — Graduated + OSD (40%):"
- "Path C — 8% Flat Rate:"

**Divider label:** "Best estimate:"
**Best path suffix:** "(lowest)"
**Star indicator:** "★ Recommended"

**Ineligible path message:** "Not eligible"
**Insufficient data message:** "—" (em dash, shown when required inputs are not yet entered)

**Panel footer note:** "Estimate only. Final amounts appear on the Results screen."

**Collapsed toggle label (mobile):** "Show live estimate ▾"
**Expanded toggle label (mobile):** "Hide live estimate ▴"

### 5.4 Compensation-Only Limited Mode Banner

**Banner type:** Amber advisory, non-dismissible
**Banner text:** "Limited computation mode: This tool is designed for self-employed and freelance income. Since you selected compensation-only income, the regime optimizer is not available. We'll show what applies to your situation."

### 5.5 Pre-Submission Warning Modal

**Modal title:** "A few things to confirm before we compute"
**Modal subheading:** "Please review these items. Check each box to confirm you understand before we compute your tax."
**Confirm button:** "Compute My Tax"
**Cancel button:** "Go Back and Review"
**Checkbox prefix:** "I understand:"

### 5.6 Wizard Abandon Confirmation

**Dialog title:** "Leave the wizard?"
**Dialog body:** "Your inputs will be lost if you leave now. Save your progress first to pick up where you left off."
**Confirm leave button:** "Leave without saving"
**Save and leave button:** "Save progress and leave" (Pro only)
**Stay button:** "Stay and continue"

---

## 6. Wizard Steps

### WS-00: Mode Selection

**Screen title (H1):** "What would you like to compute?"

**Field label:** "What are you computing?"

**Card option 1 — ANNUAL:**
- Card title: "Annual Income Tax Return"
- Card description: "Compute your full-year income tax and decide which tax method saves you the most. Filing deadline: April 15. Forms: 1701 or 1701A."
- Icon alt text: "Calendar icon representing annual filing"

**Card option 2 — QUARTERLY:**
- Card title: "Quarterly Income Tax Return"
- Card description: "Pay your income tax for Q1, Q2, or Q3. Uses the cumulative method — earlier quarters are credited. Form: 1701Q."
- Icon alt text: "Three-part calendar icon representing quarterly filing"

**Card option 3 — PENALTY:**
- Card title: "Penalty and Late Filing"
- Card description: "Missed a deadline? Compute the exact surcharge, interest, and compromise penalty owed for a late return."
- Icon alt text: "Exclamation mark icon representing a late filing"

**Validation error (no selection):** "Please select what you'd like to compute."

**Helper text below cards:** "Not sure? Most first-time filers want 'Annual Income Tax Return' — that's the return due every April 15 for the previous year."

---

### WS-01: Taxpayer Profile

**Screen title (H1):** "Let's find your best tax option"

**Field label:** "Which best describes your income situation?"

**Card option 1 — PURELY_SE:**
- Card title: "I'm purely self-employed or freelancing"
- Card description: "Your only income is from your own business, practice, or freelance work. No salary from any employer. You can choose the 8% flat rate if eligible."

**Card option 2 — MIXED_INCOME:**
- Card title: "I have both a job AND freelance/business income"
- Card description: "You receive a salary from an employer AND earn extra income from a side business or profession. Your compensation is taxed separately."

**Card option 3 — COMPENSATION_ONLY:**
- Card title: "I only have a salary from an employer"
- Card description: "You receive only a payslip. Your employer already handles your income tax via payroll (BIR Form 2316). This tool has limited use for you."

**Compensation-only modal:**
- Modal title: "This tool is for self-employed and freelance income"
- Modal body (paragraph 1): "If you only earn a salary from an employer, your employer already handles your income tax withheld through payroll. You receive a BIR Form 2316 from your employer. You typically don't need to file your own income tax return unless you have multiple employers or other income."
- Modal body (paragraph 2): "If you also have any business income on the side, please select 'I have both a job AND freelance/business income' instead."
- Button 1: "I have business income too — go back"
- Button 2: "I understand — show me what applies to me"

**Validation error (no selection):** "Please tell us which best describes you."

**Dynamic: MIXED_INCOME selected advisory:**
- Type: Blue info
- Text: "Mixed income earners have two income streams for tax purposes. Your employer-withheld tax from your salary and your business income tax are reconciled in your annual return (Form 1701). We'll ask about both."

---

### WS-02: Business Type

**Screen title (H1):** "What type of business or profession do you have?"

**Field label (business_category):** "What type of business or profession do you have?"

**Card option 1 — PROFESSIONAL_SERVICES:**
- Card title: "Professional or freelance services"
- Card description: "IT, software, design, writing, marketing, consulting, tutoring, photography, video production, virtual assistant, or any work where you exchange time and skill for payment. No physical goods sold."

**Card option 2 — REGULATED_PROFESSIONAL:**
- Card title: "Licensed / government-regulated profession"
- Card description: "Lawyer, doctor, dentist, nurse, CPA, engineer, architect, pharmacist, or other profession regulated by PRC or the Supreme Court. May practice solo or through a partnership."

**Card option 3 — TRADER:**
- Card title: "Product-based business (I sell goods)"
- Card description: "Retail, wholesale, buy-and-sell, manufacturing, or any business where you primarily sell physical products or merchandise. You have cost of goods sold."

**Card option 4 — MIXED_BUSINESS:**
- Card title: "Both products and services"
- Card description: "Your business sells both goods and services — e.g., a repair shop, a restaurant, a product + installation business."

**Card option 5 — NOT_SURE:**
- Card title: "I'm not sure how to categorize my work"
- Card description: "See the helper guide below to determine which category fits your work."

**NOT_SURE helper panel content:**
- Paragraph 1: "If you primarily exchange time, skill, or knowledge for money — writing, coding, designing, advising — you are a **Service Provider**."
- Paragraph 2: "If you primarily buy goods and resell them, or manufacture products to sell, you are a **Trader**."
- Paragraph 3: "If your work involves both (e.g., you sell equipment AND install it), choose **Both products and services**."
- Paragraph 4: "If you have a government-regulated license (PRC-issued or SC-issued), choose **Licensed profession**."
- Closing note: "After reading, please select one of the four options above."

**Validation error (not_sure or unselected):** "Please select your business type. If unsure, expand the helper guide below."

**Field label (is_gpp_partner):** "Do you practice through a General Professional Partnership (GPP)?"
**Toggle option Yes:** "Yes"
**Toggle option No:** "No"
**is_gpp_partner help text:** "A GPP is a partnership formed by licensed professionals (e.g., a law firm, accounting firm, or medical group) that is itself tax-exempt at the entity level. If you are a partner receiving a distributive share of GPP net income, your income is classified differently. Most solo practitioners select 'No'."
**is_gpp_partner validation error:** "Please indicate whether you practice through a General Professional Partnership."

**GPP = Yes advisory:**
- Type: Amber warning
- Text: "GPP partners are subject to special rules. The 8% flat rate option is NOT available to GPP distributive share income. This tool will flag items requiring manual review with your accountant. Computation will proceed under Graduated + Itemized or Graduated + OSD."

**Field label (cost_of_goods_sold):** "Cost of goods sold (COGS)"
**cost_of_goods_sold placeholder:** "0.00"
**cost_of_goods_sold help text:** "Enter the total cost of the goods you purchased or manufactured for sale. This includes the purchase price of inventory, shipping costs to acquire goods, and direct production costs. Do NOT include your own salaries, rent, or overhead here — those go in the expenses section."
**cost_of_goods_sold error (negative):** "Cost of goods sold cannot be negative."
**cost_of_goods_sold error (exceeds gross):** "Cost of goods sold cannot exceed your gross receipts. If your COGS exceeded your revenue, you have a gross loss — please verify your numbers."

---

### WS-03: Tax Year and Filing Period

**Screen title (H1):** "What period are you filing for?"

**Field label (tax_year):** "Tax year"
**tax_year help text:** "Select the calendar year you are filing for. For the Annual ITR due April 15, 2026: select 2025. For quarterly returns during 2026: select 2026."

**tax_year options:**
| Value | Display label |
|-------|--------------|
| 2018 | "2018" |
| 2019 | "2019" |
| 2020 | "2020" |
| 2021 | "2021" |
| 2022 | "2022" |
| 2023 | "2023" |
| 2024 | "2024" |
| 2025 | "2025 (most common)" |
| 2026 | "2026 (current year — quarterly filers only)" |

**tax_year error (out of range):** "Please select a valid tax year between 2018 and 2026."
**tax_year error (future annual):** "You cannot file an Annual ITR for a year that has not yet ended. For quarterly returns in progress, select 'Quarterly Income Tax Return' mode."

**tax_year advisory (tax_year == 2023):**
- Type: Amber info
- Text: "For 2023, there are two rate tables. The OLD TRAIN rates apply to January–December 2022 only. The NEW (lower) TRAIN rates apply to 2023 onwards. This tool applies the 2023+ rate table for Tax Year 2023, which is correct per BIR."

**tax_year advisory (tax_year <= 2022):**
- Type: Blue info
- Text: "You are computing tax for {tax_year}. The 2018–2022 graduated rate table applies, with higher brackets than the 2023+ table. Verify your rates with BIR issuances for older years."

**Field label (filing_period):** "Filing period"
**filing_period help text:** "Annual: covers the full calendar year (Jan 1–Dec 31). Quarterly: covers Jan–Mar (Q1), Jan–Jun (Q2), or Jan–Sep (Q3) on a cumulative basis."

**filing_period options for ANNUAL mode:**
| Value | Label |
|-------|-------|
| ANNUAL | "Annual Return — Full year (January 1–December 31)" |

**filing_period options for QUARTERLY mode:**
| Value | Label | Deadline note |
|-------|-------|--------------|
| Q1 | "Q1 — January 1 through March 31" | "Due May 15 of the same year" |
| Q2 | "Q2 — January 1 through June 30 (cumulative)" | "Due August 15 of the same year" |
| Q3 | "Q3 — January 1 through September 30 (cumulative)" | "Due November 15 of the same year" |

**filing_period options for PENALTY mode:**
| Value | Label |
|-------|-------|
| ANNUAL | "Annual Return (Form 1701 / 1701A)" |
| Q1 | "Q1 Quarterly Return (Form 1701Q)" |
| Q2 | "Q2 Quarterly Return (Form 1701Q)" |
| Q3 | "Q3 Quarterly Return (Form 1701Q)" |

**filing_period note (QUARTERLY mode):** "There is no Q4 quarterly return for income tax. Q4 data is reported on your Annual ITR (Form 1701/1701A) due April 15 of the following year."

**filing_period error (no selection):** "Please select the filing period."
**filing_period error (Q4 attempted):** "Q4 is not a valid quarterly filing period for income tax. Select Annual Return to compute your full-year balance."

---

### WS-04: Gross Receipts

**Screen title (H1):** "How much did you earn?"

**Field label (gross_receipts):** "Total gross receipts or sales"
**gross_receipts placeholder:** "0.00"
**gross_receipts help text:** "Enter all income you received from your business or profession during the period — before subtracting any expenses. For freelancers: all amounts clients paid you. For quarterly returns: the cumulative total from January 1 through the end of the quarter, not just the current quarter's receipts."

**gross_receipts errors:**
- (empty): "Please enter your gross receipts. Enter ₱0 if you had no income this period."
- (negative): "Gross receipts cannot be negative."
- (less than returns): "Gross receipts cannot be less than your sales returns and allowances."
- (over maximum): "Amount exceeds maximum allowed value. If your income exceeds ₱10 billion, please contact us."

**gross_receipts inline advisories (shown as user types, 300ms debounce):**

| Condition | Type | Advisory text |
|-----------|------|--------------|
| 0 < receipts ≤ ₱250,000 | Amber | "Your income is ₱250,000 or below. Under the 8% flat rate option, your income tax would be ₱0 — the ₱250,000 is fully exempt. You still need to file a return with BIR." |
| ₱250,000 < receipts ≤ ₱3,000,000 | Green | "You may be eligible for the 8% flat rate option. The optimizer will compare all available methods and recommend the one that saves you the most." |
| receipts > ₱3,000,000 | Orange | "Your gross receipts exceed ₱3,000,000. The 8% flat rate option is NOT available. The optimizer will compare Graduated + OSD versus Graduated + Itemized Deductions." |
| receipts > ₱3,000,000 AND not VAT-registered | Orange (appended) | "At this income level, you may be required to register for VAT. See Registration Details in a later step." |
| receipts == 0 | Amber | "You have entered ₱0 for gross receipts. If you had no income this period, you are still required to file a 'no-income' return with BIR by the deadline." |

**Field label (sales_returns_allowances):** "Sales returns and allowances (if any)"
**sales_returns_allowances placeholder:** "0.00"
**sales_returns_allowances help text:** "Refunds you gave back to clients, credit memos, or discounts off the invoice price that reduce your gross receipts. Most freelancers leave this at ₱0. Do NOT enter your business expenses here — those are entered separately."
**sales_returns_allowances error (negative):** "Sales returns and allowances cannot be negative."
**sales_returns_allowances error (exceeds gross):** "Returns and allowances cannot exceed your gross receipts."

**Expandable section label:** "Additional income (optional)"
**Expandable section expand CTA:** "Show additional income fields ▾"
**Expandable section collapse CTA:** "Hide additional income fields ▴"

**Field label (non_operating_income):** "Other business-related income (not subject to final tax)"
**non_operating_income placeholder:** "0.00"
**non_operating_income help text:** "Passive income from your business that is not subject to final withholding tax and is not already included in your gross receipts above. Examples: rental income from a property you own for business use, royalties from professional work where no final tax was withheld. Do NOT include bank interest or dividends here — those go in the next field."
**non_operating_income error (negative):** "Income cannot be negative."

**Field label (fwt_income):** "Income already subject to final withholding tax"
**fwt_income placeholder:** "0.00"
**fwt_income help text:** "Income on which the payor already withheld the FINAL tax — meaning this income is fully taxed and excluded from your income tax return computation. Examples: interest income on bank savings/time deposits (20% FWT), PCSO prize winnings (20% FWT), dividends from domestic corporations (10% FWT). This amount is excluded from the taxable base. Do not add it to gross receipts."
**fwt_income error (negative):** "Amount cannot be negative."

---

### WS-05: Compensation Income (Mixed Income Only)

**Screen title (H1):** "Your employment income"

**Step introduction text:** "For mixed-income earners, your salary from employers and your business income are computed together for tax purposes. Your employer(s) already withheld income tax from your salary — enter the NET taxable compensation after all exclusions."

**Field label (taxable_compensation):** "Total taxable compensation income"
**taxable_compensation placeholder:** "0.00"
**taxable_compensation help text:** "From your BIR Form 2316 (received from your employer), use the amount on 'Gross Taxable Compensation Income' or Item 22 — which is your gross compensation MINUS non-taxable exclusions (SSS, PhilHealth, Pag-IBIG employee share, 13th month pay up to ₱90,000, de minimis benefits). If you have multiple employers, add up all Form 2316 amounts. Do NOT reduce by income tax withheld — that goes in the next field."
**taxable_compensation error (empty):** "Please enter your taxable compensation. Use ₱0 if your compensation was fully excluded."
**taxable_compensation error (negative):** "Taxable compensation cannot be negative."
**taxable_compensation advisory (zero):**
- Type: Amber
- Text: "You entered ₱0 for compensation. If you truly have no salary income, consider selecting 'Purely Self-Employed' instead. If your compensation was below the non-taxable threshold, ₱0 is correct."

**Field label (number_of_employers):** "How many employers did you have this year?"
**number_of_employers help text:** "If you had more than one employer in the tax year, enter the combined totals from all your Form 2316 certificates in the fields below."
**number_of_employers options:** "1 employer", "2 employers", "3 or more employers"
**number_of_employers advisory (> 1):**
- Type: Amber info
- Text: "With multiple employers, your total tax withheld may exceed what a single employer would withhold. The engine will reconcile this at the annual level. Make sure you combine all Form 2316 amounts."

**Field label (compensation_cwt):** "Total income tax withheld from your salary (from all Form 2316s)"
**compensation_cwt placeholder:** "0.00"
**compensation_cwt help text:** "From your BIR Form 2316, use Item 33 'Total Taxes Withheld'. If you have multiple Form 2316s, add the Item 33 amounts from each. This amount credits against your total income tax due."
**compensation_cwt error (empty):** "Please enter the total tax withheld from your salary."
**compensation_cwt error (negative):** "Amount cannot be negative."
**compensation_cwt advisory (> 35% of compensation):**
- Type: Amber
- Text: "The tax withheld (₱{compensation_cwt}) appears high relative to your compensation (₱{taxable_compensation}). The maximum income tax rate is 35%. Please double-check your Form 2316 figures."

---

### WS-06: Expense Method Selection

**Screen title (H1):** "How would you like to handle your business expenses?"

**Step introduction text:** "To recommend the best tax method, the optimizer needs to know your business expenses. You have two options:"

**Field label (expense_input_method):** "How will you enter your expenses?"

**Card option 1 — ITEMIZED:**
- Card title: "Enter my actual expenses"
- Card description: "I'll enter a detailed breakdown of what I spent on my business. This may save you more tax if your actual expenses exceed 40% of your income. You'll need your receipts and records."

**Card option 2 — OSD:**
- Card title: "Use the 40% standard deduction (easier)"
- Card description: "I don't want to track individual expenses. The BIR allows you to deduct 40% of your gross income automatically — no receipts needed. Great if your expenses are below 40% of income or you don't keep detailed records."

**Card option 3 — NO_EXPENSES:**
- Card title: "I had no significant business expenses"
- Card description: "My only income source is services billed to clients and I had no notable business costs. The tool will compute using OSD (40%) and 8% flat rate (if eligible)."

**Note below cards:** "Regardless of which you choose, the optimizer will always compare all three tax methods (8%, OSD, and Itemized) and tell you which saves the most. If you enter itemized expenses, you get a complete three-way comparison. If you skip expenses, the optimizer assumes ₱0 itemized and ₱0 OSD beats itemized in most cases."

**Advisory when ITEMIZED selected:**
- Type: Blue info
- Text: "You'll enter your expenses in the next few steps. You don't need exact figures — reasonable estimates work for tax planning. You'll need exact amounts only if you actually file using Itemized Deductions."

**Advisory when OSD or NO_EXPENSES selected (with gross receipts entered):**
- Type: Green
- Text: "Estimated OSD deduction: ₱{gross × 0.40}. This is 40% of your gross receipts. Taxable income under OSD would be approximately ₱{(gross - returns) × 0.60}."

**Validation error (no selection):** "Please select how you'll enter your expenses."

---

### WS-07A: Itemized Expenses — General Business Costs

**Screen title (H1):** "Your business expenses — General costs"

**Step introduction text:** "Enter the amounts you spent on your business this year. Enter ₱0 for any category that doesn't apply to you. All deductions are subject to BIR rules — the engine applies the correct caps and rules automatically."

**Field labels, help text, and errors:**

| Field ID | Label | Help Text | Error |
|----------|-------|-----------|-------|
| salaries_and_wages | "Salaries and wages paid to employees" | "Total gross salaries and wages you paid to your employees or helpers during the year. Do NOT include your own compensation (you are the business owner, not an employee of your own sole proprietorship)." | "Amount cannot be negative." |
| sss_philhealth_pagibig_employer_share | "Employer's share of SSS, PhilHealth, and Pag-IBIG contributions" | "Only the mandatory employer's share of SSS, PhilHealth, and Pag-IBIG contributions paid for your employees is deductible here. The employee's share (deducted from their salary) is not your expense. Your own voluntary SSS/PhilHealth contributions as a self-employed individual are NOT deductible under this line." | "Amount cannot be negative." |
| rent | "Office or workspace rent" | "Rent paid for your dedicated office space, co-working desk, or business premises. For home offices, do NOT enter your full home rent here — use the 'Home office' field instead (only the business-use portion qualifies, and only if the space is used exclusively for business)." | "Amount cannot be negative." |
| utilities | "Utilities (electricity, water — business portion)" | "Electricity and water bills attributable to your business operations. If you work from home, enter only the business-use portion (e.g., if 20% of your home is used for business, enter 20% of your utility bills here). If you have a dedicated office, enter the full utility bills for that office." | "Amount cannot be negative." |
| communication | "Communication and internet costs (business portion)" | "Phone, mobile load, and internet subscription costs for business use. If your internet connection is used for both personal and business purposes, enter only the business portion. Most freelancers who work exclusively online claim the full internet subscription." | "Amount cannot be negative." |
| office_supplies | "Office supplies and materials" | "Stationery, printer ink and paper, small tools, pens, notebooks, and other consumable supplies used in your business. Do NOT include computers or equipment that last more than one year — those are depreciated (enter them in the Depreciation section)." | "Amount cannot be negative." |
| professional_fees_paid | "Professional fees paid to others" | "Fees paid to accountants, lawyers, consultants, subcontractors, or other professionals who helped your business. Do NOT include your own professional income here — only what you paid others." | "Amount cannot be negative." |
| travel_transportation | "Business travel and transportation" | "Transportation costs for business-related travel: fuel, parking, Grab/taxi rides to client sites, airfare and hotel for business trips within the Philippines. Personal travel is NOT deductible. Foreign travel is subject to additional scrutiny by BIR." | "Amount cannot be negative." |
| insurance_premiums | "Business insurance premiums" | "Premiums for business insurance policies: general liability, professional indemnity, property insurance on business assets. Life insurance is deductible ONLY if the death benefit goes to the business, not to your family. Personal life insurance premiums are not deductible." | "Amount cannot be negative." |
| taxes_and_licenses | "Business taxes and licenses (excluding income tax)" | "Business registration fees (barangay, municipal, city), professional tax receipts (PTR), documentary stamp taxes paid, and other taxes that are NOT income tax. Do NOT include your income tax or percentage tax here — the engine computes and deducts those separately." | "Amount cannot be negative." |
| entertainment_representation | "Entertainment, meals, and representation expenses" | "Client meals, entertainment costs, and gifts spent for business development. Important: the BIR limits this deduction to 1% of your net revenue (for service businesses) or 0.5% of net sales (for traders). The engine automatically computes the cap and limits your deduction. Enter your actual spending — the engine applies the cap." | "Amount cannot be negative." |
| home_office_expense | "Home office expense (monthly rent or mortgage interest)" | "If you work from home and have a space used exclusively for business (a dedicated room, not a shared living area), enter the business-use portion of your monthly home rent or mortgage interest × 12. Example: if your rent is ₱15,000/month and your home office is 15% of your home's total floor area, enter ₱15,000 × 12 × 0.15 = ₱27,000." | "Amount cannot be negative." |

**entertainment_representation inline advisory (when value > 0):**
- Type: Blue info
- Text: "The BIR caps entertainment deductions at 1% of net revenue for service providers. Your estimated cap is ₱{(gross_receipts - returns) × 0.01}. If you entered more than this, the engine will automatically reduce your deductible amount to the cap."

**Field label (home_office_exclusive_use):** "Is this space used exclusively and regularly for business?"
**Toggle Yes label:** "Yes — dedicated business-only space"
**Toggle No label:** "No — shared or personal use too"
**home_office_exclusive_use help text:** "BIR requires the space to be used EXCLUSIVELY for business — meaning you do no personal activities there. A dedicated home office room qualifies. A dining table, bedroom, or shared living space does NOT qualify even if you work there regularly."
**home_office_exclusive_use error (not answered when required):** "Please indicate whether the space is used exclusively for business."

**home_office_exclusive_use == false AND expense > 0 advisory:**
- Type: Amber warning
- Text: "Since the space is not exclusively used for business, the BIR home office deduction does NOT apply. Your home office expense of ₱{home_office_expense} will NOT be deducted. To claim a home office deduction, the space must be used only for business activities."

---

### WS-07B: Itemized Expenses — Financial and Special Items

**Screen title (H1):** "Your business expenses — Financial and special items"

| Field ID | Label | Help Text | Error |
|----------|-------|-----------|-------|
| interest_expense | "Interest expense on business loans" | "Interest paid on loans taken out for business purposes — bank loans, credit line interest, or financing used for business operations. The BIR applies an interest arbitrage reduction: if you earned interest income that was subject to final tax, your interest deduction is reduced by 33% of that income." | "Amount cannot be negative." |
| final_taxed_interest_income | "Interest income subject to final tax (for arbitrage reduction)" | "Interest income you earned that was already subject to 20% final withholding tax (e.g., bank savings/time deposit interest). This is used to compute the interest arbitrage reduction on your business loan interest deduction. If you had none, enter ₱0." | "Amount cannot be negative." |
| casualty_theft_losses | "Casualty and theft losses (net of insurance proceeds)" | "Losses from fire, theft, typhoon, earthquake, flood, or other casualty events affecting your business assets — net of any insurance reimbursement received. The loss must be reported to BIR within 45 days of occurrence. Personal losses are NOT deductible." | "Amount cannot be negative." |
| bad_debts | "Bad debts written off" | "Accounts receivable that have become uncollectible and you have written off as worthless. Deductible only if the income from these receivables was previously included in your gross income. Cash-basis taxpayers cannot claim bad debt deductions because income is only recognized when received." | "Amount cannot be negative." |
| charitable_contributions | "Charitable contributions" | "Donations to qualified donee institutions. Contributions to government entities (national/local government units and certain state universities) are fully deductible. Contributions to accredited private non-profit organizations are deductible up to 10% of net income (before the charitable deduction). Enter total contributions here — the engine applies the cap automatically." | "Amount cannot be negative." |
| research_development | "Research and development expenses" | "Costs directly related to research, development, or improvement of your business product, process, or service. Must be directly connected to your income-producing activity. Capital expenditures disguised as R&D are not deductible here." | "Amount cannot be negative." |

**Field label (is_accrual_basis):** "Are you on accrual accounting basis?"
**Toggle Yes label:** "Yes — I record income when earned and expenses when incurred"
**Toggle No label:** "No — I record income when received and expenses when paid (cash basis)"
**is_accrual_basis default:** No
**is_accrual_basis help text:** "Most freelancers and small businesses use cash basis — you record income when clients actually pay you and expenses when you actually pay them. Accrual basis means recording income when it is earned (even if not yet received) and expenses when incurred (even if not yet paid). If you're not sure, you are likely on cash basis."

**Field label (charitable_accredited):** "Is the organization BIR-accredited as a qualified donee?"
**Toggle Yes label:** "Yes — BIR-accredited donee organization"
**Toggle No label:** "No — government agency or not sure"
**charitable_accredited help text:** "BIR-accredited NGOs are listed on the BIR website. Donations to national government, LGUs, and state universities/colleges are automatically fully deductible regardless of accreditation."

**bad_debts advisory when entered by cash-basis taxpayer:**
- Type: Amber warning
- Text: "Cash-basis taxpayers cannot claim bad debt deductions. Because you are on cash basis (income recorded only when received), there is no prior income recognition that can become uncollectible. The engine will set your bad debt deduction to ₱0. If you are actually on accrual basis, toggle the accounting method above."

---

### WS-07C: Itemized Expenses — Depreciation Assets

**Screen title (H1):** "Depreciation on business assets"

**Step introduction text:** "If you own business equipment, computers, vehicles, or other assets used in your business, you can deduct their depreciation each year. Enter each depreciable asset separately."

**Empty state (no assets added yet):**
- Icon alt: "Empty folder icon"
- Heading: "No depreciation assets added yet"
- Body: "Add each business asset (computer, equipment, vehicle) to compute annual depreciation. If you have no depreciable assets, click Continue to skip this section."
- CTA: "Add an asset"

**Add asset button:** "+ Add Depreciation Asset"
**Remove asset button:** "Remove asset"
**Remove asset confirm dialog title:** "Remove this asset?"
**Remove asset confirm dialog body:** "This will remove {asset_description} from your depreciation schedule."
**Remove asset confirm button:** "Yes, remove it"
**Remove asset cancel button:** "Keep asset"

**Per-asset fields:**

| Field ID | Label | Help Text | Error |
|----------|-------|-----------|-------|
| asset_description | "Asset description" | "A short name for the asset (e.g., 'Laptop — MacBook Pro 2024', 'Camera and lens kit', 'Office desk and chair'). This is for your reference only." | "Please enter a description for this asset." |
| asset_cost | "Original cost (purchase price)" | "The amount you paid for the asset when it was acquired, including any taxes, shipping, and installation costs to bring it to its usable condition." | "Please enter the original cost." / "Amount cannot be negative." |
| asset_type | "Asset type" | "Select the category that best describes this asset. This determines the BIR-approved useful life for straight-line depreciation." | "Please select an asset type." |
| acquisition_date | "Date acquired (or placed in service)" | "The date you purchased or first used the asset for your business. For assets acquired in a prior year, enter the original acquisition date — the engine computes the correct remaining depreciable life." | "Please enter the acquisition date." / "Date cannot be in the future." |
| residual_value | "Residual (salvage) value" | "The estimated value of the asset at the end of its useful life. Most taxpayers use ₱1 or ₱0. The residual value is NOT depreciated — only the cost minus residual value is spread over the useful life." | "Amount cannot be negative." / "Residual value cannot exceed original cost." |

**asset_type dropdown options:**
| Value | Display |
|-------|---------|
| COMPUTER_EQUIPMENT | "Computer and IT equipment (5 years)" |
| FURNITURE_FIXTURES | "Furniture and fixtures (10 years)" |
| OFFICE_EQUIPMENT | "Office equipment and appliances (5 years)" |
| VEHICLE | "Motor vehicle — car, van, motorcycle (5 years)" |
| MACHINERY | "Machinery and manufacturing equipment (10 years)" |
| LEASEHOLD_IMPROVEMENTS | "Leasehold improvements (10 years or lease term, shorter)" |
| BUILDING | "Building owned by business (25 years)" |
| INTANGIBLES | "Intangible assets — patents, franchise, copyright (legal life or 10 years)" |
| OTHER | "Other business asset — specify useful life" |

**asset_type == VEHICLE advisory:**
- Type: Amber warning
- Text: "For motor vehicles, the BIR limits the depreciation base to ₱2,400,000 per vehicle (RR 12-2012). If your vehicle cost more than ₱2,400,000, depreciation will be computed on ₱2,400,000, not the actual cost."

**asset_type == OTHER additional field:**
- Field label: "Useful life (years)"
- Help text: "Enter the BIR-approved useful life in years for this type of asset. If unsure, use 5 years as a conservative estimate."
- Error: "Please enter a useful life between 1 and 50 years."

**Computed per-asset display (shown below each asset entry):**
- "Annual depreciation: ₱{annual_dep}"
- "Depreciation for this period: ₱{period_dep} ({months} months)"
- "Accumulated depreciation: ₱{accumulated_dep}"
- "Book value: ₱{book_value}"

**Total depreciation summary:** "Total depreciation deduction for this period: ₱{total}"

---

### WS-07D: Itemized Expenses — NOLCO Carry-Over

**Screen title (H1):** "Net Operating Loss Carry-Over (NOLCO)"

**Step introduction text:** "If your business had a net operating loss in any of the past three years, you may carry it over and deduct it this year. This section is only relevant if you had a business loss in 2022, 2023, or 2024."

**Skip section advisory (default shown):**
- Type: Blue info
- Text: "Most taxpayers leave this section at ₱0. Only fill this in if you had a net operating loss in a prior year that was NOT offset by income. If you're not sure, skip it — your accountant can advise."

**Empty state (no NOLCO entries):**
- Heading: "No prior-year losses entered"
- Body: "If you had no net operating loss in the past 3 years, leave this section empty and click Continue."

**Add NOLCO year button:** "+ Add Prior-Year Loss"
**Remove NOLCO entry button:** "Remove"

**Per-NOLCO entry fields:**

| Field ID | Label | Help Text | Error |
|----------|-------|-----------|-------|
| nolco_year | "Year the loss occurred" | "The tax year in which your net operating loss occurred. NOLCO can be carried forward for 3 consecutive years." | "Please select the year the loss occurred." |
| nolco_amount | "Net operating loss amount" | "The net operating loss for that year — that is, total allowable deductions exceeded gross income. Do NOT include losses already used in prior year returns." | "Please enter the loss amount." / "Amount cannot be negative." |
| nolco_applied_prior | "Amount already applied in prior years" | "If you partially used this loss carry-over in a previous year, enter the amount previously applied. The engine will compute the remaining balance available." | "Amount cannot be negative." / "Cannot exceed original loss amount." |

**nolco_year options:**
| Value | Display |
|-------|---------|
| 2023 | "2023 (3-year carry-forward expires 2026)" |
| 2022 | "2022 (3-year carry-forward expires 2025)" |
| 2021 | "2021 (expired — no longer deductible in 2025)" |

**Expired year warning (2021):**
- Type: Orange warning
- Text: "The 2021 net operating loss has exceeded the 3-year carry-forward period and can no longer be deducted in 2024 or later tax years. Remove this entry."

---

### WS-08: Creditable Withholding Tax (Form 2307)

**Screen title (H1):** "Creditable withholding tax (BIR Form 2307)"

**Step introduction text:** "When Philippine businesses pay freelancers or professionals, they are required to withhold a portion of each payment and remit it to BIR on your behalf. They give you a BIR Form 2307 as a certificate. Enter all your 2307 amounts here — they will be credited against your tax due."

**No-CWT option:**
- Field label: "Did any of your clients withhold tax from your payments?"
- Toggle Yes label: "Yes — I have Form 2307 certificates"
- Toggle No label: "No — none of my clients withheld tax"
- Default: No
- Advisory if No (for ₱500K+ earners, amber): "Many Philippine businesses are required to withhold tax from payments to self-employed professionals. If you received payments from registered businesses without 2307 certificates, you may want to confirm with your clients that they are compliant."

**Empty state (2307 entries):**
- Heading: "No 2307 entries yet"
- Body: "Add each BIR Form 2307 you received. Each certificate is one entry."
- CTA: "Add Form 2307 Entry"

**Add 2307 button:** "+ Add Form 2307 Entry"
**Remove 2307 button:** "Remove"
**Remove 2307 confirm title:** "Remove this 2307 entry?"
**Remove 2307 confirm body:** "This will remove the ₱{amount} entry from {payor_name}."
**Remove 2307 confirm button:** "Yes, remove it"

**Per-2307 entry fields:**

| Field ID | Label | Help Text | Error |
|----------|-------|-----------|-------|
| payor_name | "Payor name (client or platform)" | "The name of the company or individual who withheld the tax and issued you the Form 2307. Examples: 'ABC Corp', 'Upwork (via Payoneer)', 'Fiverr'." | "Please enter the payor name." |
| atc_code | "ATC code (from Form 2307)" | "The Alphanumeric Tax Code on the Form 2307. Common codes: WI010 (10% for professional fees), WI011 (15% for large taxpayers), WC010 (10% for contractors). Find it in Box 8 of your Form 2307. If you don't know the code, enter 'UNKNOWN'." | "Please enter the ATC code or 'UNKNOWN'." |
| amount_withheld | "Amount of tax withheld" | "The actual peso amount withheld. Found in Part III of your Form 2307. This is NOT the amount paid to you — this is the amount the client sent to BIR on your behalf." | "Please enter the withheld amount." / "Amount cannot be negative." / "Amount seems unusually large. Please verify." |
| period_covered | "Period covered by this 2307" | "The period for which the withholding applies. For annual returns, this should be within the tax year you are filing." | "Please select the period." |

**ATC auto-classification displayed after entry:**

| ATC Code | Classification Label | Color |
|----------|---------------------|-------|
| WI010 | "Income Tax CWT — credits against income tax due" | Green |
| WI011 | "Income Tax CWT — credits against income tax due" | Green |
| WI157 | "Income Tax CWT — credits against income tax due" | Green |
| WI160 | "Income Tax CWT — credits against income tax due" | Green |
| WI760 | "Income Tax CWT (RR 16-2023 Platform Rate) — credits against income tax" | Green |
| WC010 | "Income Tax CWT — credits against income tax due" | Green |
| WC760 | "Income Tax CWT (RR 16-2023 Platform Rate) — credits against income tax" | Green |
| PT010 | "Percentage Tax CWT — credits against 2551Q, NOT income tax" | Amber |
| UNKNOWN | "Unknown ATC — manual review required before filing" | Amber |

**PT010 advisory:**
- Type: Amber
- Text: "ATC PT010 is a Percentage Tax (2551Q) credit, not an income tax credit. This amount will be shown in your Percentage Tax section but cannot be applied to reduce your income tax due."

**UNKNOWN ATC advisory:**
- Type: Amber
- Text: "The ATC code '{atc_code}' is not recognized. The engine cannot automatically classify this credit. It will be flagged for manual review. Do not apply it to income tax until you confirm the code with your client or a CPA."

**RR 16-2023 advisory (shown when WI760 or WC760 entered):**
- Type: Blue info
- Text: "ATC WI760/WC760 applies to withholding by digital platforms (Upwork, Fiverr, Freelancer) on payments remitted to Philippine-registered freelancers. This 1% withholding applies to the gross payment amount under BIR RR 16-2023."

**Pro limit advisory (free tier, > 10 entries):**
- Type: Amber
- Text: "Free accounts support up to 10 Form 2307 entries. You have {count} entries. Upgrade to Pro to enter up to 50 entries, or consolidate multiple 2307s from the same payor."
- CTA button: "Upgrade to Pro"

**2307 total summary:** "Total income tax CWT credits: ₱{total_it_cwt}"
**2307 PT total:** "Total percentage tax CWT credits: ₱{total_pt_cwt}"

---

### WS-09: Prior Quarterly Payments

**Screen title (H1):** "Prior quarterly tax payments"

**Step introduction text (ANNUAL mode):** "If you filed quarterly income tax returns (Form 1701Q) during the year, enter the amounts you already paid. These payments will be credited against your annual income tax due, reducing your balance payable."

**Step introduction text (QUARTERLY Q2 mode):** "For Q2 returns, you credit the income tax you already paid in Q1. Enter your Q1 payment below."

**Step introduction text (QUARTERLY Q3 mode):** "For Q3 returns, you credit the income tax you paid in Q1 and Q2. Enter both payments below."

**Step introduction text (QUARTERLY Q1 mode):** "This is your first quarterly return for the year, so there are no prior quarterly payments to enter. Click Continue."

**Q1 payment field:**
- Label: "Q1 income tax paid (Form 1701Q — Q1)"
- Help text: "The income tax due as shown in your Q1 Form 1701Q. Find this on Line 62 of your filed 1701Q. Do NOT include penalties or percentage tax — income tax only."
- Placeholder: "0.00"
- Error (negative): "Amount cannot be negative."

**Q2 payment field:**
- Label: "Q2 income tax paid (Form 1701Q — Q2)"
- Help text: "The income tax due as shown in your Q2 Form 1701Q (cumulative). Find this on Line 62. Enter the Q2 tax due, not the balance paid — the engine handles cumulative crediting."
- Error (negative): "Amount cannot be negative."

**Q3 payment field:**
- Label: "Q3 income tax paid (Form 1701Q — Q3)"
- Help text: "The income tax due as shown in your Q3 Form 1701Q (cumulative). Find this on Line 62."
- Error (negative): "Amount cannot be negative."

**Total quarterly paid summary:** "Total quarterly income tax paid: ₱{total}"

---

### WS-10: Registration and VAT Status

**Screen title (H1):** "Your BIR registration details"

**Step introduction text:** "Your registration status determines which tax obligations apply and which forms you file."

**Field label (is_vat_registered):** "Are you VAT-registered with BIR?"
**Toggle Yes label:** "Yes — I have a VAT registration (BIR Certificate of Registration shows VAT)"
**Toggle No label:** "No — I am not VAT-registered (non-VAT or OPT)"
**is_vat_registered help text:** "Look at your BIR Certificate of Registration (COR). If it shows 'Value-Added Tax (VAT)' under Tax Type, you are VAT-registered. If it shows 'Percentage Tax' or 'OPT', you are non-VAT. If your gross receipts exceed ₱3,000,000, you are required to register for VAT."

**is_vat_registered error (not answered):** "Please indicate whether you are VAT-registered."

**is_vat_registered == Yes advisory:**
- Type: Blue info
- Text: "VAT-registered taxpayers cannot use the 8% flat rate option. The optimizer will compare Graduated + OSD versus Graduated + Itemized Deductions only."

**is_vat_registered == No AND gross > ₱3M advisory:**
- Type: Orange warning
- Text: "Your gross receipts exceed ₱3,000,000 but you indicated you are not VAT-registered. Taxpayers whose annual sales exceed ₱3,000,000 are required to register for VAT and file Form 2550Q/2550M. Please verify your registration status or consult a CPA."

**Field label (rdO_code):** "RDO (Revenue District Office) code (optional)"
**rdO_code placeholder:** "e.g., 047"
**rdO_code help text:** "Your Revenue District Office number — found on your BIR Certificate of Registration. Examples: RDO 040 (Cubao), RDO 047 (East Makati), RDO 074 (Cebu City). This is optional and used only for filing reference."
**rdO_code error (invalid format):** "RDO code should be a 3-digit number (e.g., 047)."

**Field label (eopt_taxpayer_tier):** "EOPT Act taxpayer size classification"
**eopt_taxpayer_tier help text:** "Under the EOPT Act (RA 11976), taxpayers are classified by gross sales/receipts. This affects which simplified procedures apply."
**eopt_taxpayer_tier options:**
| Value | Display |
|-------|---------|
| MICRO | "Micro taxpayer — below ₱3,000,000 gross receipts" |
| SMALL | "Small taxpayer — ₱3,000,000 to ₱19,999,999" |
| MEDIUM | "Medium taxpayer — ₱20,000,000 to ₱999,999,999" |
| LARGE | "Large taxpayer — ₱1,000,000,000 and above (LTS-registered)" |

**Auto-suggest advisory:** "Based on your gross receipts of ₱{amount}, you are classified as a {tier_name} taxpayer under the EOPT Act."

---

### WS-11: Regime Election

**Screen title (H1):** "Your tax regime preference"

**Step introduction text:** "This tool automatically recommends the regime that minimizes your tax. However, if you have already elected a regime for this year (i.e., you already filed a Q1 1701Q with a regime election), select it here so the optimizer shows the correct result for your situation."

**Field label (user_regime_preference):** "Have you already elected a tax regime for this year?"
**Radio option 1:** "No — recommend the best option for me" (default)
**Radio option 2:** "Yes — I already elected 8% flat rate in my Q1 return"
**Radio option 3:** "Yes — I already elected the Graduated method (OSD or Itemized) in my Q1 return"

**user_regime_preference == 8% advisory:**
- Type: Amber
- Text: "You have elected the 8% flat rate for this year. This election is irrevocable for the current tax year. The optimizer will show your 8% computation results. If the optimizer shows a different regime would have been cheaper, this information is useful for next year's Q1 election."

**user_regime_preference == Graduated advisory:**
- Type: Blue info
- Text: "You have elected the Graduated method. The optimizer will show both OSD and Itemized results under the Graduated method, helping you choose between them at annual filing time."

**8% ineligibility advisory (shown when 8% is elected but gross > ₱3M or VAT-registered):**
- Type: Red blocking advisory
- Text: "The 8% flat rate option is not available to you because {reason}. Reasons: gross receipts exceed ₱3,000,000; OR you are VAT-registered; OR you have mixed income with compensation. Your computation will use the Graduated method only."

---

### WS-12: Filing Details and Return Type

**Screen title (H1):** "Filing details"

**Step introduction text:** "Based on your inputs, here is the BIR form you should file. Review and confirm."

**Form type display:**

| Form | Display label | When shown |
|------|--------------|------------|
| BIR Form 1701A | "BIR Form 1701A — Simplified Annual ITR" | Purely SE, 8% elected or OSD only, ANNUAL |
| BIR Form 1701 | "BIR Form 1701 — Annual ITR (with Schedule)" | Mixed income, OR itemized deductions, ANNUAL |
| BIR Form 1701Q | "BIR Form 1701Q — Quarterly ITR" | Any quarterly period |

**Filing deadline display:**

| Period | Deadline label |
|--------|---------------|
| ANNUAL | "Due: April 15, {tax_year + 1}" |
| Q1 | "Due: May 15, {tax_year}" |
| Q2 | "Due: August 15, {tax_year}" |
| Q3 | "Due: November 15, {tax_year}" |

**Field label (filing_date):** "Actual or planned filing date (optional)"
**filing_date placeholder:** "MM/DD/YYYY"
**filing_date help text:** "If you are computing penalties for a late filing, enter the actual date you will file. Leave blank if filing on time."
**filing_date error (past deadline and no penalty mode):** "This date is past the filing deadline. If you are filing late, switch to Penalty mode or add a penalty computation."

**Field label (has_tin):** "Do you have a BIR Tax Identification Number (TIN)?"
**Toggle Yes label:** "Yes"
**Toggle No label:** "No — I need to register"
**has_tin == No advisory:**
- Type: Orange warning
- Text: "You must register with BIR and obtain a TIN before filing a tax return. Self-employed individuals register using BIR Form 1901 at your Revenue District Office. Without a TIN, you cannot legally file or pay taxes. See [How to Register as Self-Employed →](/blog/how-to-register-bir-self-employed)."

**Field label (tin):** "Your TIN (optional)"
**tin placeholder:** "000-000-000-000"
**tin help text:** "Enter your 9- or 12-digit BIR Tax Identification Number for reference. This appears on your BIR Certificate of Registration."
**tin error (invalid format):** "TIN format should be 000-000-000 or 000-000-000-000 (9 or 12 digits with dashes)."

---

### WS-13: Prior Year Carry-Over Credits

**Screen title (H1):** "Carry-over credits from prior year"

**Step introduction text:** "If your prior year's annual return showed an overpayment that you opted to carry over (instead of claiming a refund), enter it here."

**Field label (prior_year_excess_cwt):** "Prior year excess creditable withholding tax"
**prior_year_excess_cwt placeholder:** "0.00"
**prior_year_excess_cwt help text:** "From your prior year's Form 1701 or 1701A, the amount of creditable withholding tax that exceeded your tax due and that you elected to carry over to the next year (not claim as a cash refund). Found on the prior year's Line 62 or equivalent field. Enter ₱0 if you claimed a refund instead, or if no excess existed."
**prior_year_excess_cwt error (negative):** "Amount cannot be negative."

**Field label (prior_year_excess_quarterly):** "Prior year excess quarterly income tax payments"
**prior_year_excess_quarterly placeholder:** "0.00"
**prior_year_excess_quarterly help text:** "If your prior year's quarterly returns overpaid your income tax and you elected to carry over the excess to this year, enter that carry-over amount here."
**prior_year_excess_quarterly error (negative):** "Amount cannot be negative."

**Advisory (when both fields > 0):**
- Type: Blue info
- Text: "You have two types of carry-over credits from last year. These will both be credited against your current year's income tax due."

---

## 7. Results Page Copy

### 7.1 Section RV-01: Page Header / Context Bar

**Back link:** "← Modify Inputs"

**Period badge format:** "Tax Year: {year} | {period}"
- Period labels: "Annual", "Q1 (Jan–Mar)", "Q2 (Jan–Jun)", "Q3 (Jan–Sep)"

**Page title (H1):** "Your Tax Computation Results"

**Subtitle (logged-in):** "{first_name}'s computation — {type_label}"
**Subtitle (anonymous):** "Anonymous computation — {type_label}"
- type_label values: "Self-Employed", "Mixed Income (Employee + Freelancer)", "Compensation Only"

**Input summary labels:**
- "Gross Receipts:"
- "Expenses:" (shows "None (8% method)" if no itemized expenses and 8% elected)
- "Filing:"
- "Status:" (shows "Non-VAT" or "VAT-Registered")
- "Compensation:" (shown only for mixed income)

### 7.2 Section RV-02: Warnings and Advisories Banner

**Warning card types:**

Red card (hard error):
- Icon alt text: "Error icon"
- Default heading: "Computation Error"
- Body: "{error_message}"
- Action: "Go back and fix this →"

Amber card (advisory warning):
- Icon alt text: "Warning icon"
- Heading: "{warning_title}" (e.g., "Gross receipts below ₱250,000")
- Body: "{warning_body}"

Blue card (manual review flag):
- Icon alt text: "Info icon"
- Heading: "Manual Review Required: {mrf_title}"
- Body: "{mrf_body}"
- Sub-label: "This item requires judgment that cannot be automated. Verify with a CPA before filing."

### 7.3 Section RV-03: Regime Comparison Table

**Section heading:** "All Three Tax Methods Compared"
**Section subheading:** "The optimizer computed your tax under every BIR-allowed method. The recommended one is highlighted."

**Table column headers:**
- "Tax Method"
- "Income Tax Due"
- "Percentage Tax (Form 2551Q)"
- "Total Tax Burden"
- "vs. Recommended"

**Path labels:**
- "Path A — Graduated + Itemized Deductions"
- "Path B — Graduated + Optional Standard Deduction (40%)"
- "Path C — 8% Flat Rate (includes OPT waiver)"

**Recommended badge:** "★ Recommended — lowest legal tax"

**Ineligible path label:** "Not eligible"
**Ineligible tooltip (gross > ₱3M):** "The 8% flat rate option is not available because your gross receipts exceed ₱3,000,000. This option is only available to taxpayers with annual gross receipts at or below ₱3,000,000."
**Ineligible tooltip (VAT-registered):** "The 8% flat rate option is not available to VAT-registered taxpayers."
**Ineligible tooltip (mixed income):** "The 8% flat rate option for mixed-income earners does not include the ₱250,000 exemption."

**"vs. Recommended" column labels:**
- Recommended row: "Best option ✓"
- Other rows: "₱{savings} more" (e.g., "₱12,500 more")

**Savings callout below table:** "You save ₱{savings_vs_worst} by choosing {recommended_path_label} instead of the worst option."

### 7.4 Section RV-04: Recommended Regime Callout

**Section heading:** "Your Best Option"
**Primary text:** "{recommended_path_label}"
**Sub-text (8% elected):** "Pay 8% of your gross income above ₱250,000. No deductions needed. Also waives the 3% percentage tax."
**Sub-text (OSD elected):** "Pay graduated rates on 60% of your gross income. No receipts needed — the 40% standard deduction is automatic."
**Sub-text (Itemized elected):** "Pay graduated rates on your income after deducting all allowable business expenses. Your actual expenses (₱{total_itemized}) exceed the OSD (₱{osd_amount}), making this the better option."

**Savings badge (> ₱0 savings):** "You save ₱{savings_vs_next} vs the next best method"
**Zero savings note:** "All eligible methods produce the same result for your inputs."

**Action hint:** "Lock this in — elect {path_label} in your Q1 quarterly return."

### 7.5 Section RV-05: Tax Due and Credits Breakdown

**Section heading:** "Income Tax Computation Breakdown"
**Subsection: using recommended path**

**Line item labels:**
- "Gross receipts / sales"
- "Less: Sales returns and allowances"
- "Net sales / receipts"
- "Less: Cost of goods sold" (TRADER only)
- "Gross income from business"
- "Less: Allowable deductions" (Itemized path only)
  - "  Salaries and wages"
  - "  SSS/PhilHealth/Pag-IBIG (employer share)"
  - "  Rent"
  - "  Utilities"
  - "  Communications"
  - "  Office supplies"
  - "  Professional fees paid"
  - "  Travel and transportation"
  - "  Insurance premiums"
  - "  Taxes and licenses"
  - "  Entertainment (after EAR cap)"
  - "  Home office"
  - "  Interest expense (net of arbitrage reduction)"
  - "  Casualty and theft losses"
  - "  Bad debts"
  - "  Charitable contributions (after cap)"
  - "  Research and development"
  - "  Depreciation"
  - "  NOLCO applied"
  - "  Percentage tax (deductible under Sec. 34(C)(1))"
  - "  Total allowable deductions"
- "Less: OSD (40% of gross income)" (OSD path only)
- "Less: Exemption" (8% path: "Less: ₱250,000 exemption (purely SE)")
- "Net taxable income from business"
- "Add: Taxable compensation income" (mixed income only)
- "Total net taxable income" (mixed income only)
- "Income tax due (from graduated rate table)"
- "OR: 8% flat rate tax" (8% path)
- "Less: Tax credits"
  - "  Creditable withholding tax (Form 2307)"
  - "  Tax withheld from compensation (Form 2316)" (mixed income)
  - "  Prior quarterly income tax payments"
  - "  Prior year excess carry-over"
  - "  Total credits"
- "Income tax payable / (overpayment)"

**Graduated rate breakdown (when Graduated path recommended):**
- Heading: "How the graduated rate was applied"
- Row format: "₱{lower} – ₱{upper}: {amount} × {rate}% = ₱{bracket_tax}"
- Fixed tax row: "+ ₱{fixed_amount} (fixed tax for this bracket)"
- Total: "= ₱{total_it} income tax"

### 7.6 Section RV-06: Balance Payable / Overpayment

**Balance payable heading:** "Balance Payable"
**Balance payable primary text:** "₱{balance}"
**Balance payable subtext:** "Amount due to BIR by {deadline_date}"
**Payment options label:** "How to pay:"
**Payment option 1:** "Online via GCash, Maya, or bank transfer through BIR's eFPS/eBIRForms"
**Payment option 2:** "At any authorized agent bank (AAB)"
**Payment option 3:** "At BIR Revenue Collection Officers at your RDO"

**Overpayment heading:** "Overpayment"
**Overpayment primary text:** "₱{overpayment}"
**Overpayment subtext:** "You have overpaid your income tax for {tax_year}."
**Overpayment options label:** "Options:"
**Overpayment option 1:** "Claim as a tax refund by filing BIR Form 1706 within 2 years"
**Overpayment option 2:** "Carry over to next year's income tax"
**Overpayment note:** "Most taxpayers choose the carry-over option — it is faster and requires no separate BIR claim."

**Zero balance heading:** "No Balance Due"
**Zero balance text:** "Your tax credits exactly equal your income tax liability. No additional payment is required. File your return by the deadline to avoid penalties."

### 7.7 Section RV-07: Installment Payment Option

**Section heading:** "Installment Payment Option"
**Eligibility note:** "Your balance payable qualifies for installment payment (balance > ₱2,000 for annual filers)."
**Installment option 1 label:** "Pay in full by deadline"
**Installment option 1 amount:** "₱{balance} due {deadline}"
**Installment option 2 label:** "Pay in two installments"
**Installment option 2 detail:** "First installment: ₱{half} due {deadline}. Second installment: ₱{half} due {deadline + 2 months}."
**Disclaimer:** "Installment option applies only to the balance on annual returns. Penalties apply if installments are missed."

### 7.8 Section RV-08: Percentage Tax Summary

**Section heading:** "Quarterly Percentage Tax (Form 2551Q)"
**Section subheading (non-8% filers):** "As a non-VAT registered taxpayer, you are subject to 3% percentage tax on your gross quarterly sales."

**Line items:**
- "Gross quarterly sales/receipts"
- "Percentage tax rate: 3% (under NIRC Sec. 116 and CREATE Law)"
- "Quarterly percentage tax due: ₱{pt_due}"
- "Less: Percentage tax CWT (PT010 from Form 2307): ₱{pt_cwt}"
- "Net percentage tax payable: ₱{pt_balance}"

**Deadline row:** "Due date: {quarter_deadline} (quarterly, per BIR calendar)"
**Filing note:** "File Form 2551Q with payment at your AAB or via eFPS."

**8% filer note (shown when 8% is recommended):**
- Type: Green
- Text: "You are NOT subject to quarterly percentage tax because you elected the 8% flat rate option. The 8% rate replaces both the income tax computation AND the 3% percentage tax obligation. This is one of the key advantages of the 8% option."

### 7.9 Section RV-09: BIR Form Recommendation

**Section heading:** "Which BIR Form to File"

**Form card headings:**
- "BIR Form 1701A — Simplified Annual ITR"
- "BIR Form 1701 — Annual ITR (Individual)"
- "BIR Form 1701Q — Quarterly ITR"
- "BIR Form 2551Q — Quarterly Percentage Tax Return"

**Form description — 1701A:** "File this if you are purely self-employed or professional with only one type of income, and you elected either the 8% flat rate or the OSD (40%). This is the simpler form with fewer schedules."

**Form description — 1701:** "File this if you are a mixed-income earner, or if you are claiming itemized deductions, or if you have multiple income types. This form has additional schedules."

**Form description — 1701Q:** "File this quarterly (Q1 by May 15, Q2 by August 15, Q3 by November 15). Uses the cumulative method — earlier quarters' taxes are credited."

**Form description — 2551Q:** "File this quarterly if you are not VAT-registered and earn from business. Rate: 3% of gross quarterly sales/receipts. Due dates: same as 1701Q."

**Where to file note:** "File at your registered RDO, via eBIRForms (offline software), or via eFPS (online) if enrolled. You can also authorize a CPA or accredited tax agent."

### 7.10 Section RV-10: Penalty Summary (Late Filing)

**Section heading:** "Late Filing Penalties"

**Line items:**
- "Basic tax due: ₱{basic_tax}"
- "Surcharge (25% of basic tax): ₱{surcharge}" (or 50% for fraud)
- "Interest ({rate}% per annum, {days} days): ₱{interest}"
- "Compromise penalty: ₱{compromise}"
- "Total amount due including penalties: ₱{total}"

**EOPT reduction note (MICRO/SMALL taxpayers):**
- Type: Green
- Text: "As a {tier} taxpayer under the EOPT Act, you qualify for reduced surcharge rates (10% instead of 25%) and reduced interest (6% per annum instead of 12%)."

**Nil return penalty note:** "A return showing no tax due (nil return) filed late still incurs a compromise penalty of ₱{nil_penalty} (1st offense)."

### 7.11 Section RV-11: Manual Review Flags

**Section heading:** "Items Requiring Manual Review"
**Section subheading:** "The following items could not be automatically computed and require verification with a CPA or review of your records."

**Per-flag format:**
- Flag code label: "MRF-{N}"
- Flag title: "{mrf_title}"
- Flag body: "{mrf_explanation}"
- Required action: "Action: {required_action_text}"

**Common flag action texts:**
- "Verify with a licensed CPA before filing."
- "Obtain documentation and verify the deductibility with your accountant."
- "Consult BIR RMC or a tax professional."
- "Engine assumed: {assumed_value}. Correct if your actual situation differs."

### 7.12 Section RV-12: Path Detail Accordion

**Section heading:** "See Details for Each Method"

**Accordion tab labels:**
- "Path A — Graduated + Itemized"
- "Path B — Graduated + OSD"
- "Path C — 8% Flat Rate"

**Expand button aria-label:** "Expand {path_label} computation details"
**Collapse button aria-label:** "Collapse {path_label} computation details"

**Recommended path note:** "★ This is your recommended path"
**Ineligible path note:** "✗ Not available for your situation"
**Available but not recommended note:** "Available — ₱{savings} more than recommended"

### 7.13 Section RV-13: Action Bar

**Desktop panel heading:** "What would you like to do?"

**Button: Share result link (Free)**
- Label: "Share Result Link"
- Sub-label: "Copy a read-only shareable link"
- Loading state: "Generating link…"
- Success toast: "Link copied to clipboard!"
- Error toast: "Could not generate link. Try again."

**Button: Save computation (requires account)**
- Label (logged out): "Save Computation"
- Label (logged in): "Save to My Account"
- Sub-label (logged out): "Free — requires signup"
- Loading state: "Saving…"
- Success toast: "Computation saved to your account."
- Error toast: "Save failed. Please try again."

**Button: Download PDF (Pro)**
- Label: "Download PDF Summary"
- Sub-label (Pro): "Formatted tax summary PDF"
- Sub-label (Free): "Pro feature — upgrade to unlock"
- Loading state: "Generating PDF…"
- Success: Browser downloads file named "TaxKlaro_{year}_{period}_{date}.pdf"
- Error toast: "PDF generation failed. Please try again."
- Upgrade prompt (free user clicks): "Download PDF is a Pro feature. Upgrade to Pro for ₱200/month to access PDF exports, computation history, and quarterly tracking."
- Upgrade CTA: "Upgrade to Pro"
- Upgrade cancel: "Not now"

**Button: Start new computation**
- Label: "New Computation"
- Sub-label: "Clear inputs and start over"
- Confirm dialog title: "Start a new computation?"
- Confirm dialog body: "This will clear all current inputs. Save your current computation first if you want to keep it."
- Confirm button: "Start Over"
- Cancel button: "Keep current"

**Button: Modify inputs**
- Label: "← Modify Inputs"
- Behavior: Returns to last wizard step with inputs preserved

---

## 8. Loading and Skeleton States

### 8.1 Computation Loading (after final submit)

**Overlay heading:** "Computing your tax…"
**Loading step messages (displayed sequentially, 500ms each):**
1. "Validating your inputs…"
2. "Computing Graduated + Itemized (Path A)…"
3. "Computing Graduated + OSD (Path B)…"
4. "Computing 8% Flat Rate (Path C)…"
5. "Comparing all three methods…"
6. "Applying tax credits and quarterly payments…"
7. "Almost done…"

**Timeout message (shown after 10s):** "This is taking longer than expected. Please wait…"
**Error fallback (shown after 30s):** "The computation is taking unusually long. Please try again. If the problem persists, [contact support](/contact)."

### 8.2 PDF Generation Loading

**Overlay heading:** "Generating your PDF…"
**Body text:** "Preparing your tax computation summary. This takes about 5 seconds."

### 8.3 Dashboard Loading (computation list)

**Loading skeleton:** (3 skeleton card placeholders animate while data loads)
**Loading label (sr-only):** "Loading your saved computations…"

### 8.4 Page-Level Loading

**Generic page loading aria-label:** "Page is loading, please wait."

---

## 9. Empty States

### 9.1 Dashboard — No Saved Computations

**Illustration alt text:** "Empty folder illustration"
**Heading:** "No saved computations yet"
**Body:** "Save a computation to access it again later — useful for comparing year-over-year results or sharing with your CPA."
**CTA:** "Compute your first tax →"

### 9.2 Dashboard — Filtered Results Empty

**Heading:** "No computations match this filter"
**Body:** "Try changing the filter or clearing the search."
**CTA:** "Clear filters"

### 9.3 2307 Entries — No Entries

**Heading:** "No Form 2307 entries added"
**Body:** "If none of your clients withheld tax from your payments this year, you have no 2307 credits to enter."
**Toggle label:** "I have 2307s to add"

### 9.4 Depreciation Assets — No Assets

**Heading:** "No depreciation assets added"
**Body:** "If you have no computers, equipment, or other business assets that you depreciate, skip this section."
**CTA:** "Add an asset"

### 9.5 NOLCO — No Prior-Year Losses

**Heading:** "No prior-year losses entered"
**Body:** "If you had no net operating loss in the past 3 years, leave this section empty."

---

## 10. Error States

### 10.1 Generic Server Error (500)

**Heading:** "Something went wrong"
**Body:** "We encountered an unexpected error. Your inputs have not been lost."
**CTA 1:** "Try again"
**CTA 2:** "Contact support"
**Support link:** "[support@taxklaro.ph](mailto:support@taxklaro.ph)"

### 10.2 Computation Engine Error (422 — invalid inputs)

**Heading:** "Please fix these issues before computing"
**Body:** "Some of your inputs have errors. Please correct the highlighted fields and try again."
**Per-error format:** "⚠ {field_label}: {error_message}"
**Back link:** "← Go back to wizard"

### 10.3 Network Offline Error

**Toast heading:** "No internet connection"
**Toast body:** "Check your network connection and try again."
**Retry button:** "Retry"

### 10.4 Session Expired

**Heading:** "Your session has expired"
**Body:** "For security, we log out inactive accounts after 30 minutes. Please log in again — your computation inputs have been saved in your browser."
**CTA:** "Log in again →"

### 10.5 Save Failed (computation save)

**Toast:** "Could not save computation. Check your connection and try again."
**Retry button:** "Retry save"

### 10.6 PDF Generation Failed

**Toast:** "PDF generation failed. Please try again."
**Retry button:** "Retry"
**Fallback note:** "If this keeps happening, try refreshing the page or [contact support](/contact)."

### 10.7 Share Link Generation Failed

**Toast:** "Could not generate share link. Please try again."

### 10.8 Invalid Shareable Link

**Heading:** "This link is no longer available"
**Body:** "The shared computation link has expired or been deleted. Ask the person who shared it to generate a new link."
**CTA:** "Compute my own tax →"

### 10.9 404 Not Found

(See Section 17 for 404 page copy.)

---

## 11. Toast and Inline Notification Copy

### 11.1 Success Toasts

| Trigger | Toast text |
|---------|-----------|
| Computation saved | "Computation saved successfully." |
| Share link copied | "Link copied to clipboard!" |
| PDF downloaded | "PDF downloaded." |
| Account created | "Account created! Check your email to verify." |
| Password changed | "Password updated successfully." |
| Plan upgraded | "You're now on Pro! Enjoy your new features." |
| Plan cancelled | "Your plan has been cancelled. You have access through {end_date}." |
| Email verified | "Email verified. Welcome to TaxKlaro!" |

### 11.2 Error Toasts

| Trigger | Toast text |
|---------|-----------|
| Generic save failure | "Save failed. Please try again." |
| Generic network error | "Network error. Check your connection." |
| Copy to clipboard failed | "Could not copy link. Please copy it manually from the address bar." |
| PDF failed | "PDF generation failed. Try again." |
| Login failed | "Login failed. Check your credentials." |
| Signup failed | "Account creation failed. Please try again." |

### 11.3 Info Toasts

| Trigger | Toast text |
|---------|-----------|
| Feature gated (Pro required) | "This feature is available on Pro. Upgrade to access it." |
| Computation limit approached (free) | "You've used {count}/10 computations on the free plan this month." |

---

## 12. Premium and Upgrade Prompts

### 12.1 Inline Upgrade Prompts (feature gates)

**PDF Export gate:**
- Heading: "Download PDF — Pro Feature"
- Body: "Export a formatted PDF of your tax computation summary — useful for sharing with your CPA or keeping for your records."
- CTA: "Upgrade to Pro — ₱200/month"
- Secondary: "See what's included in Pro →"
- Dismiss: "Not now"

**Save History gate:**
- Heading: "Save Your Computations — Free Account Required"
- Body: "Create a free account to save your computations and access them from any device."
- CTA: "Create Free Account"
- Secondary: "Log in to existing account →"

**Computation History gate (Pro feature — accessing history beyond last 3):**
- Heading: "Full History — Pro Feature"
- Body: "Access your full computation history. Pro accounts store unlimited computations with year-over-year comparison."
- CTA: "Upgrade to Pro"

**CWT Manager gate (Pro — > 10 Form 2307 entries):**
- Heading: "Pro required for more than 10 Form 2307 entries"
- Body: "You have {count} Form 2307 entries. The free plan supports up to 10. Upgrade to Pro for up to 50 entries."
- CTA: "Upgrade to Pro"

**Batch Processing gate (Professional tier):**
- Heading: "Batch Processing — Professional Feature"
- Body: "Process multiple client returns in a single session. Available on the Professional plan for CPAs and bookkeepers."
- CTA: "See Professional Plan"

**API Access gate (Professional tier):**
- Heading: "API Access — Professional Feature"
- Body: "Integrate TaxKlaro's computation engine into your own software via REST API."
- CTA: "See Professional Plan"

### 12.2 Upgrade Page

**Page title:** "Upgrade Your Plan — TaxKlaro"
**Heading:** "Choose Your Plan"
**Subheading:** "Upgrade anytime. Cancel anytime. All prices in Philippine Pesos."

**Billing toggle labels:** "Monthly", "Annual (save 17%)"

**Free plan card:**
- Name: "Free"
- Price: "₱0"
- Price sub: "forever"
- CTA (current plan): "Current Plan"
- CTA (not current): "Downgrade to Free"

**Pro plan card:**
- Name: "Pro"
- Price (monthly): "₱200 / month"
- Price (annual): "₱1,999 / year"
- Annual savings badge: "Save ₱401/year"
- CTA: "Upgrade to Pro"
- Trial note: "14-day free trial. Cancel before trial ends to pay nothing."

**Professional plan card:**
- Name: "Professional"
- Price (monthly): "₱1,499 / month"
- Price (annual): "₱14,999 / year"
- Annual savings badge: "Save ₱2,989/year"
- CTA: "Upgrade to Professional"
- Trial note: "7-day free trial."

**Guarantee line:** "30-day money-back guarantee on annual plans. No questions asked."

### 12.3 Trial Expiry Notifications

**In-app banner (3 days before trial expiry):**
- Type: Amber
- Text: "Your Pro trial expires in 3 days. Add a payment method to keep your Pro features."
- CTA: "Add payment method"

**In-app banner (day of trial expiry):**
- Type: Orange
- Text: "Your Pro trial expires today. Add a payment method before midnight to avoid losing access."
- CTA: "Upgrade now"

**Post-expiry banner (plan downgraded):**
- Type: Red
- Text: "Your Pro trial has ended. You've been moved to the Free plan. Upgrade to restore Pro features."
- CTA: "Upgrade to Pro"

---

## 13. Dashboard Copy (Saved Computations)

### 13.1 Dashboard Page

**Page title (browser tab):** "My Computations — TaxKlaro"
**Page heading:** "My Computations"
**Subheading:** "All your saved tax computations, organized by year."

**Filter labels:**
- "All years"
- "2025"
- "2024"
- "2023"
- "Earlier"

**Sort labels:**
- "Most recent"
- "Oldest first"
- "Highest tax"
- "Lowest tax"

**Per-computation card:**
- Period badge: "{year} | {period_label}"
- Type badge: "Annual" or "Q{N}"
- Amount heading: "₱{recommended_tax}"
- Sub-label: "Recommended tax due"
- Regime badge: "8% Flat Rate" / "Graduated + OSD" / "Graduated + Itemized"
- Date line: "Computed on {date}"
- CTA: "View Results"
- Secondary CTA: "Delete"

**Delete confirm title:** "Delete this computation?"
**Delete confirm body:** "This will permanently remove your {year} {period} computation. This cannot be undone."
**Delete confirm button:** "Delete"
**Delete cancel button:** "Keep it"
**Delete success toast:** "Computation deleted."

### 13.2 Computation Detail Page

**Page title:** "{year} {period} Computation — TaxKlaro"
**Back link:** "← Back to My Computations"
**Re-run CTA:** "Re-run with new inputs"
**Share CTA:** "Share Results"
**Export CTA:** "Download PDF" (Pro)

---

## 14. Account and Settings Copy

### 14.1 Account Settings Page

**Page title:** "Account Settings — TaxKlaro"
**Page heading:** "Account Settings"

**Section headings:** "Profile", "Security", "Notifications", "Billing & Plan", "Danger Zone"

**Profile section:**
- First name field label: "First name"
- Email field label: "Email address"
- Email change note: "Changing your email will require re-verification."
- Save button: "Save Changes"
- Save success toast: "Profile updated."

**Security section:**
- Change password heading: "Change Password"
- Current password label: "Current password"
- New password label: "New password"
- Confirm new password label: "Confirm new password"
- Save password button: "Update Password"
- Password update success toast: "Password updated."

**Notifications section:**
- "Email me BIR filing deadline reminders" (toggle, default: On)
  - Sub-label: "We'll remind you 7 days before each quarterly and annual deadline."
- "Email me when my quarterly payment is due" (toggle, default: On)
- "Send me product updates and tips" (toggle, default: Off)
- Save button: "Save Notification Preferences"
- Save success toast: "Notification preferences saved."

**Billing section:**
- Current plan label: "Current Plan:"
- Plan name label: "{plan_name} — {price}"
- Next billing date: "Next billing: {date}"
- Change plan CTA: "Change Plan"
- Cancel plan CTA: "Cancel Plan"
- Billing history heading: "Billing History"
- Invoice download label: "Download Receipt"

**Cancel plan confirmation modal:**
- Title: "Cancel your subscription?"
- Body: "You will retain access to Pro features until {end_date}. After that, your account moves to the Free plan. Your saved computations remain accessible."
- Confirm button: "Yes, cancel my subscription"
- Cancel button: "Keep my subscription"
- Post-cancel toast: "Subscription cancelled. Access continues until {end_date}."

**Danger Zone section:**
- Heading: "Danger Zone"
- Delete account CTA: "Delete My Account"
- Delete account modal title: "Permanently delete your account?"
- Delete account modal body: "This will delete all your saved computations, settings, and account data. This action cannot be undone. You will lose all Pro features immediately."
- Delete account confirm button: "Yes, permanently delete my account"
- Delete account cancel button: "No, keep my account"
- Post-delete redirect to: "/" with toast: "Your account has been deleted."

---

## 15. Email Notification Copy

### 15.1 Email: Verify Your Account

**Subject:** "Verify your TaxKlaro account"
**Preview text:** "Click to verify your email and activate your account."
**Heading:** "Verify your email address"
**Body:** "Thanks for signing up! Click the button below to verify your email address and activate your TaxKlaro account."
**CTA button:** "Verify My Email"
**Link expiry note:** "This link expires in 24 hours."
**Footer note:** "If you didn't create a TaxKlaro account, you can safely ignore this email."

### 15.2 Email: Password Reset

**Subject:** "Reset your TaxKlaro password"
**Preview text:** "We received a request to reset your password."
**Heading:** "Reset your password"
**Body:** "We received a request to reset the password for the TaxKlaro account associated with {email}. Click the button below to create a new password."
**CTA button:** "Reset My Password"
**Link expiry note:** "This link expires in 1 hour."
**Footer note:** "If you didn't request a password reset, you can safely ignore this email. Your current password will not change."

### 15.3 Email: Filing Deadline Reminder

**Subject:** "BIR deadline reminder: {return_type} due {deadline_date}"
**Preview text:** "Your {return_type} is due {days_until} days from now."
**Heading:** "Upcoming BIR Filing Deadline"
**Body paragraph 1:** "This is a reminder that your {return_type} is due on {deadline_date} — {days_until} days from now."
**Body paragraph 2 (Form 1701/1701A):** "Your Annual Income Tax Return (Form 1701 or 1701A) covers your full-year income for {tax_year}. The deadline is April 15, {tax_year + 1}."
**Body paragraph 2 (Form 1701Q — Q1):** "Your Q1 Quarterly Income Tax Return (Form 1701Q) covers January 1–March 31, {tax_year}. The deadline is May 15, {tax_year}."
**Body paragraph 2 (Form 1701Q — Q2):** "Your Q2 Quarterly Income Tax Return (Form 1701Q) covers January 1–June 30, {tax_year} (cumulative). The deadline is August 15, {tax_year}."
**Body paragraph 2 (Form 1701Q — Q3):** "Your Q3 Quarterly Income Tax Return (Form 1701Q) covers January 1–September 30, {tax_year} (cumulative). The deadline is November 15, {tax_year}."
**CTA button:** "Compute My Tax Now"
**Footer note:** "You're receiving this because you enabled deadline reminders in your TaxKlaro account settings. [Unsubscribe from reminders](/unsubscribe?type=reminders)."

### 15.4 Email: Welcome (Post-Signup)

**Subject:** "Welcome to TaxKlaro — your account is ready"
**Preview text:** "Start comparing your tax options for free."
**Heading:** "You're in, {first_name}!"
**Body:** "Your TaxKlaro account is set up and ready. You can now compute your income tax, compare all three BIR-allowed methods, and save your results."
**CTA button:** "Compute My Tax Now — Free"
**Feature list heading:** "What you can do right now:"
**Feature 1:** "Compare 8% flat rate vs Graduated method"
**Feature 2:** "Include your Form 2307 creditable withholding tax"
**Feature 3:** "Get a recommendation on which method saves you more"
**Feature 4:** "Share your results with your CPA"
**Upgrade prompt:** "Want PDF exports, computation history, and quarterly tracking? Upgrade to Pro for ₱200/month."
**Upgrade CTA:** "See Pro Features"

### 15.5 Email: Pro Trial Starting

**Subject:** "Your 14-day Pro trial has started"
**Preview text:** "Enjoy Pro features free for 14 days."
**Heading:** "Your Pro trial is active"
**Body:** "Your free 14-day Pro trial has started. Enjoy unlimited computation history, PDF exports, and Form 2307 management at no cost until {trial_end_date}."
**CTA button:** "Explore Pro Features"
**Trial end reminder:** "If you don't add a payment method by {trial_end_date}, your account will automatically move to the Free plan."
**Add payment CTA:** "Add Payment Method"

### 15.6 Email: Payment Receipt

**Subject:** "TaxKlaro receipt for ₱{amount}"
**Preview text:** "Your {plan_name} subscription payment was received."
**Heading:** "Payment Received"
**Body:** "Thank you for your payment of ₱{amount} for your TaxKlaro {plan_name} plan."
**Line item:** "{plan_name} — {billing_period}: ₱{amount}"
**Next billing:** "Next billing date: {next_date}"
**CTA:** "Manage Billing"

---

## 16. Footer and Legal Notice Copy

### 16.1 Disclaimer Banner (shown on all computation results)

**Short disclaimer (1 line, shown inline):** "Computations are for guidance only. Not a substitute for professional tax advice. [Full disclaimer →](/disclaimer)"

**Expanded disclaimer (shown on results page in collapsed/expandable section):**

Section heading: "Important Disclaimer"
Body: "TaxKlaro provides this computation for informational and planning purposes only. The results shown are based on the inputs you provided and are computed using the formulas contained in the National Internal Revenue Code (NIRC) as amended by the TRAIN Law (RA 10963), CREATE Law (RA 11534), and the EOPT Act (RA 11976). While we make every effort to keep the engine accurate and up to date, TaxKlaro makes no representation, warranty, or guarantee that these computations are error-free, complete, or applicable to your specific tax situation. Tax laws change, BIR interpretations evolve, and individual circumstances vary. This tool does not constitute legal or tax advice and does not create a client-adviser relationship. You are solely responsible for verifying these results with a licensed Certified Public Accountant (CPA) or BIR before filing any return or remitting any payment. TaxKlaro shall not be liable for any tax deficiency, interest, penalty, or other consequence arising from reliance on these computations without professional verification."

### 16.2 Footer Disclaimer

**Full text:** "TaxKlaro provides tax computation tools for informational purposes only. Computations do not constitute professional tax advice. Always consult a licensed CPA before filing. TaxKlaro is not affiliated with the Bureau of Internal Revenue (BIR) or the Philippine government. © 2026 TaxKlaro."

---

## 17. 404 and Maintenance Pages

### 17.1 404 Not Found

**Page title:** "Page Not Found — TaxKlaro"
**Heading:** "404 — Page not found"
**Body:** "The page you're looking for doesn't exist or has been moved."
**CTA 1:** "Go to Home →"
**CTA 2:** "Compute my tax →"

### 17.2 Scheduled Maintenance Page

**Page title:** "Down for Maintenance — TaxKlaro"
**Heading:** "We'll be right back"
**Body:** "TaxKlaro is undergoing scheduled maintenance. We expect to be back in {estimated_duration}."
**Status note:** "Check our [status page](https://status.taxklaro.ph) for real-time updates."

### 17.3 Unplanned Outage Page

**Heading:** "Temporarily unavailable"
**Body:** "We're experiencing an issue and working to resolve it as quickly as possible. Your saved computations are safe."
**Status note:** "Check our [status page](https://status.taxklaro.ph) for updates."

---

## 18. Accessibility Labels (ARIA)

### 18.1 Wizard Navigation

| Element | aria-label |
|---------|-----------|
| Progress bar container | "Tax computation wizard progress" |
| Step indicator | "Step {N} of {M}: {step_name}" |
| Back button | "Go back to previous step: {prev_step_name}" |
| Continue button | "Continue to next step: {next_step_name}" |
| Final Continue button | "Submit and see your tax results" |
| Live estimate panel | "Live tax estimate — updates as you enter your income and expenses" |
| Collapsible section (expand) | "Expand {section_name}" |
| Collapsible section (collapse) | "Collapse {section_name}" |

### 18.2 Form Fields

| Element | aria-label format |
|---------|-----------------|
| Peso input field | "{field_label} — enter amount in Philippine Pesos" |
| Peso ₱ prefix | "Philippine Pesos symbol" |
| Help text icon | "Help: {field_label}" |
| Error message | "Error for {field_label}: {error_text}" |
| Required field indicator | "Required field" |
| Advisory card | "{severity} advisory: {title}" |

### 18.3 Results Page

| Element | aria-label |
|---------|-----------|
| Regime comparison table | "Tax regime comparison table showing three computation methods" |
| Recommended badge | "Recommended method — lowest legal tax" |
| Ineligible path indicator | "{path_label}: not eligible — {reason}" |
| Path detail accordion | "Expand details for {path_label}" |
| Savings callout | "You save ₱{amount} by choosing {path_label} instead of the most expensive option" |
| Action bar PDF button | "Download PDF summary of your tax computation" |
| Action bar share button | "Copy shareable link to this computation" |
| Action bar save button | "Save this computation to your account" |

### 18.4 Modal Dialogs

| Modal | aria-labelledby | aria-describedby |
|-------|----------------|-----------------|
| Compensation-only explanation | modal-title | modal-body |
| Pre-submission warning | modal-title | modal-body |
| Upgrade prompt | modal-title | modal-body |
| Delete confirmation | modal-title | modal-body |
| Wizard abandon confirmation | modal-title | modal-body |

**Close button aria-label (all modals):** "Close this dialog"
**Modal overlay aria-label:** "Dialog overlay — click outside to close"

### 18.5 Dynamic Content

| Element | aria-live | aria-atomic |
|---------|-----------|------------|
| Live estimate panel values | polite | false |
| Toast notification container | assertive | true |
| Inline field error | polite | false |
| Advisory card (appears dynamically) | polite | true |
| Page loading indicator | polite | true |

---

*End of frontend/copy.md*
