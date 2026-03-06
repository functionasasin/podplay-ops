---
type: project
name: Digital Wallet
status: active
people: [[Birch]], [[Coral]], [[Jade]]
places: [[Philippines]]
related: [[Pod Play]], [[Magpie]], [[Pod Play SEA]]
tags: [fintech, wallet, payment, strategy]
---

# Digital Wallet

Digital wallet / stored-value platform built on top of [[Pod Play]]'s booking system, in partnership with [[Magpie]].

## Concept

- Users store money in a Pod Play wallet
- Credits can be spent at **any** Pod Play facility (not just where booked) — key differentiator from US model where credits are facility-locked
- As Pod Play scales across Asia, the wallet becomes a cross-venue payment network

## Why It Matters

- In the Philippines, electronic wallet refunds are one-way only — credits stay in the system
- More money in the wallet = more float controlled by the team
- At scale, Pod Play becomes a **payment platform**, not just a booking tool
- [[Magpie]] is developing for free because they see this potential

## Partnership with Magpie

- Magpie has regulatory filings and payment licenses (Philippines only)
- Magpie has counterpart partners in other Asian markets for expansion
- Negotiation strategy: push for 80/20 split, expect to settle at ~50/50
- Need to structure term sheet for wallet partnership

## Payment Implementation (as of 2026-02-19)

- [[Coral]] given a payment instance, currently acting as "Cosmos" (merchant/platform role) for testing
- Using **Stripe Payment Elements** — 3rd iteration after UI feedback, custom-built experience
- Money flow: on a 100-peso reservation, ~10–15 pesos to Pod Play, ~85 to court owner
- Settlement options for merchants: manual withdrawal, or auto-daily settlement to bank account
- Reconciliation required before funds become available

### Credits vs Direct Booking

- Architecture supports both models — currently running credit system per venue partner request
- Credits enable: court bookings, coaching sessions, merchandise, food & beverage, any merchant product
- Cost advantage: wallet-to-wallet ~1.5% vs direct credit card ~3.5% per transaction
- Open question: venue-locked vs cross-venue credits — need confirmation from [[Jade]] and padel partners

### Merchant Product Catalog (Future)

- Coaching sessions expected to be the #1 requested add-on
- Merchants should be able to add their own products beyond court bookings
- Path to full payment platform — Pod Play handles all money movement for the venue ecosystem

## Expansion

- Magpie's license is Philippines-only
- For other Asian markets, Magpie can provide technology while local partners handle regulation
- Singapore EDB engagement may support regional wallet infrastructure
- Singapore and Malaysia are small markets; Indonesia has separate arrangements
