---
date: 2026-02-21
related: [[Pod Play]], [[Pod Play SEA]], [[podplay-hardware-bom]], [[podplay-nj-trip-question-brainstorm]], [[2026-03 NJ PodPlay Training]]
tags: [podplay, hardware, sourcing, philippines, procurement]
---

# Pod Play Philippines Hardware Sourcing Guide

Research on sourcing all BOM items for Philippine venue deployments. Based on the hardware BOM received from Pod Play (see [[podplay-hardware-bom]]).

---

## Voltage Compatibility

Philippines runs **220V / 60Hz**. Only one item in the BOM has a voltage issue:

| Item | Issue | Fix |
|------|-------|-----|
| **TrippLite RS-1215-RA PDU** | 120V only, NEMA 5-15R outlets | Swap to **Tripp Lite RS-1215-20T** |

### PDU Swap Detail

| Spec | RS-1215-RA (US) | RS-1215-20T (Replacement) |
|------|------------------|---------------------------|
| Outlets | 12x NEMA 5-15R | 12x IEC C13 |
| Input voltage | 120V | **100–240V** |
| Input plug | NEMA 5-15P (US) | IEC C20 |
| Form factor | 1U rack mount | 1U rack mount |
| Amperage | 15A | 20A |
| Surge/filtering | No | No |
| Price | ~$60 | ~$65–80 |

Same brand, same form factor, same 12 outlets, same dumb pass-through design. The only differences are IEC connectors instead of NEMA and universal voltage input. Requires a **C19-to-Philippine-plug** power cord for wall connection (standard, cheap).

All rack equipment ships with or accepts IEC C13 power cables, so everything plugs right in. Actually a cleaner setup than the US NEMA version.

### Everything Else: No Voltage Issues

All other BOM items use universal power (100–240V auto-switching), PoE, USB, or battery:

| Power Source | Items |
|-------------|-------|
| **Universal PSU (100–240V)** | Mac Mini, Apple TV 4K, UDM-SE/Pro/Pro-Max, UniFi switches, UNVR/UNVR-Pro |
| **PoE (powered by switch)** | UniFi cameras (G5 Turret, Dome), EmpireTech replay cameras, Kisi controller/reader |
| **USB (powered by host)** | Samsung T7 SSD, Anker webcam, QR barcode scanner |
| **Battery** | Flic buttons |
| **No power** | HIDEit mount, patch panels, cables, junction boxes, rack shelf |

---

## Sourcing Breakdown

### Easily Available Locally

| Item | Price (PHP) | Where to Buy | Notes |
|------|-------------|--------------|-------|
| Mac Mini M4 16GB/256GB | ~₱36,990 | Apple PH, Power Mac Center, Beyond the Box, iStore | Universal PSU. Apple Business Manager confirmed available in PH via Asticom as local partner. |
| Apple TV 4K + Ethernet | ~₱10,990 | Apple PH, Beyond the Box, iStudio, Abenson | Universal PSU. |
| Samsung T7 1TB SSD | ~₱10,250 | Lazada, Shopee, DataBlitz | Standard T7. |
| Samsung T7 2TB SSD | ~₱13,995 | Lazada, Shopee, DataBlitz | Standard T7. |
| Samsung T7 4TB SSD | ~₱30,395 | DataBlitz, Lazada | Only available as T7 **Shield** variant (rugged/IP65). Standard T7 4TB may need import. |
| Anker PowerConf C200 Webcam | ~₱5,054 | Lazada, Shopee | Anker has official PH presence (anker.ph). Local warranty. |
| 2D QR Barcode Scanner | Various | Lazada, Shopee | Generic item, widely available. |
| WD Purple 8TB HD | Various | Lazada, Shopee, DataBlitz | Standard surveillance drive, widely stocked. |
| Pyle 19" 1U Vented Shelf | Various | Lazada, Shopee | Generic rack shelf, alternatives widely available. |
| Amazon Basics 3ft HDMI | Various | Lazada, Shopee | Any HDMI 2.0+ cable works. |
| Monoprice Cat6 Patch Cables | Various | Lazada, Shopee | Any Cat6 patch cables work. Brand not critical. |

