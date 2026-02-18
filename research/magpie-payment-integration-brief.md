# PodPlay Asia — Payment Integration Brief for Magpie

**Date:** February 18, 2026
**From:** Pod Play SEA Distribution Team
**To:** Magpie Engineering / Payments Team
**Re:** What we need from you to replace Stripe for PodPlay venues in the Philippines & Southeast Asia

---

## Context

We're distributing **PodPlay** (a venue management + instant replay platform for table tennis venues) across Southeast Asia. PodPlay currently uses **Stripe** for all payment processing in the US. Stripe will not work for our Asia deployments — **Magpie is our payment provider for this region.**

We have a training trip in New Jersey (March 2–10) where we'll get deeper into PodPlay's codebase. Before and after that trip, we need Magpie's team to understand the system architecture so we can plan the integration work together.

This document explains how PodPlay works end-to-end, where payments fit in, and lists the specific questions we need answered.

---

## 1. PodPlay System Architecture

PodPlay is a **hybrid cloud + on-premises system**. There's a cloud backend (bookings, users, payments) and a local hardware stack at each venue (cameras, replay service, displays).

```
                        ┌──────────────────────────────────────┐
                        │         PODPLAY CLOUD BACKEND         │
                        │                                      │
                        │   ┌────────────┐   ┌────────────┐   │
                        │   │  Booking   │   │   Admin    │   │
                        │   │    API     │   │ Dashboard  │   │
                        │   └─────┬──────┘   └────────────┘   │
                        │         │                            │
                        │   ┌─────▼──────┐                     │
                        │   │  PAYMENT   │◄─── Currently       │
                        │   │  SERVICE   │     Stripe only     │
                        │   └─────┬──────┘                     │
                        │         │                            │
                        └─────────┼────────────────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
              ┌─────▼─────┐ ┌────▼────┐ ┌─────▼─────┐
              │  Stripe   │ │ Magpie  │ │  Future   │
              │  (US)     │ │ (Asia)  │ │ Provider  │
              │           │ │  ???    │ │           │
              └───────────┘ └─────────┘ └───────────┘
```

**The key question is: Does PodPlay's "Payment Service" have a pluggable provider interface, or is Stripe hardcoded throughout?** We'll find out during our NJ training. Either way, Magpie needs to be ready.

---

## 2. Where Payments Happen in the User Flow

Here's the end-to-end flow for a customer booking and playing at a PodPlay venue:

```
CUSTOMER JOURNEY                              PAYMENT TOUCHPOINTS
─────────────────                             ──────────────────

1. Customer opens PodPlay app (iPad)
        │
        ▼
2. Browses available courts & time slots
        │
        ▼
3. Selects court + time ──────────────────►  PAYMENT: Charge for booking
        │                                     • Amount = base price + upcharge
        │                                     • Must confirm payment before
        │                                       reservation is locked
        ▼
4. Reservation confirmed
        │
        ▼
5. Customer plays (cameras record)
        │
        ▼
6. Customer requests instant replay
   (shown on Apple TV)
        │
        ▼
7. Replay credits deducted ───────────────►  PAYMENT: Replay credit purchase
        │                                     • Credits may be purchased
        │                                       separately or bundled
        ▼
8. Session ends
        │
        ▼
9. (Optional) Customer cancels ───────────►  PAYMENT: Refund / credit
   a future booking                           • US uses Stripe refunds
                                              • PH: e-wallet refunds are
                                                one-way — stays as credit
```

---

## 3. Payment Operations PodPlay Likely Needs

Based on the config guide and admin dashboard, here are the payment operations the system performs. **We need Magpie to confirm which of these they can support:**

| Operation | Description | Stripe Equivalent | Magpie Can Do? |
|---|---|---|---|
| **Charge** | Collect payment for a booking | `PaymentIntent.create()` | ? |
| **Refund** | Return money to customer | `Refund.create()` | ? (PH e-wallet limitation) |
| **Webhook — Payment Confirmed** | Backend gets notified when payment succeeds | `payment_intent.succeeded` | ? |
| **Webhook — Payment Failed** | Backend gets notified when payment fails | `payment_intent.payment_failed` | ? |
| **Webhook — Refund Processed** | Backend gets notified when refund completes | `charge.refunded` | ? |
| **Customer Creation** | Store customer payment profile | `Customer.create()` | ? |
| **Saved Payment Methods** | Let returning customers pay without re-entering info | `PaymentMethod.attach()` | ? |
| **Venue-Level Config** | Each venue has its own payment account/config | Stripe Account ID per venue | ? |
| **Multi-Currency** | Support PHP, potentially THB, SGD in future | Stripe multi-currency | ? |

