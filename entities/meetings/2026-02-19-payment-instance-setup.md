---
type: meeting
date: 2026-02-19
attendees: [[Carlos]]
projects: [[Digital Wallet]], [[Pod Play SEA]]
businesses: [[Pod Play]], [[Magpie]]
tags: [payment, stripe, credits, settlement, strategy]
---

# Payment Instance Setup & Digital Wallet Architecture

Discussion covering the payment instance given to [[Marcelo]], Stripe integration details, money flow and settlement design, and the credits vs direct booking architecture.

## Key Topics Discussed

### 1. Payment Instance for Marcelo

- [[Marcelo]] was given an instance of the payment platform to start documenting
- Marcelo is currently acting as "Cosmos" (the merchant/platform role) in the payment flow
- There were complaints about the initial payment UI — went through iterations
- Currently on the **3rd iteration** of customization
- Using **Stripe Payment Elements** (what Stripe calls "Payment Element") — not the standard checkout, a custom-built experience
- Assessment: the customization is a perfectly fine experience

### 2. Money Flow & Settlement

- Most of the money belongs to the **court owners** — e.g., on a 100-peso reservation, Pod Play takes ~10–15 pesos, court owner gets ~85
- Settlement options being offered to merchants:
  - **View balance**: Merchants can see what's settled in their account
  - **Manual withdrawal**: "Give me a bank account, we settle it"
  - **Auto-frequency**: Set up recurring settlement (e.g., daily) to merchant's bank account
- Reconciliation must complete before funds are available
- [[Kim]] is the key person on settlement flow design

### 3. Credits vs Direct Booking Debate

- Current instruction from the venue partners: **use the credit system** (users buy credits, then book with credits)
- Alternative: direct booking (credit card → booking, no intermediate credit step)
- The venue partners themselves created confusion by going back and forth on this
- Team's position: **agnostic** — told them "tell us what Skype does, we'll copy it and give you the exact same"
- Architecture is clean and flexible enough to support either model
- Current state: credit system active, but could switch to direct booking easily

### 4. What Credits Enable (Future Vision)

Credits aren't just for court bookings — the system can handle:
- **Court bookings** (current)
- **Coaching sessions** (expected to be the #1 requested add-on — every venue needs coaches)
- **Merchandise purchases**
- **Food & beverage**
- **Any product the merchant wants to add**

This is the path to the full [[Digital Wallet]] vision — Pod Play becomes a payment platform.

### 5. Cost Advantage of Owning the Wallet

- Direct credit card processing: ~3.5% per transaction
- Wallet-to-wallet (credits already loaded): ~1.5% per transaction
- **If credits are pre-loaded**, subsequent purchases cost less to process
- Strategic value: owning the wallet means not giving a split to external payment partners for every transaction
- Counter-argument: you still have acquisition cost on the initial credit load

### 6. Cross-Venue vs Venue-Locked Credits

- Open question: are credits locked to one venue or usable across any Pod Play facility?
- The team wants **cross-venue credits** (the [[Digital Wallet]] vision)
- If credits are venue-locked, you must credit first before visiting a new venue
- Need to confirm with venue partners how they want this to work
- **Action**: Ask [[Kim]] and the padel partners for a definitive answer

### 7. Merchant Dashboard & Branding

- Discussion about branding at three levels: **merchant**, **user**, and **Cosmos** (platform)
- Primary user interface belongs to the venue/players
- Merchants (court owners) may have their own permission-based dashboard
- The Cosmos dashboard feeds information into the merchant view
- Question: how does the Pod Play guide coexist with the credit/score system? Answer: it's a convergence — they're complementary, not competing

### 8. Market Considerations

- Singapore and Malaysia: small markets
- Indonesia: they don't have to deal with us (separate arrangement)
- Venue partners want to show investors and listing prospects strong numbers — "give us billions of dollars"
- Need to document capabilities in a **pitch deck** showing what the system can do

### 9. NJ Trip & Remaining Questions

- The [[2026-03 NJ PodPlay Training]] trip should resolve almost all remaining questions
- Need to send all open questions ahead of time so the trip is productive

## Action Items

- [ ] Confirm with [[Kim]] and padel partners: venue-locked vs cross-venue credits
- [ ] Document all open payment/architecture questions and send before NJ trip
- [ ] Create a small deck showing payment capabilities for investor conversations
- [ ] Define what merchants can add as products beyond court bookings (coaching, merch, food)
- [ ] Decide on settlement frequency defaults for merchant onboarding
- [ ] Clarify the Cosmos role/branding — is it a separate entity or just a layer?

## Open Questions

- How do cross-venue credits work with settlement to individual court owners?
- What is the exact split structure with [[Magpie]] for wallet transactions?
- How does the credit/booking system integrate with the venue's existing operations?
- Should we build the merchant product catalog now or wait for demand?
