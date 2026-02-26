# Grab Transport — Metro Manila Transit Analysis

**Source type**: Transit App / Ride-hailing Platform
**Date analyzed**: 2026-02-26
**Analyst**: Loop automated run

---

## Summary

Grab Philippines does **not operate any public transit routes** in Metro Manila. The former GrabBus service was a ticket-booking marketplace for pre-existing P2P bus operators — not a distinct transit service with its own routes. GrabBus appears to have quietly ceased operations during or after the COVID-19 pandemic (2020–2022), with no formal discontinuation announcement found.

**GTFS contribution: None.** No unique route data to add; routes covered by GrabBus are already captured via P2P bus operator analysis.

---

## GrabBus (Historical: 2019–~2020)

### What It Was

GrabBus was a **bus ticket booking marketplace** integrated into the Grab app (launched July 2019, beta phase). It was not a transit operator — it sold tickets on behalf of existing licensed P2P bus operators (Tas Trans, San Agustin, and provincial bus companies). Users could book seats in advance with in-app payment.

### Routes Available at Launch (July 2019)

| Route | Operator | Mode | Notes |
|-------|----------|------|-------|
| Glorietta 2 (Makati) ↔ SM Southmall (Las Piñas) | Tas Trans / San Agustin | P2P Bus | Initial launch route |
| Glorietta 2 (Makati) ↔ Nuvali (Santa Rosa, Laguna) | Tas Trans / San Agustin | P2P Bus | Initial launch route |

### Routes Added (September 2019)

| Route | Operator | Mode | Notes |
|-------|----------|------|-------|
| Makati ↔ Noveleta (Cavite) | Unknown | P2P Bus | NCR expansion |
| Olongapo ↔ Clark (Pampanga) | Provincial operator | Provincial Bus | Non-NCR |
| Clark ↔ Dagupan (Pangasinan) | Provincial operator | Provincial Bus | Non-NCR |

### Key Characteristics

- **Not an operator**: GrabBus was a booking interface over existing LTFRB-franchised P2P routes
- **Guaranteed seats**: Pre-booked, unlike walk-up P2P buses
- **Real-time updates**: GPS tracking of buses integrated into Grab app
- **Payment**: In-app via GrabPay, credit card, or cash
- **Routes were NCR fringe to Metro Manila CBD**: Primarily suburban commuters into Makati

### Current Status: Likely Discontinued

The Grab Philippines transport page (as of 2026) lists no bus or shuttle services. The current lineup is: GrabCar (4-seater), GrabCar 6-seater, GrabFamily, Rent by Grab, and Move It (motorcycle taxi). There is no GrabBus listing. COVID-19 pandemic disruptions to public transport in 2020 and the DOTr Metro Manila Bus Rationalization Program likely made GrabBus operationally unviable.

No formal discontinuation announcement was found via web search. Confidence: **medium** that service has ended.

---

## RideCo–Grab Corporate Shuttles (Present, Not Public Transit)

Grab has an expanded partnership with RideCo (a microtransit software company) to power **corporate employee shuttle services** in Southeast Asia. These are:

- **Private**: Available only to employees of specific corporate clients
- **Dynamic routing**: Routes are generated on-demand based on actual bookings (no fixed route)
- **Not LTFRB-franchised public routes**: Not accessible to the general public
- **No fixed stops**: Uses Flex Stops near employees' homes, selected algorithmically

One documented case study involved a multinational logistics firm using 13-seater vans, picking up employees in the evening rush period. This service likely exists in Metro Manila but is **not public transit** and provides no GTFS-relevant data.

---

## Data Quality Assessment

| Dimension | Rating | Notes |
|-----------|--------|-------|
| Recency | Poor | GrabBus data is from 2019; service likely ended ~2020 |
| Completeness | N/A | Not a meaningful source for current route data |
| Accuracy | N/A | Routes were booking wrappers over P2P routes |
| GTFS utility | None | All routes already covered by P2P operator data |

---

## Implications for GTFS Build

- **Do not add** any routes from GrabBus — they duplicate P2P routes already captured
- The Makati ↔ SM Southmall and Makati ↔ Nuvali routes should be validated in the P2P bus operator analysis
- Corporate Grab shuttles are private and out of scope for a public GTFS feed
- Grab provides no unique transit data that cannot be obtained from official LTFRB sources

---

## Sources

- [Grab Debuts GrabBus Service — UNBOX PH](https://unbox.ph/play/grab-debuts-grabbus-service/)
- [Skip the Line and Book Your Bus Tickets via GrabBus — Philippine Primer](https://primer.com.ph/blog/2019/07/12/you-may-be-able-to-book-your-bus-tickets-via-grab-soon/)
- [Commuters from the North can now book via Grab — NOLISOLI](https://nolisoli.ph/68282/grab-north-bus-mparlade-20190925/)
- [Grab PH introduces new services — Philippine News Agency](https://www.pna.gov.ph/articles/1079084)
- [RideCo and Grab Expand Partnership — RideCo](https://www.rideco.com/post/rideco-and-grab-expand-partnership)
- [Grab Transport Philippines (current) — grab.com/ph/transport](https://www.grab.com/ph/transport/)