### Available but Stock Fluctuates (UniFi Gear)

PH prices run **15–40% above US MSRP** due to import duties, 12% VAT, and distributor markup.

**Authorized PH Distributors (contact for bulk/volume pricing):**
- **MEC Networks Corporation** (mec.ph) — major authorized distributor
- **iConnect Technologies** (iconnecttechnologies.com) — authorized distributor, Cebu
- **Ubiquiti Official Store on Lazada PH** — best retail availability

**Other retailers:** PC Express (PCX), IT Warehouse, InfoBahn, XBSAsia

| Item | Price (PHP est.) | Availability | Notes |
|------|-----------------|--------------|-------|
| UDM-SE | ~₱34,500–41,250 | In stock on Lazada, out of stock on PCX | Has built-in PoE. |
| UDM-Pro | ~₱29,850 | Good — best availability of UDM line | No PoE. |
| UDM-Pro-Max | ~₱49,700 | Limited — newer product | No PoE. |
| USW-Pro-24-POE | ~₱48,000–59,000 | Spotty | Check PCX, InfoBahn, XBSAsia. |
| USW-24-POE | ~₱29,750 | Often sold out | InfoBahn, Lazada. |
| USW-Pro-48-POE | ~₱55,000–65,000 | Limited | May need special order via IT Warehouse. |
| UNVR (4-bay) | ~₱25,000 | Good | Lazada PH. |
| UNVR-Pro (7-bay) | ~₱35,000–40,000 | Limited | Contact MEC Networks or iConnect. |
| G5 Turret Ultra (white) | ~₱8,000–12,000 | Spotty | Lazada (3rd party), distributors. |
| G5 Turret Ultra (black) | ~₱8,000–12,000 | Harder to find | Black variants less common. |
| G5 Dome / Dome Ultra | ~₱8,000–12,000 | Spotty | Same availability as Turret Ultra. |
| U6-Plus Wi-Fi AP | ~₱8,200 | Spotty | PCX (notify-when-available), InfoBahn, Lazada. |

**Recommendation:** Contact MEC Networks or iConnect with the full UniFi list for a single bulk order. They can source everything and likely offer better pricing than retail.

### Must Import

| Item | Price (USD) | Source | Notes |
|------|-------------|--------|-------|
| EmpireTech IPC-T54IR-ZE (replay camera) | ~$105–190 | EmpireTech direct, IP Cam Talk Store | Ships internationally via FedEx. Buyer responsible for import duties. |
| EmpireTech PFA130-E (junction box) | ~$20 | EmpireTech direct | Under PH de minimis threshold (₱10,000) if ordered separately — may clear duty-free. |
| Flic Button | ~$35/button | flic.io | Ships to PH via UPS (3–7 days). Also need **Flic Hub LR** for phone-independent operation. No local retailer or support. |
| HIDEit Mount (Apple TV) | ~$17–30 + shipping | hideitmounts.com, Amazon | Shipping may exceed product cost. Generic Apple TV wall mounts on Lazada/Shopee are a cheaper alternative. |
| UACC-DAC-SFP10-0.5M (SFP cable) | ~$15 | Amazon, Ubuy | Niche UniFi accessory, not stocked locally. |
| UACC-Camera-CJB-White/Black | ~$29–49 | Amazon, Ubuy | UniFi camera junction boxes, not stocked locally. |
| Tripp Lite RS-1215-20T (PDU replacement) | ~$65–80 | Amazon, B&H Photo | Or source a 220V-compatible rack PDU locally from Eaton Philippines. |
| Aluminum Printed Sign 6x8 | Custom | Fast Signs or local PH print shop | Easy to source locally from any signage shop. |

### Alternative Local Source for Replay Cameras

The EmpireTech IPC-T54IR-ZE is a **Dahua OEM** — identical hardware to the **Dahua IPC-HDW5442T-ZE-S3**. Dahua has strong PH distribution:

