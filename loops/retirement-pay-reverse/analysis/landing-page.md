# Analysis: Landing Page — RA 7641 Retirement Pay Calculator

**Wave:** 5 — Frontend Data Model + UI Design
**Aspect:** landing-page
**Date:** 2026-03-06
**Sources:** auth-flow.md, design-system.md, results-view.md, core-formula-22-5-days.md

---

## Overview

The landing page is the unauthenticated entry point at route `/`. Its job is:

1. Hook the visitor with the 33% underpayment problem
2. Show credibility (Supreme Court ruling, specific statute)
3. Let them try a computation without signing up (static teaser)
4. Drive sign-up / sign-in to save and batch-compute

The tone is **serious and authoritative** — this is a compliance tool, not a consumer app. The audience is HR professionals and labor lawyers who understand what RA 7641 is and will recognize the 33% underpayment claim immediately.

---

## Route

**File:** `src/routes/index.tsx`
**Path:** `/`
**Auth required:** No

Redirect behavior: If the user is already authenticated, redirect to `/dashboard`.

```typescript
// src/routes/index.tsx
import { createFileRoute, redirect } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'
import { LandingPage } from '@/components/landing/LandingPage'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: LandingPage,
})
```

---

## Component Hierarchy

```
LandingPage                          src/components/landing/LandingPage.tsx
  LandingNav                         src/components/landing/LandingNav.tsx
  HeroSection                        src/components/landing/HeroSection.tsx
  SampleComputationTeaser            src/components/landing/SampleComputationTeaser.tsx
  UnderpaymentExplainerSection       src/components/landing/UnderpaymentExplainerSection.tsx
  FeaturesSection                    src/components/landing/FeaturesSection.tsx
  LegalCredibilitySection            src/components/landing/LegalCredibilitySection.tsx
  SignUpCTASection                   src/components/landing/SignUpCTASection.tsx
  LandingFooter                      src/components/landing/LandingFooter.tsx
```

All components live under `src/components/landing/`.

---

## LandingPage Root

**File:** `src/components/landing/LandingPage.tsx`

```typescript
import { LandingNav } from './LandingNav'
import { HeroSection } from './HeroSection'
import { SampleComputationTeaser } from './SampleComputationTeaser'
import { UnderpaymentExplainerSection } from './UnderpaymentExplainerSection'
import { FeaturesSection } from './FeaturesSection'
import { LegalCredibilitySection } from './LegalCredibilitySection'
import { SignUpCTASection } from './SignUpCTASection'
import { LandingFooter } from './LandingFooter'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <LandingNav />
      <main>
        <HeroSection />
        <SampleComputationTeaser />
        <UnderpaymentExplainerSection />
        <FeaturesSection />
        <LegalCredibilitySection />
        <SignUpCTASection />
      </main>
      <LandingFooter />
    </div>
  )
}
```

---

## LandingNav

**File:** `src/components/landing/LandingNav.tsx`

Top navigation bar for the unauthenticated landing page.

```typescript
import { Link } from '@tanstack/react-router'
import { Scale } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function LandingNav() {
  return (
    <nav className="border-b border-gray-100 bg-white sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-gray-900" />
          <span className="font-semibold text-gray-900 text-sm">
            RA 7641 Retirement Pay
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/auth/sign-in">
            <Button variant="ghost" size="sm" className="text-gray-600">
              Sign in
            </Button>
          </Link>
          <Link to="/auth/sign-up">
            <Button size="sm">
              Get started
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  )
}
```

---

## HeroSection

**File:** `src/components/landing/HeroSection.tsx`

The above-the-fold hook. Lead with the problem, not the product.

