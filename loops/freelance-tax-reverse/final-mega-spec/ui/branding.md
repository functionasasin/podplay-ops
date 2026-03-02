# Branding — Philippine Freelance & Self-Employed Income Tax Optimizer

This document specifies all brand identity assets and guidelines: product name, logo, favicon, Open Graph images, brand voice, and tone. All values are precise and implementation-ready.

---

## 1. Product Name

### 1.1 Primary Name

**TaxKlaro**

- Pronounced: "tax-KLA-ro"
- "Klaro" is Filipino/Tagalog for "clear" — reflects the product's core value of clarity over confusion
- The name signals both the domain (tax) and the outcome (clarity — knowing which regime saves you money)
- Stylized in product UI as: **TaxKlaro**
- Never styled as: TaxKlARO, Taxklaro, tax klaro, Tax Klaro (two words)

### 1.2 Tagline

**"Know Your Tax. Keep More Money."**

- Used below the logo in the header and on the landing page hero
- Alternative shorter form (favicon alt text, 60-char meta): "Philippine freelance tax regime optimizer"
- Never use generic taglines like "Tax Made Easy" or "File Smarter" — these are taken by competitors

### 1.3 Domain

**taxklaro.ph** (primary, .ph TLD preferred for Philippines credibility)
- Fallback if .ph is unavailable at registration: **taxklaro.com**
- Redirect **taxklaro.net** → **taxklaro.ph** if acquired
- Do NOT use hyphenated domain (tax-klaro.ph) — reserved only for typo redirect

### 1.4 App/Platform Name in Legal Documents

Full legal name for terms of service, privacy policy, and disclaimers:
**"TaxKlaro, a Philippine income tax estimation tool"**

---

## 2. Logo

### 2.1 Logo Concept

The TaxKlaro logo is a **wordmark + icon lockup**. Two forms:

**Full lockup (primary)**: Icon on left, wordmark "TaxKlaro" to the right
**Icon only (compact)**: Used for favicon, app icon, small placements

### 2.2 Icon Design

The icon is a **rounded square** (border-radius = 22.5% of width) containing a stylized **₱ symbol** (Philippine Peso sign).

Exact icon construction:
- Canvas: 40×40px (vector, scales to any size)
- Background: rounded square, fill = `#1D4ED8` (brand-600)
- ₱ symbol: white (`#FFFFFF`), centered, font-weight 700, size = 22px on 40px canvas
- The two horizontal strokes of the ₱ are drawn slightly bolder than a standard peso sign for optical clarity at small sizes (stroke-width = 2.5px on 40px canvas)
- The vertical stem of the ₱ extends 2px below the rounded bottom of the P to create visual distinction from a plain P

SVG icon (canonical source, 40×40):
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
  <rect width="40" height="40" rx="9" ry="9" fill="#1D4ED8"/>
  <text x="20" y="27" font-family="system-ui, -apple-system, sans-serif"
        font-weight="700" font-size="22" fill="#FFFFFF"
        text-anchor="middle" dominant-baseline="auto">₱</text>
</svg>
```

### 2.3 Wordmark

- Font family: **Inter** (Google Fonts, weight 700)
- Color (on white/light background): `#1C1917` (neutral-900)
- Color (on dark/blue background): `#FFFFFF`
- Letter-spacing: -0.02em (tight, modern)
- Size in header: 20px rendered height
- "Tax" portion: `#1C1917` (neutral-900) on light, `#FFFFFF` on dark
- "Klaro" portion: `#1D4ED8` (brand-600) on light, `#BFDBFE` (brand-200) on dark
- The color split happens between the "x" and "K" — "Tax" is neutral, "Klaro" is brand-blue

### 2.4 Full Lockup Dimensions

| Use Case | Icon Size | Gap | Wordmark Size |
|----------|-----------|-----|---------------|
| Desktop header | 28×28px | 8px | 20px |
| Mobile header | 24×24px | 6px | 18px |
| Landing page hero | 40×40px | 12px | 28px |
| Email header | 32×32px | 10px | 22px |
| PDF report header | 36×36px | 10px | 24px |

### 2.5 Clear Space

Minimum clear space around the full lockup = height of the icon on all 4 sides.
Example: In desktop header (icon 28px), minimum 28px clear space on all sides before any other element.

