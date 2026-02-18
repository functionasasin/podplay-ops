# PodPlay Venue Setup — How Stripe Fits In & What We Need to Understand About Magpie's Equivalent

**Date:** February 18, 2026

---

## Background

We're deploying PodPlay venues in the Philippines and Southeast Asia. PodPlay's hardware configuration guide (written for US deployments) references **Stripe** at several points in the setup process. Since Magpie is handling payments for our region, we need to understand **what the Magpie analog is for each Stripe component** so we can set up venues correctly.

This doc maps out every place Stripe appears in the on-premises setup, and asks: **what's the equivalent on Magpie's side?**

---

## How a PodPlay Venue Works (Quick Overview)

Each venue has cloud services and local hardware:

```
┌──────────────────────────────────────────────────────┐
│                  CLOUD SERVICES                       │
│                                                      │
│  ┌────────────┐  ┌────────────┐  ┌───────────────┐  │
│  │   Admin    │  │  Booking   │  │   Payment     │  │
│  │ Dashboard  │  │    API     │  │   Provider    │  │
│  │            │  │            │  │               │  │
│  │ (venue     │  │ (users,    │  │  US = Stripe  │  │
│  │  config)   │  │  bookings) │  │  PH = Magpie? │  │
│  └────────────┘  └────────────┘  └───────────────┘  │
└──────────────────────────┬───────────────────────────┘
                           │ Internet
┌──────────────────────────┼───────────────────────────┐
│              ON-PREMISES (at each venue)              │
│                          │                           │
│   ┌──────────┐    ┌──────▼──────┐    ┌───────────┐  │
│   │ Cameras  │───▶│  Mac Mini   │───▶│ Apple TV  │  │
│   │ (replay) │    │ (replay svc)│    │ (display) │  │
│   └──────────┘    └─────────────┘    └───────────┘  │
│                                                      │
│   ┌──────────────────────────────────────────────┐   │
│   │  iPads (1 per court)                         │   │
│   │  - PodPlay app installed via Mosyle MDM      │   │
│   │  - Customer browses, books, PAYS here        │   │
│   │  - Connected via POE ethernet (not WiFi)     │   │
│   │  - All internet traffic goes through UDM     │   │
│   │    gateway → ISP router → internet           │   │
│   └──────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

---

## Every Place Stripe Appears in the Setup Guide

### 1. Admin Dashboard — Stripe Account ID

The very first step before any hardware is configured is setting up the venue in PodPlay's admin dashboard. There's a **Stripe Account ID** field:

```
┌───────────────────────────────────────────────────────┐
│           PODPLAY ADMIN DASHBOARD                      │
│                                                       │
│  Settings > Venues > [Venue Name]                     │
│                                                       │
│  ┌───────────────────────────────────────────────┐    │
│  │                                               │    │
│  │  Venue Name:        [Example Venue       ]    │    │
│  │  Location:          [City, Country       ]    │    │
│  │                                               │    │
│  │  ── Payment ─────────────────────────────     │    │
│  │                                               │    │
│  │  Stripe Account ID: [acct_1234567890    ]  ◄──┼─── THIS
│  │                                               │    │
│  │  ── Replays ─────────────────────────────     │    │
│  │  On-premises Replays: [✅ Enabled       ]     │    │
│  │  API URL:    [http://venue.podplaydns...]     │    │
│  │  Local URL:  [http://192.168.32.100:4000]     │    │
│  │                                               │    │
│  └───────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────┘
```

**What Stripe Account ID does in the US:** Each venue has its own Stripe account. This ID ties the venue to its Stripe merchant account so payments from that venue's iPads go to the right place.

> **Question for Magpie:** What is your equivalent of a Stripe Account ID? When we set up a new venue in the admin dashboard, what identifier from Magpie do we enter here — or does your integration work differently? Does PodPlay even have a field for Magpie, or did you handle this another way?

---

### 2. iPad App — Payment Is Processed Here

The PodPlay app runs on iPads at each court. Customers use it to book and pay. In the US, the app calls Stripe to process payment.

The app knows which venue it belongs to via a config pushed by Mosyle (MDM):

```xml
<dict>
  <key>id</key>
  <string>CUSTOMERNAME</string>
</dict>
```

This customer ID maps to a venue in the admin dashboard, which has the payment config (Stripe Account ID in the US).

```
HOW THE IPAD KNOWS WHERE TO SEND PAYMENT (US / STRIPE):

  Mosyle pushes              PodPlay app             Admin dashboard
  config to iPad             reads venue config       has payment config

  ┌─────────────┐           ┌─────────────┐         ┌────────────────┐
  │ id:         │           │ "I am the   │         │ Venue:         │
  │ "VenueName" │──────────▶│  VenueName  │────────▶│ "VenueName"    │
  │             │           │  iPad"      │  fetch   │                │
  └─────────────┘           └──────┬──────┘         │ Stripe ID:     │
                                   │                │ acct_xxxxx     │
                                   │                └────────────────┘
                                   │
                                   ▼
                            ┌─────────────┐
                            │ Payment via │
                            │ Stripe SDK  │
                            │ using that  │
                            │ account ID  │
                            └─────────────┘
```

> **Question for Magpie:** In your integration, how does the iPad app know to use Magpie instead of Stripe? Is it:
> - A different SDK embedded in the PodPlay app?
> - The same app, but it detects the region and routes to Magpie?
> - Something configured per-venue in the admin dashboard?
> - Something else entirely?
>
> We don't know the specifics of how your integration was wired in — can you walk us through the flow from the customer tapping "Pay" on the iPad to the money arriving?

---

### 3. Stripe in the Booking / Charge Flow

When a customer books a court in the US, the flow is:

```
Customer taps "Book" on iPad
         │
         ▼
PodPlay app sends booking request to PodPlay backend
         │
         ▼
PodPlay backend creates a Stripe PaymentIntent
(using the venue's Stripe Account ID)
         │
         ▼
Stripe processes the charge
(GCash / credit card in PH context)
         │
         ▼
Stripe sends webhook to PodPlay backend
confirming payment succeeded
         │
         ▼
PodPlay backend confirms the reservation
         │
         ▼
iPad shows "Booking Confirmed"
```

> **Question for Magpie:** What does this flow look like with your integration?
> - Does PodPlay's backend call Magpie's API directly (like it calls Stripe)?
> - Or does the iPad app call Magpie directly, bypassing the backend?
> - Does Magpie send webhooks/callbacks to PodPlay when a payment is confirmed?
> - How does GCash payment work in this flow specifically — does the customer get redirected to GCash, or is it in-app?

---

### 4. Stripe in Refunds / Credits

In the US, if a customer cancels a booking, PodPlay issues a refund through Stripe. In the Philippines, e-wallet refunds (GCash) are one-way — you can't easily refund back to the wallet.

> **Question for Magpie:** How are refunds/cancellations handled in your integration?
> - When PodPlay's backend triggers a refund, what happens on Magpie's side?
> - Do GCash payments get refunded back to GCash, or does the customer get a PodPlay credit instead?
> - For credit card payments, can you do standard refunds?
> - Is there anything we need to configure per venue for the refund flow to work?

---

### 5. Stripe During Venue Testing

The config guide's testing section says to "give yourself a few hundred free replays on your user profile so you do not get charged accidentally." This tells us payment is **live during testing** — there's no separate test mode mentioned in the guide.

The testing steps are:
1. Create an operations reservation via admin dashboard
2. Use the iPad to book a court (this triggers a real payment)
3. Verify instant replay works

> **Question for Magpie:** When we're testing a new venue setup before shipping it to the customer:
> - Is there a test/sandbox mode, or are we running live transactions?
> - If live: how do we reverse test charges?
> - Do we need to do anything on Magpie's side to "activate" a venue for payments, or is it live as soon as the config is in the admin dashboard?

---

### 6. Per-Venue Payment Configuration (Stripe Has One Account Per Venue)

In the US, each venue gets its own Stripe Account ID. This means payment revenue is separated per venue.

> **Question for Magpie:** How does venue-level separation work on your side?
> - Does each venue have its own Magpie merchant account?
> - Or do all venues share one account with some internal tagging?
> - When we add a new venue, do we need to register it with Magpie first?
> - Is there a self-service process, or do we coordinate with your team each time?

---

## Summary: Stripe Components & Magpie Equivalents

| Stripe Component (US) | What It Does | Magpie Equivalent? |
|---|---|---|
| **Stripe Account ID** | Per-venue merchant identifier, entered in admin dashboard | ❓ |
| **Stripe SDK** (in PodPlay app) | Processes payment on the iPad | ❓ |
| **PaymentIntent** | Backend creates a charge for a booking | ❓ |
| **Webhooks** | Stripe notifies PodPlay backend that payment succeeded/failed | ❓ |
| **Refunds** | Backend triggers refund on cancellation | ❓ |
| **Customer objects** | Saved payment methods for returning users | ❓ |
| **Test mode** | Sandbox for testing without real charges | ❓ |
| **Dashboard** | Stripe dashboard to see transactions per venue | ❓ |

We're not asking you to fill this in abstractly — we'd love a quick call or written walkthrough of **how your integration actually works** for each of these, so we know what to expect when setting up venues.

---

## What We're Doing Next

- **March 2–10:** Training in New Jersey at PodPlay HQ. We'll see the full setup process in person and can ask PodPlay's team how the Stripe integration was built, which will help us understand where Magpie plugs in.
- **After March 10:** We'll share what we learned and can do a technical sync to make sure we're aligned on the venue deployment process for the Philippines.

If you can share your answers (or even partial answers) before March 2, that would help us ask smarter questions during training.