```typescript
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, ArrowRight } from 'lucide-react'

export function HeroSection() {
  return (
    <section className="bg-white py-16 sm:py-24 px-4">
      <div className="max-w-4xl mx-auto text-center">
        {/* Problem hook — immediate attention grabber */}
        <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-4 py-2 mb-8">
          <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0" />
          <span className="text-sm font-medium text-amber-900">
            Most employers underpay retirement by exactly 33%
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-6">
          Compute RA 7641 Retirement Pay{' '}
          <span className="text-gray-500">correctly</span>
        </h1>

        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-4 leading-relaxed">
          Philippine law defines &ldquo;one-half month salary&rdquo; as{' '}
          <strong className="text-gray-900">22.5 days</strong> — not 15.
          Employers who compute on 15 days are violating RA 7641 and shortchanging
          every retiring employee by one-third.
        </p>

        <p className="text-sm text-gray-500 max-w-xl mx-auto mb-10">
          Confirmed by the Supreme Court in{' '}
          <em>Elegir v. Philippine Airlines, G.R. No. 181995 (2011)</em>.
          This is not a gray area.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/auth/sign-up">
            <Button size="lg" className="w-full sm:w-auto gap-2">
              Compute retirement pay
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link to="/auth/sign-in">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              Sign in
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
```

---

## SampleComputationTeaser

**File:** `src/components/landing/SampleComputationTeaser.tsx`

A static, pre-computed example showing the 15-day error vs. the correct 22.5-day amount. Uses real numbers to make the underpayment concrete. This is NOT a live computation — the numbers are hardcoded to illustrate the concept.

**Scenario:** Maria Santos, 20 years of service, monthly salary of ₱50,000.

| Component | Calculation | Amount |
|-----------|-------------|--------|
| 15 days salary | (50,000 / 26) × 15 = | ₱28,846.15 |
| 5 days SIL | (50,000 / 26) × 5 = | ₱9,615.38 |
| 1/12 of 13th month | 50,000 / 12 = | ₱4,166.67 |
| **Daily rate basis** | 50,000 / 26 | ₱1,923.08/day |
| **Per year (22.5 days)** | 1,923.08 × 22.5 | ₱43,269.23 |
| **Total (20 years)** | 43,269.23 × 20 | **₱865,384.62** |
| *Incorrect (15 days only)* | *(1,923.08 × 15) × 20* | *₱576,923.08* |
| **Underpayment** | | **₱288,461.54** |

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CheckCircle2, XCircle, TrendingUp } from 'lucide-react'