### 2.6 Logo Don'ts

- Do not stretch or distort the icon
- Do not use the icon on a background that makes the white ₱ invisible (e.g., white background — use brand-600 icon fill instead)
- Do not recolor the ₱ symbol
- Do not apply drop shadows or gradients to the icon
- Do not use the wordmark without the icon except in very long header/footer legal text
- Do not use font weights other than 700 for the wordmark

---

## 3. Favicon

### 3.1 Favicon Sizes and Formats

| File | Size | Format | Purpose |
|------|------|--------|---------|
| `/public/favicon.ico` | 16×16, 32×32 multi-size | ICO | Browser tab legacy fallback |
| `/public/favicon-16x16.png` | 16×16 | PNG | Small browser tabs |
| `/public/favicon-32x32.png` | 32×32 | PNG | Standard browser tab |
| `/public/apple-touch-icon.png` | 180×180 | PNG | iOS home screen icon |
| `/public/android-chrome-192x192.png` | 192×192 | PNG | Android home screen |
| `/public/android-chrome-512x512.png` | 512×512 | PNG | Android splash screen |
| `/public/site.webmanifest` | — | JSON | PWA manifest |

### 3.2 Favicon Design

All favicon variants use the icon-only form (rounded square + ₱ symbol, as per Section 2.2).

At 16×16 and 32×32:
- The ₱ symbol is rendered at maximum legible size: 11px on 16px canvas, 22px on 32px canvas
- border-radius on the rounded square = floor(canvas_width × 0.225)

At 180×180 (Apple touch):
- Add 10px padding inside the blue rounded square so the ₱ is not edge-to-edge
- border-radius = 40px (matches iOS squircle appearance when composited by OS)

At 192×192 and 512×512 (Android):
- Full-bleed blue background (no rounded square — Android OS applies its own masking)
- ₱ symbol centered, white, weight 700

### 3.3 site.webmanifest

```json
{
  "name": "TaxKlaro — Philippine Income Tax Optimizer",
  "short_name": "TaxKlaro",
  "icons": [
    {
      "src": "/android-chrome-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/android-chrome-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "theme_color": "#1D4ED8",
  "background_color": "#EFF6FF",
  "display": "standalone",
  "start_url": "/",
  "scope": "/"
}
```

### 3.4 HTML Head Meta Tags for Favicon

```html
<link rel="icon" type="image/x-icon" href="/favicon.ico" />
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
<link rel="manifest" href="/site.webmanifest" />
<meta name="theme-color" content="#1D4ED8" />
<meta name="msapplication-TileColor" content="#1D4ED8" />
```

---

## 4. Open Graph Images

### 4.1 Default OG Image (used by homepage and any page without a specific OG image)

**File**: `/public/og/og-default.png`
**Dimensions**: 1200×630px (standard OG image ratio)

**Layout description**:
- Background: `#1D4ED8` (brand-600) — full bleed solid blue
- Upper-left area (40px from top-left): TaxKlaro logo lockup (icon 48px + wordmark 34px, both white)
- Center vertical third: Large white headline text
  - Line 1: "Know Which Tax Regime" — font Inter 700, 52px, white, letter-spacing -0.02em
  - Line 2: "Saves You The Most" — same style
- Below headline (16px gap): Subtext "Compute 8%, OSD, and Itemized in 30 seconds. Free." — font Inter 400, 22px, `#BFDBFE` (brand-200)
- Lower right (40px from bottom-right): Small text "taxklaro.ph" — font Inter 500, 18px, `#93C5FD` (brand-400)
- No drop shadows, no gradients, no decorative elements — clean flat design

**Facebook OG meta tag**:
```html
<meta property="og:image" content="https://taxklaro.ph/og/og-default.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="TaxKlaro — Philippine income tax regime optimizer. Compute 8%, OSD, and itemized deductions in 30 seconds." />
```

### 4.2 Results Page OG Image (generated dynamically for shareable results)

**File**: Generated at runtime as `/api/og/results?gross=AMOUNT&regime=PATH_C&savings=AMOUNT`
**Dimensions**: 1200×630px