---

## 4. The Admin Dashboard Payment Config

PodPlay's admin dashboard has a **"Manage Venue"** screen with a **Stripe Account ID** field. This tells us:

- Payment configuration happens **per venue**
- Each venue can (presumably) have its own payment account
- The admin dashboard is the place where payment provider config lives

```
┌─────────────────────────────────────────────────┐
│            PODPLAY ADMIN DASHBOARD               │
│                                                  │
│  Settings > Venues > [Venue Name]                │
│                                                  │
│  ┌─────────────────────────────────────────┐     │
│  │  Venue Name:     [Manila Court 1    ]   │     │
│  │  Location:       [Manila, PH        ]   │     │
│  │                                         │     │
│  │  ── Payment ──                          │     │
│  │  Stripe Account ID: [acct_xxxxxx   ]   │◄──── This field needs to
│  │                                         │      either support Magpie
│  │  ── Replay ──                           │      credentials, or there
│  │  On-premises Replays: [✅ Enabled   ]   │      needs to be a new
│  │  API URL: [http://customer.podplay...]  │      provider selector
│  │  Local URL: [http://192.168.32.100..]  │     │
│  └─────────────────────────────────────────┘     │
└─────────────────────────────────────────────────┘
```

**Question for Magpie:** What credentials/identifiers would you need stored per venue? An API key? A merchant ID? A webhook URL?

---

## 5. Digital Wallet / Cross-Facility Credits

Beyond basic payment processing, we're planning a **digital wallet** feature:

```
┌────────────────────────────────────────────────────────────────┐
│                      DIGITAL WALLET FLOW                       │
│                                                                │
│  Customer loads                                                │
│  money into wallet ────►  ┌──────────────┐                     │
│  (GCash, credit card)     │   MAGPIE     │                     │
│                           │   WALLET     │                     │
│                           │   SERVICE    │                     │
│                           └──────┬───────┘                     │
│                                  │                             │
│              ┌───────────────────┼───────────────────┐         │
│              │                   │                   │         │
│        ┌─────▼─────┐     ┌──────▼──────┐    ┌──────▼──────┐  │
│        │ Venue A   │     │  Venue B    │    │  Venue C    │  │
│        │ (Manila)  │     │  (Cebu)     │    │  (Bangkok)  │  │
│        │ Spend     │     │  Spend      │    │  Spend      │  │
│        │ credits   │     │  credits    │    │  credits    │  │
│        └───────────┘     └─────────────┘    └─────────────┘  │
│                                                                │
│  KEY: Credits work across ALL venues (unlike US model          │
│       where credits are locked to one facility)                │
│                                                                │
│  Refund model: No cash-out. Cancellations → wallet credits.   │
│  This solves the PH e-wallet refund limitation.                │
└────────────────────────────────────────────────────────────────┘
```

**This is a future phase**, but Magpie's architecture needs to support it from day one. Questions:

1. Can Magpie's wallet infrastructure support a **stored-value model** where customers hold a balance?
2. Can that balance be **spent across multiple merchant accounts** (i.e., different venues)?
3. What's the regulatory implication of holding customer funds in a wallet in the Philippines?
4. Does Magpie's existing regulatory license cover stored-value / e-money?
5. For expansion to Thailand, Singapore, etc. — can your counterpart partners replicate this?

---

## 6. Integration Scenarios

There are two possible scenarios depending on what we learn during the NJ training:

### Scenario A: PodPlay Has a Payment Provider Abstraction

```
PodPlay Backend
      │
      ▼
┌─────────────────┐
│ Payment Provider │◄─── Generic interface
│   Interface      │     (charge, refund, webhook, etc.)
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
 Stripe    Magpie
 Adapter   Adapter ◄─── Magpie builds this
```

**If this is the case:**
- Magpie needs to build an **adapter** that implements the same interface
- We need PodPlay to share the interface spec / API contract
- Magpie's adapter handles translating PodPlay calls → Magpie API

### Scenario B: Stripe Is Hardcoded Throughout

```
PodPlay Backend
      │
      ▼
┌─────────────────┐
│ Stripe SDK calls │◄─── Stripe-specific code everywhere
│ scattered across │
│ the codebase     │
└─────────────────┘
```

**If this is the case:**
- Either PodPlay refactors to create an abstraction (their work)
- Or Magpie builds a **Stripe-compatible API proxy** that accepts Stripe-format API calls and translates them to Magpie operations
- Or we work together with PodPlay to define a minimal adapter

