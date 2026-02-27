---
type: business
name: Pod Play
category: sports-technology
location: [[United States]]
people: [[Ernesto]], [[Elia]], [[Ben]], [[Max]], [[Carlos]], [[Dominic]]
related: [[Ping Pod]], [[Magpie]]
tags: [software, platform, investment, payment]
---

# Pod Play

Software/booking platform originally built for [[Ping Pod]], now a separate company after the split.

## Background

- Was the software layer used by Ping Pod venues
- Company split: Pod Play became its own entity, Ping Pod kept the venue business
- All original investors (including Series A participants) became Pod Play shareholders
- Team chose to be Pod Play (not Ping Pod) during the split

## Southeast Asia

- Team holds Pod Play distribution rights for Southeast Asia
- Initially couldn't deploy in the Philippines ("it's not working")
- [[Ernesto]] committed to finding a solution within 2 years

## Profit-Sharing (Upcharge Model)

- US pricing baseline provided at ~50% discount of US rates
- Minimum price: $50
- Team can upcharge above the $50 minimum freely
- **Split on upcharge**: 70% to team, 30% to Pod Play
- Example: $60 price = $50 base + $10 upcharge → $7 to team, $3 to Pod Play

## Payment Platform

- Working with [[Magpie]] for Philippines payment processing
- GCash and credit card payments functional
- Refund challenge: electronic wallet refunds are one-way only in Philippines
- Cross-facility credit system proposed by [[Dominic]] — credits usable at any Pod Play venue
- Digital wallet strategy is a major growth opportunity (see [[Digital Wallet]])

## Philippines Tax

- 17% withholding tax applies

## Technical Architecture

PodPlay is a hybrid cloud + on-premises system. See [[PodPlay Asia Infrastructure Analysis]] for full breakdown.

- **Cloud**: Admin dashboard, booking API, payment processing (Stripe US), Mosyle MDM, Apple Business Manager, Google Cloud (storage + alerting)
- **On-premises per venue**: Unifi network stack (UDM + Switch + PDU), Mac Mini running Node.js replay service, cameras (1/court), iPads (1/court), Apple TVs (1/court), Samsung SSD for clip storage
- **Communication**: Mac Mini ↔ PodPlay backend via port 4000; DDNS via FreeDNS (podplaydns.com)
- **Replay flow**: Cameras → RTSP streams → Mac Mini (local VLAN 192.168.32.x) → Apple TV (instant replay); clips uploaded async to Google Cloud
- **Health monitoring**: Google Cloud alerting pings each site's health endpoint every 5 minutes; checks SSD storage (<80%), CPU, memory, rename service, link status; alerts via Slack
- **Configuration guide**: See [[PodPlay Config Guide v1]] (written by [[Stan Wu]], dated Sept 2024)

### V2 Replay Service (In Testing — ~1 month out as of 2026-02-25)

- Eliminates the deployment server dependency — code runs locally from GitHub
- Configuration moves from Google Docs into the PodPlay dashboard
- Much easier install and redeployment process
- Camera coefficients entered via dashboard instead of VPN → deployment server → manual entry
- Migration from V1 is straightforward
- ~70 live locations currently on V1

### Key People (Technical)

| Person | Role |
|--------|------|
| [[Nico]] | Hardware, replay service, installs (works under [[Chad]]) |
| [[Andy]] | Project manager — specs, camera positions, installer kickoffs |
| [[Chad]] | Head of operations — account decisions, credentials |