**Layout**:
- Background: `#EFF6FF` (brand-50, light blue)
- Header bar (top 80px, full width): `#1D4ED8` solid fill — contains TaxKlaro logo in white (32px icon + 22px wordmark)
- Main content area (below header):
  - Left 55% (white card, 24px border-radius, 40px inset from edges):
    - Caption text "Your Optimal Tax Regime" — Inter 500, 14px, `#57534E` (neutral-600)
    - Regime name badge (dynamically set):
      - Path C: "8% Flat Rate" badge — `#DCFCE7` bg, `#15803D` text, `#22C55E` border
      - Path B: "Graduated + OSD" badge — `#FEF3C7` bg, `#B45309` text, `#F59E0B` border
      - Path A: "Graduated + Itemized" badge — `#E0F2FE` bg, `#0369A1` text, `#0EA5E9` border
    - Large tax due amount: "₱XX,XXX" — Inter 800, 56px, neutral-900
    - Sub-line: "Annual Tax Due on ₱X,XXX,XXX Gross Receipts" — Inter 400, 18px, neutral-600
    - Savings line (if applicable): "vs. Next Best: Save ₱XX,XXX/year" — Inter 600, 20px, success-600
  - Right 45% (neutral-50 bg): vertical list of 3 regime comparison rows
    - Each row: regime label (14px, neutral-700) | tax amount (18px, neutral-900, bold)
    - Winning regime row has a green checkmark circle (16px, success-500) prefix
    - Losing regime rows have an "×" (14px, neutral-400) prefix
- Footer strip (bottom 56px, full width): `#1E3A8A` (brand-800) — "Compute your own at taxklaro.ph" — Inter 400, 16px, white, centered

**Dynamic generation**: Use `@vercel/og` (or `satori` library) to generate PNG at runtime. The route `/api/og/results` accepts query params: `gross` (number, pesos), `regime` (string: PATH_A/PATH_B/PATH_C), `tax_due` (number, pesos), `savings` (number, pesos), `path_a_tax` (number), `path_b_tax` (number), `path_c_tax` (number, or -1 if ineligible).

### 4.3 Blog Post OG Image Template

**File**: `/public/og/og-blog-template.png` (static template; individual posts have titles overlaid)
**Dimensions**: 1200×630px

**Layout**:
- Background: `#1C1917` (neutral-900, dark)
- Left decorative stripe (8px wide, full height): `#1D4ED8` (brand-600)
- Upper-left (48px from top-left, after stripe): TaxKlaro logo in white (32px icon + 22px wordmark)
- Center-left (after stripe, vertically centered): Blog post title text area — Inter 700, 44px, white, max-width 760px, up to 2 lines
- Below title (16px gap): "TaxKlaro Blog" label — Inter 400, 18px, `#93C5FD` (brand-400)
- Lower-right: Category chip — rounded pill, `#1D4ED8` bg, white text, Inter 500, 14px (e.g., "Tax Guides 2026")
- Dynamically generated per post with `@vercel/og`; title is the only variable field

### 4.4 Twitter/X Card Meta Tags

```html
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:site" content="@taxklaro" />
<meta name="twitter:title" content="TaxKlaro — Philippine Income Tax Regime Optimizer" />
<meta name="twitter:description" content="Compute your income tax under all 3 BIR-allowed regimes: 8% flat rate, graduated + OSD, and graduated + itemized. Know which saves you the most. Free." />
<meta name="twitter:image" content="https://taxklaro.ph/og/og-default.png" />
<meta name="twitter:image:alt" content="TaxKlaro regime comparison results showing optimal tax path for Philippine freelancers" />
```

---

## 5. Brand Voice and Tone

### 5.1 Core Personality Attributes

| Attribute | What It Means in Practice |
|-----------|--------------------------|
| **Confident, not arrogant** | State facts and numbers directly. "8% is cheaper for 94% of freelancers below ₱3M." Not: "We believe 8% might be the better option in many cases." |
| **Friendly, not casual** | Explain complex tax rules in plain language but never use slang or overly informal language that would embarrass a professional. |
| **Filipino, not generic** | Reference Filipino freelancer reality: Upwork, DOLE registration, BIR RDO, ₱250K exemption. Do not write as if the user is American or generic "global." |
| **Anti-jargon by default** | Write "your remaining tax balance after subtracting the amounts your clients withheld" not "your net tax due after CWT offset." Use jargon in tooltips (not primary text) and always pair it with a plain-language definition. |
| **Precise, not vague** | Give exact numbers. "The 8% rate applies to gross receipts up to ₱3,000,000 per year" not "the 8% rate has an income limit." |
| **Empowering, not scary** | Tax compliance is achievable and understandable. The tool removes anxiety, not increases it. Error messages explain the fix, not just the problem. |
| **Honest, not promotional** | If the tool cannot determine the best regime for a user's situation, say so clearly. Never oversell accuracy for edge cases. |