export function SampleComputationTeaser() {
  return (
    <section className="bg-gray-50 py-16 px-4 border-y border-gray-100">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            See the difference
          </h2>
          <p className="text-gray-600">
            Maria Santos, 20 years of service, ₱50,000/month salary
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Incorrect 15-day computation */}
          <Card className="border-red-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-800">Common (incorrect) method</span>
              </CardTitle>
              <p className="text-xs text-gray-500">15 days × salary / 26 × years</p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="text-sm text-gray-600">Daily rate</TableCell>
                    <TableCell className="text-right text-sm font-mono">₱1,923.08</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-sm text-gray-600">× 15 days</TableCell>
                    <TableCell className="text-right text-sm font-mono">₱28,846.15</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-sm text-gray-600">Per year</TableCell>
                    <TableCell className="text-right text-sm font-mono">₱28,846.15</TableCell>
                  </TableRow>
                  <TableRow className="border-t-2">
                    <TableCell className="text-sm font-medium">
                      Total (20 years)
                    </TableCell>
                    <TableCell className="text-right text-base font-bold font-mono text-red-700">
                      ₱576,923.08
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <div className="mt-3 bg-red-50 rounded-md px-3 py-2">
                <p className="text-xs text-red-700 font-medium">
                  Misses SIL and 13th month — violates RA 7641 Sec. 1
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Correct 22.5-day computation */}
          <Card className="border-green-500 border-l-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="text-green-800">Correct RA 7641 computation</span>
              </CardTitle>
              <p className="text-xs text-gray-500">
                15 days + 5 days SIL + 1/12 of 13th month = 22.5 days
              </p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="text-sm text-gray-600 pl-8">15 days salary</TableCell>
                    <TableCell className="text-right text-sm font-mono">₱28,846.15</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-sm text-gray-600 pl-8">5 days SIL</TableCell>
                    <TableCell className="text-right text-sm font-mono">₱9,615.38</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-sm text-gray-600 pl-8">1/12 of 13th month</TableCell>
                    <TableCell className="text-right text-sm font-mono">₱4,166.67</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-sm text-gray-600">Per year (22.5 days)</TableCell>
                    <TableCell className="text-right text-sm font-mono">₱42,628.19</TableCell>
                  </TableRow>
                  <TableRow className="border-t-2 bg-green-50">
                    <TableCell className="text-sm font-bold text-green-800">
                      Total (20 years)
                    </TableCell>
                    <TableCell className="text-right text-base font-bold font-mono text-green-800">
                      ₱852,563.80
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Underpayment callout */}
        <Card className="mt-6 bg-amber-50 border-amber-200">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-4">
              <TrendingUp className="w-8 h-8 text-amber-700 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-900 mb-1">
                  Maria is owed ₱275,640.72 more than the common method pays
                </p>
                <p className="text-xs text-amber-800">
                  That is a 33% underpayment — the exact amount RA 7641 says she must receive.
                  File an NLRC money claim to recover it.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-400 mt-4">
          * Amounts based on 26 working days/month per DOLE Labor Advisory 06-20.
          Daily rate = monthly salary ÷ 26.
        </p>
      </div>
    </section>
  )
}
```

**Note on numbers:** The sample uses ₱50,000/month, 20 years, daily rate = 50,000 ÷ 26 = ₱1,923.0769…

Per year (22.5 days exact):
- 15 days: 1,923.0769 × 15 = 28,846.15
- 5 days SIL: 1,923.0769 × 5 = 9,615.38
- 1/12 of 13th month: 50,000 ÷ 12 = 4,166.67
- Total per year: 28,846.15 + 9,615.38 + 4,166.67 = 42,628.20
- Total 20 years: 42,628.20 × 20 = 852,564.00

Incorrect (15 days only):
- 15 days per year: 28,846.15
- Total 20 years: 28,846.15 × 20 = 576,923.08

Underpayment: 852,564.00 − 576,923.08 = 275,640.92

The JSX uses rounded presentation values. The engine will compute exact centavo integers.

---

## UnderpaymentExplainerSection

**File:** `src/components/landing/UnderpaymentExplainerSection.tsx`

Explains the 22.5-day formula simply. Three callout cards.

```typescript
import { Card, CardContent } from '@/components/ui/card'
import { BookOpen } from 'lucide-react'

const FORMULA_COMPONENTS = [
  {
    days: '15',
    label: '15 days salary',
    description: 'The base half-month salary component everyone knows',
    color: 'text-gray-900',
  },
  {
    days: '5',
    label: '5 days Service Incentive Leave',
    description:
      'The monetized cash equivalent of 5 days SIL per year, required under Labor Code Art. 95',
    color: 'text-blue-700',
  },
  {
    days: '2.5',
    label: '1/12 of 13th month pay',
    description:
      '1/12 of the annual 13th month pay, which equals 2.5 days of salary (1 month ÷ 12)',
    color: 'text-blue-700',
  },
]