- **Verdantwaly Industrial Corp.** (verdantwaly.com) — official Dahua PH brand distributor
- **Kital** (kital.com.ph) — authorized Dahua dealer, 30+ years in PH
- **7S CCTV Security Corp.** (7scsc.ph) — authorized dealer, Makati
- **CCTVPinoy** (cctvpinoy.com) — carries Dahua products
- **Lazada PH** — official Dahua store

Dahua-branded version will cost more than EmpireTech OEM but comes with local warranty, no customs, and local support. **Confirm with Pod Play that the Dahua-branded firmware is compatible with their replay pipeline before purchasing.**

### Needs Verification: Kisi

Kisi operates in 50+ countries with Singapore presence, but **Philippines availability is unconfirmed**.

- Hardware is quote-based (~$500–800 controller, ~$300–500 reader)
- Requires **cloud subscription** (~$50–100/door/month) — no subscription = no access control
- May require **NTC (National Telecommunications Commission)** approval for wireless/network components
- Contact Kisi sales directly at getkisi.com and ask about PH deployment
- Installation support would be remote (dedicated virtual install specialist)

---

## Import Considerations

For items shipped from US/EU to Philippines:

- **Import duty**: Electronics generally 0–10% depending on HS code classification
- **VAT**: 12% on top of CIF (Cost + Insurance + Freight) value
- **De minimis threshold**: Shipments with FOB value under **₱10,000 (~$175 USD)** are exempt from both duty and VAT
- **Brokerage**: FedEx/UPS handle customs clearance and charge a processing fee (~$10–20)

**Strategy**: Order small items (junction boxes, mounts, SFP cables) separately to stay under de minimis. Bundle cameras in larger orders and factor in ~15–20% landed cost overhead.

---

## Summary: What to Buy Where

| Source | Items |
|--------|-------|
| **Apple PH / Power Mac / BTB** | Mac Mini, Apple TV |
| **Lazada / Shopee / DataBlitz** | Samsung T7 SSDs, Anker webcam, QR scanner, WD Purple HDs, HDMI cables, Cat6 cables, rack shelf, generic mounts |
| **MEC Networks / iConnect (UniFi distributor)** | All UniFi gear (UDM, switches, NVR, cameras, APs) — single bulk order |
| **Verdantwaly / Kital (Dahua distributor)** | Replay cameras (Dahua IPC-HDW5442T-ZE-S3) + junction boxes — if Pod Play confirms firmware compatibility |
| **EmpireTech direct / IP Cam Talk Store** | Replay cameras (EmpireTech IPC-T54IR-ZE) + junction boxes — if sticking with OEM brand |
| **Flic.io** | Flic buttons + Flic Hub LR |
| **Amazon / B&H / Ubuy** | SFP DAC cables, UniFi junction boxes, HIDEit mounts, PDU (RS-1215-20T) |
| **Eaton Philippines** | Alternative PDU sourcing (Tripp Lite 220V models) |
| **Kisi sales (getkisi.com)** | Access control — confirm PH availability first |
| **Local print/sign shop** | Aluminum printed signs for replay/score buttons |

---

## Open Questions for NJ Trip

- [ ] Confirm Mac Mini chip/year (M1? M2? M4?) — affects sourcing and price
- [ ] Confirm Dahua-branded camera firmware is compatible with replay pipeline (or must it be EmpireTech specifically?)
- [ ] Which UDM variant for a standard 4-court venue? (UDM-SE preferred since it has PoE built in?)
- [ ] Which switch for different venue sizes? (24-port vs 48-port cutoff?)
- [ ] UNVR vs UNVR-Pro — when to use which?
- [ ] Kisi — is it required for all venues or only PingPod-style unmanned locations?
- [ ] Flic Hub — is it already part of their deployment or do we need to add it?
- [ ] PDU swap to RS-1215-20T — any objection from Pod Play?
- [ ] Brother label maker model — still missing from BOM