**Magpie should be prepared for either scenario.**

---

## 7. Questions We Need Magpie to Answer

### Integration Readiness

| # | Question | Why It Matters |
|---|---|---|
| 1 | What is Magpie's **API format** for charging a customer? (REST? GraphQL? SDK?) | Need to know if it can map to PodPlay's expected interface |
| 2 | Does Magpie support **webhooks / callbacks** for payment events? (success, failure, refund) | PodPlay almost certainly relies on async payment notifications |
| 3 | What **credentials** does Magpie issue per merchant? (API key, merchant ID, secret key?) | Need to know what goes into the admin dashboard config per venue |
| 4 | Can Magpie handle **multiple merchant accounts** under one parent? (one per venue) | Each PodPlay venue is a separate payment entity |
| 5 | What **payment methods** are currently supported? (GCash, credit card, others?) | Need full list for customer-facing UI |
| 6 | What is the **refund flow**? Can you refund to GCash? To credit cards? | PodPlay expects refund capability; PH e-wallets have limitations |
| 7 | What is Magpie's **settlement timeline**? (T+1? T+3?) | Affects cash flow for venue operators |
| 8 | Is there a **sandbox / test environment** we can use for integration testing? | Need to test without real money |

### Stripe Compatibility

| # | Question | Why It Matters |
|---|---|---|
| 9 | Have you ever built a **Stripe-compatible API layer**? | Would dramatically simplify integration if PodPlay is Stripe-hardcoded |
| 10 | Can you accept a **Stripe-format PaymentIntent** and translate it? | Fallback approach if no abstraction exists |
| 11 | Do you support **Stripe-style webhook event formats**? | May allow drop-in replacement |

### Wallet / Stored Value

| # | Question | Why It Matters |
|---|---|---|
| 12 | Does your platform support a **stored-value / wallet balance** for end users? | Core requirement for the digital wallet feature |
| 13 | Can a single wallet balance be **spent across multiple merchants**? | Cross-venue credits are a key differentiator |
| 14 | What are the **regulatory requirements** for holding customer funds? | Compliance risk if not handled properly |
| 15 | What is the **maximum hold time** for funds in a wallet? | Affects wallet product design |
| 16 | Can wallet balances be **topped up** via GCash, credit card, bank transfer? | Need multiple load channels |

### Multi-Market Expansion

| # | Question | Why It Matters |
|---|---|---|
| 17 | For Thailand, Singapore, and other markets — who are your **counterpart partners**? | Need to plan payment integration per country |
| 18 | Is the **API the same** across your partner network, or does each country have its own? | Determines if we build one integration or many |
| 19 | Can you provide **introductions** to counterpart partners for markets we're entering? | Speeds up expansion timeline |

---

## 8. What We'll Get From PodPlay During Training (March 2–10)

After the NJ trip, we'll share the following with Magpie:

- [ ] PodPlay's **Stripe API calls** — the exact endpoints, payloads, and webhook events they use
- [ ] Whether there's a **payment provider abstraction layer** or if Stripe is hardcoded
- [ ] The **data model** — how payments tie to bookings, users, venues
- [ ] The **admin dashboard config** — exactly what fields exist for payment provider setup
- [ ] Any **API documentation** or integration specs PodPlay can share

---

## 9. Proposed Timeline

| Date | Milestone |
|---|---|
| **Now → March 1** | Magpie reviews this document, answers questions above |
| **March 2–10** | NJ training — we document PodPlay's Stripe integration in detail |
| **March 11–15** | Share Stripe integration details with Magpie |
| **March 15–30** | Joint technical planning: Magpie + our team define integration approach |
| **April** | Integration development begins |
| **TBD** | Integration testing in sandbox environment |
| **TBD** | First live venue in Philippines with Magpie payments |

---

## 10. Summary

**What we need from Magpie right now:**

1. Answer the 19 questions in Section 7 above
2. Share your API documentation (charge, refund, webhook, merchant management)
3. Confirm your sandbox/test environment is available
4. Confirm wallet/stored-value capability and regulatory status
5. Be ready for a technical deep-dive call after March 10 when we return from NJ with PodPlay's integration details

**What Magpie can expect from us:**

1. Full PodPlay Stripe integration spec (after March 10)
2. Clear integration scenario (Scenario A or B from Section 6)
3. Technical requirements document for the adapter/integration
4. Timeline and resource commitment for joint development