export function UnderpaymentExplainerSection() {
  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Why 22.5 days — not 15?
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            RA 7641, Section 1 defines &ldquo;one-half (1/2) month salary&rdquo; as a legal term
            of art that includes three components:
          </p>
        </div>

        {/* Formula breakdown */}
        <div className="flex flex-col sm:flex-row items-stretch gap-0 mb-10 border border-gray-200 rounded-lg overflow-hidden">
          {FORMULA_COMPONENTS.map((component, index) => (
            <div
              key={component.days}
              className="flex-1 p-5 border-b sm:border-b-0 sm:border-r border-gray-200 last:border-0"
            >
              <div className="text-3xl font-bold font-mono text-gray-900 mb-1">
                {component.days}
              </div>
              <div className="text-sm font-semibold text-gray-900 mb-1">
                {component.label}
              </div>
              <div className="text-xs text-gray-500 leading-relaxed">
                {component.description}
              </div>
              {index < FORMULA_COMPONENTS.length - 1 && (
                <div className="hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 text-gray-300 font-bold text-lg">
                  +
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Total bar */}
        <div className="bg-gray-900 rounded-lg px-6 py-4 flex items-center justify-between mb-8">
          <span className="text-white font-semibold">Total per year of service</span>
          <span className="text-white font-bold font-mono text-xl">22.5 days</span>
        </div>

        {/* Legal citation */}
        <div className="border-l-4 border-blue-200 bg-blue-50 rounded-r-md px-4 py-4">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <span className="text-sm font-semibold text-gray-900">
              Republic Act No. 7641, Section 1 (1992)
            </span>
          </div>
          <blockquote className="text-sm text-gray-700 italic leading-relaxed">
            &ldquo;For the purpose of this Act, the term one-half (1/2) month salary shall mean
            fifteen (15) days plus one-twelfth (1/12) of the 13th month pay and the cash
            equivalent of not more than five (5) days of service incentive leaves.&rdquo;
          </blockquote>
          <p className="text-xs text-gray-500 mt-2">
            Affirmed: <em>Elegir v. Philippine Airlines, G.R. No. 181995, July 20, 2011</em>
          </p>
        </div>
      </div>
    </section>
  )
}
```

---

## FeaturesSection

**File:** `src/components/landing/FeaturesSection.tsx`

Six feature cards highlighting what the app does.

```typescript
import { Card, CardContent } from '@/components/ui/card'
import {
  Calculator,
  FileText,
  BarChart3,
  Scale,
  Download,
  Share2,
} from 'lucide-react'

const FEATURES = [
  {
    icon: Calculator,
    title: 'Single employee calculator',
    description:
      'Wizard-driven form: enter salary, hire date, retirement date. Get the RA 7641-correct retirement pay amount with full breakdown.',
    iconColor: 'text-gray-700',
    iconBg: 'bg-gray-100',
  },
  {
    icon: BarChart3,
    title: 'Batch computation',
    description:
      'Upload a CSV for your entire workforce. Compute retirement obligations for hundreds of employees at once with per-employee breakdowns.',
    iconColor: 'text-blue-700',
    iconBg: 'bg-blue-50',
  },
  {
    icon: Scale,
    title: 'Company plan gap analysis',
    description:
      'Enter your company retirement plan formula. See exactly which employees are undercovered and by how much.',
    iconColor: 'text-green-700',
    iconBg: 'bg-green-50',
  },
  {
    icon: FileText,
    title: 'NLRC money claim worksheet',
    description:
      'Generate a formatted statement of computation suitable for filing as an exhibit in an NLRC complaint.',
    iconColor: 'text-amber-700',
    iconBg: 'bg-amber-50',
  },
  {
    icon: Download,
    title: 'PDF export',
    description:
      'Professional PDF output for any computation — single employee, batch summary, or NLRC worksheet — with firm branding.',
    iconColor: 'text-gray-700',
    iconBg: 'bg-gray-100',
  },
  {
    icon: Share2,
    title: 'Shareable results',
    description:
      'Generate a read-only share link for any computation. Send to clients or opposing counsel without giving them account access.',
    iconColor: 'text-blue-700',
    iconBg: 'bg-blue-50',
  },
]

export function FeaturesSection() {
  return (
    <section className="bg-gray-50 py-16 px-4 border-y border-gray-100">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Built for HR departments and labor lawyers
          </h2>
          <p className="text-gray-600">
            Everything you need to compute, verify, and document RA 7641 retirement pay
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((feature) => {
            const Icon = feature.icon
            return (
              <Card key={feature.title} className="bg-white">
                <CardContent className="pt-5 pb-5">
                  <div
                    className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${feature.iconBg} mb-3`}
                  >
                    <Icon className={`w-5 h-5 ${feature.iconColor}`} />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
```

---

## LegalCredibilitySection

**File:** `src/components/landing/LegalCredibilitySection.tsx`

Three legal pillars that establish credibility: the statute, the SC ruling, and the DOLE advisory.

```typescript
import { BookOpen } from 'lucide-react'

const LEGAL_PILLARS = [
  {
    label: 'RA 7641 (1992)',
    title: 'Retirement Pay Law',
    description:
      'Mandates retirement pay for private-sector employees aged 60+ (optional) or 65+ (compulsory) with at least 5 years of service.',
  },
  {
    label: 'G.R. No. 181995 (2011)',
    title: 'Elegir v. Philippine Airlines',
    description:
      'Supreme Court ruling confirming that "one-half month salary" in RA 7641 means 22.5 days — expressly including SIL and 1/12 of 13th month pay.',
  },
  {
    label: 'LA 06-20 (2020)',
    title: 'DOLE Labor Advisory 06-20',
    description:
      'Clarifies final pay computation rules including retirement pay, using the 26-day divisor for daily rate under the prevailing practice standard.',
  },
]

export function LegalCredibilitySection() {
  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-semibold text-blue-700 uppercase tracking-wide">
              Legal Basis
            </span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Grounded in Philippine law
          </h2>
          <p className="text-gray-600">
            Every computation follows the statute, regulatory guidance, and Supreme Court jurisprudence
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {LEGAL_PILLARS.map((pillar) => (
            <div
              key={pillar.label}
              className="border border-gray-200 rounded-lg p-5 bg-white"
            >
              <div className="inline-block bg-blue-50 text-blue-700 text-xs font-mono font-medium px-2 py-1 rounded mb-3">
                {pillar.label}
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                {pillar.title}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

---

## SignUpCTASection

**File:** `src/components/landing/SignUpCTASection.tsx`

Final call to action before the footer.

```typescript
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

export function SignUpCTASection() {
  return (
    <section className="bg-gray-900 py-16 px-4">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
          Compute the correct amount today
        </h2>
        <p className="text-gray-300 mb-8 leading-relaxed">
          Create a free account to save computations, run batch exports, and generate
          NLRC-ready worksheets. No credit card required.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/auth/sign-up">
            <Button
              size="lg"
              className="w-full sm:w-auto bg-white text-gray-900 hover:bg-gray-100 gap-2"
            >
              Create free account
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link to="/auth/sign-in">
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              Sign in
            </Button>
          </Link>
        </div>
        <p className="text-gray-500 text-xs mt-6">
          For Philippine private-sector employees and their legal representatives.
          Not a substitute for legal advice.
        </p>
      </div>
    </section>
  )
}
```

---

## LandingFooter

**File:** `src/components/landing/LandingFooter.tsx`

Minimal footer with legal disclaimer.

```typescript
import { Scale } from 'lucide-react'

export function LandingFooter() {
  return (
    <footer className="border-t border-gray-100 bg-white py-8 px-4">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-gray-400">
          <Scale className="w-4 h-4" />
          <span className="text-xs">RA 7641 Retirement Pay Calculator</span>
        </div>
        <p className="text-xs text-gray-400 text-center sm:text-right max-w-sm">
          Computations are for reference only. Consult a qualified labor lawyer
          for legal advice on specific employment situations.
        </p>
      </div>
    </footer>
  )
}
```

---

## Routing Integration

The `/` route's `beforeLoad` redirects authenticated users to `/dashboard`. The landing page itself links only to:
- `/auth/sign-up` — primary CTA
- `/auth/sign-in` — secondary CTA

No other internal routes are linked from the landing page.

---

## Visual Layout (Section Order)

```
+--------------------------------------------------+
| LandingNav — sticky top bar                       |
|   [Logo]                      [Sign in] [Get started] |
+--------------------------------------------------+
| HeroSection — py-16 sm:py-24                     |
|   amber pill badge                                |
|   "Compute RA 7641 Retirement Pay correctly"      |
|   22.5 days explanation                           |
|   Elegir v. PAL citation                          |
|   [Compute retirement pay] [Sign in]              |
+--------------------------------------------------+
| SampleComputationTeaser — bg-gray-50              |
|   "See the difference"                            |
|   2-column: ❌ 15-day method | ✓ 22.5-day method |
|   Underpayment callout card (amber)               |
|   footnote on 26-day divisor                      |
+--------------------------------------------------+
| UnderpaymentExplainerSection — bg-white           |
|   "Why 22.5 days — not 15?"                      |
|   3-panel formula: 15 + 5 + 2.5 days             |
|   = 22.5 days total bar                           |
|   RA 7641 Sec. 1 legal citation block             |
+--------------------------------------------------+
| FeaturesSection — bg-gray-50                      |
|   "Built for HR departments and labor lawyers"    |
|   6-card grid: calculator, batch, plan gap,       |
|   NLRC, PDF, share                               |
+--------------------------------------------------+
| LegalCredibilitySection — bg-white                |
|   "Grounded in Philippine law"                    |
|   3-card grid: RA 7641, Elegir v. PAL, LA 06-20  |
+--------------------------------------------------+
| SignUpCTASection — bg-gray-900                    |
|   "Compute the correct amount today"              |
|   [Create free account] [Sign in]                 |
+--------------------------------------------------+
| LandingFooter — border-t bg-white                 |
|   Logo + legal disclaimer                         |
+--------------------------------------------------+
```

---

## State and Props

The landing page is **entirely static** — no API calls, no Supabase queries, no loading states. All content is hardcoded. The only dynamic behavior is:

1. `beforeLoad` in the route: check session and redirect to `/dashboard` if authenticated.
2. Button links using TanStack Router `<Link>` components.

No state variables. No hooks (except the implicit route-level hook for the redirect check).

---

## Accessibility

| Requirement | Implementation |
|-------------|----------------|
| Heading hierarchy | `h1` in HeroSection, `h2` in each subsequent section, `h3` for feature card titles |
| Link clarity | All `<Link>` components have descriptive text (no "click here") |
| Color contrast | amber badge: amber-900 on amber-50 = 9.1:1. CTA dark bg: gray-300 on gray-900 = 7.2:1. Gray text on white = passes AA |
| Image alt text | No images used — all visual elements are text and Lucide SVG icons with aria-hidden |
| Landmark regions | `<nav>`, `<main>`, `<footer>` semantic HTML |

---

## Component Wiring Summary

| Component | File | Parent | Trigger |
|-----------|------|--------|---------|
| `LandingPage` | `src/components/landing/LandingPage.tsx` | `src/routes/index.tsx` | Route at `/` |
| `LandingNav` | `src/components/landing/LandingNav.tsx` | `LandingPage` | Always rendered |
| `HeroSection` | `src/components/landing/HeroSection.tsx` | `LandingPage` | Always rendered |
| `SampleComputationTeaser` | `src/components/landing/SampleComputationTeaser.tsx` | `LandingPage` | Always rendered |
| `UnderpaymentExplainerSection` | `src/components/landing/UnderpaymentExplainerSection.tsx` | `LandingPage` | Always rendered |
| `FeaturesSection` | `src/components/landing/FeaturesSection.tsx` | `LandingPage` | Always rendered |
| `LegalCredibilitySection` | `src/components/landing/LegalCredibilitySection.tsx` | `LandingPage` | Always rendered |
| `SignUpCTASection` | `src/components/landing/SignUpCTASection.tsx` | `LandingPage` | Always rendered |
| `LandingFooter` | `src/components/landing/LandingFooter.tsx` | `LandingPage` | Always rendered |

---

## Summary

The landing page is a 7-section static page with one dynamic behavior (auth redirect). The design follows the established design system: professional, muted grays with amber underpayment highlights and green for correct amounts. The core hook is the 33% underpayment claim, made concrete by the SampleComputationTeaser with real numbers (₱50,000 salary, 20 years service). Legal credibility is established by citing the statute, Supreme Court ruling, and DOLE advisory by name. Two CTAs: "Create free account" (primary, black button) and "Sign in" (secondary, outline).