### 5.2 Vocabulary Rules

**Always say → Instead of**

| Say This | Not This |
|----------|----------|
| "gross receipts" | "income" (too vague), "revenue" (American), "earnings" |
| "tax due" | "tax liability" (jargon), "taxes owed" |
| "BIR" | "the Bureau of Internal Revenue" on first reference, then BIR |
| "regime" (on second reference) | "method" or "scheme" (confusing) |
| "quarterly return" | "Q-tax" (informal) |
| "Form 1701" (not hyperlinked BIR form numbers) | "your annual income tax return" as the main label |
| "withholding certificate (Form 2307)" | "2307" alone (first reference must include full name) |
| "creditable withholding tax" | "pre-paid tax" (acceptable informal paraphrase in non-technical contexts) |
| "percentage tax (3%)" | "business tax" (used informally but incorrect in legal context) |
| "tax year" or "taxable year" | "fiscal year" (unless the user is on a fiscal year, which 99%+ are not) |

### 5.3 Error Message Tone

All error messages follow the pattern: **What happened + Why it matters + How to fix it**.

- **Tone**: Calm, specific, actionable. Never accusatory.
- **Example (good)**: "Your gross receipts (₱3,200,000) exceed the ₱3,000,000 limit for the 8% flat rate. Only the Graduated + OSD and Graduated + Itemized Deductions regimes are available to you."
- **Example (bad)**: "Invalid input: 8% option unavailable."
- Error messages never use exclamation points.
- Warnings may end with a suggestion: "Consider consulting a CPA to verify your deduction documentation."

### 5.4 Success/Confirmation Message Tone

- Lead with the outcome for the user, not the system state.
- **Example (good)**: "Your optimal regime is the 8% Flat Rate — you'd pay ₱112,000 in annual income tax, saving ₱34,500 vs. the next best option."
- **Example (bad)**: "Computation complete. Result: PATH_C. Tax due: 112000."

### 5.5 Loading/Processing Messages

- Use present continuous tense: "Computing your tax under all three regimes…"
- Keep under 8 words on the loading spinner
- Never use "Please wait" alone — always describe what is happening

### 5.6 Empty State Messages

| Screen | Empty State Copy |
|--------|-----------------|
| Saved computations (no saved yet) | "You haven't saved any computations yet. Run the calculator and tap 'Save' to track your tax across time." |
| CWT entries (no 2307s entered) | "No withholding certificates added. If your clients give you BIR Form 2307, enter them here to reduce your tax due." |
| Quarterly tracker (no quarters recorded) | "No quarterly payments on record. Add your Q1 return to begin tracking your cumulative tax year." |
| Blog (no results for search) | "No articles found for that search. Try 'freelance tax', '8% option', or 'quarterly filing'." |

### 5.7 Micro-copy Examples

| Context | Copy |
|---------|------|
| Tooltip for "Gross Receipts" | "Total amount you received from clients before any deductions. Include all payments regardless of whether your client gave you a Form 2307." |
| Tooltip for "8% Flat Rate" | "An optional simplified tax rate available if your gross receipts for the year do not exceed ₱3,000,000. Elected in your Q1 return and irrevocable for the rest of the year." |
| Tooltip for "OSD (Optional Standard Deduction)" | "A flat 40% deduction from your gross receipts. You don't need receipts or documentation — just multiply your gross by 40% and subtract. Available only under the Graduated regime." |
| Tooltip for "Form 2307" | "The certificate your client gives you after withholding tax from your payment. The amounts on your 2307s are pre-paid taxes you can subtract from your tax due." |
| Tooltip for "Annual Reconciliation" | "After your three quarterly returns, the annual return (Form 1701 or 1701A) tallies everything up. If you overpaid quarterly, you get a refund. If underpaid, you pay the difference." |
| Help text below regime result | "This result is based on the information you entered. Keep your receipts and 2307s — the BIR may verify your actual figures. See our disclaimers." |
| CTA below "Save" button (free tier) | "Free accounts store your last 3 computations. Upgrade to Pro to keep unlimited history." |

---

## 6. Brand Photography and Illustration Guidelines

### 6.1 Photography Style

Since the product is a web tool, photography appears only on the landing page and blog.

**Style**:
- Authentic Filipino context: metro Manila co-working spaces, Filipinos working on laptops in coffee shops, BIR RDO building exterior (for government authority imagery), professional headshots of Filipino freelancers
- No stock photography that shows obviously non-Filipino subjects or generic Western offices
- No staged "success" photos with people throwing papers in the air or laughing at screens
- Color grading: slightly warm, natural daylight, no heavy filters

**Approved subjects**:
- Filipino freelancer or professional working on a laptop with natural lighting
- Close-up of BIR tax form being filled out (physical form, pen in hand)
- Close-up of Form 2307 certificate
- Calculator on a desk next to tax documents (establishing context shot)
- Person reviewing results on mobile phone screen

**Prohibited subjects**:
- Wads of cash or coins (appears exploitative)
- Person looking worried or stressed about tax (brand is empowering, not anxiety-inducing)
- Unrecognizable or generic stock imagery

### 6.2 Illustration Style

For product UI: No illustrations in the primary interface. Data is the visual.

For blog posts and empty states: Flat-style line illustrations with brand-blue palette.
- Stroke weight: 2px
- Colors: brand-600 (`#1D4ED8`), neutral-300 (`#D6D3D1`), white
- No gradients in illustrations
- No 3D effects
- Corner radius on all shapes: 4px (consistent with UI component rounding)

---

## 7. Brand Assets File Manifest

All brand asset files live in `/public/brand/` in the repository.

| File | Description | Format |
|------|-------------|--------|
| `/public/brand/logo-icon.svg` | Icon-only SVG (40×40 viewBox) | SVG |
| `/public/brand/logo-lockup-light.svg` | Full lockup for light backgrounds | SVG |
| `/public/brand/logo-lockup-dark.svg` | Full lockup for dark/blue backgrounds | SVG |
| `/public/brand/logo-lockup-light.png` | PNG export @2x (280×56px) | PNG |
| `/public/brand/logo-lockup-dark.png` | PNG export @2x (280×56px) | PNG |
| `/public/favicon.ico` | Multi-size favicon | ICO |
| `/public/favicon-16x16.png` | 16px favicon | PNG |
| `/public/favicon-32x32.png` | 32px favicon | PNG |
| `/public/apple-touch-icon.png` | 180px iOS icon | PNG |
| `/public/android-chrome-192x192.png` | 192px Android icon | PNG |
| `/public/android-chrome-512x512.png` | 512px Android splash | PNG |
| `/public/site.webmanifest` | PWA manifest | JSON |
| `/public/og/og-default.png` | Default OG image | PNG |
| `/public/og/og-blog-template.png` | Blog OG template | PNG |
| `/public/brand/brand-guidelines.pdf` | This document as PDF for external vendors | PDF |

---

## 8. Social Media Handles

| Platform | Handle | Notes |
|----------|--------|-------|
| Twitter/X | `@taxklaro` | Register at launch |
| Facebook Page | `facebook.com/taxklaro` | Required for FB Ads for PH audience targeting |
| LinkedIn | `linkedin.com/company/taxklaro` | B2B/CPA audience outreach |
| YouTube | `youtube.com/@taxklaro` | For tutorial videos on quarterly filing |
| TikTok | `@taxklaro` | For short-form Filipino freelancer content (optional, post-launch) |

---

## 9. Cross-References

- Colors referenced here come from: [design-system.md](./design-system.md) — Sections 1.1–1.6
- Typography (Inter font) details: [design-system.md](./design-system.md) — Section 2
- Favicon HTML tags belong in: [deployment/environment.md](../deployment/environment.md) — HTML head template
- OG image generation API endpoint: [api/endpoints.md](../api/endpoints.md) — `/api/og/results`
- Brand voice for landing page copy: [seo-and-growth/landing-page.md](../seo-and-growth/landing-page.md)
- Legal disclaimers referenced in Section 5.7 tooltip: [legal/disclaimers.md](../legal/disclaimers.md)
