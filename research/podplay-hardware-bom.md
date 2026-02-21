---
date: 2026-02-21
related: [[Pod Play]], [[Pod Play SEA]], [[2026-03 NJ PodPlay Training]], [[podplay-nj-trip-question-brainstorm]]
tags: [podplay, hardware, bom, reference]
---

# Pod Play Hardware BOM

Bill of materials received from Pod Play. Source of truth for hardware sourcing. Note: may not be fully up to date — confirm during NJ training trip.

---

## Network Rack

| Item | Source | Notes |
|------|--------|-------|
| TrippLite 12 Outlet RS-1215-RA | Ingram | 1U power strip / PDU |
| UniFi UDM-SE | UniFi | Firewall / console — **has built-in PoE** |
| UniFi UDM-Pro | UniFi | Firewall / console — no PoE |
| UniFi UDM-Pro-Max | UniFi | Firewall / console — no PoE |
| UniFi USW-Pro-24-POE | UniFi | 24 port PoE switch |
| UniFi USW-24-POE | UniFi | 24 port PoE switch |
| UniFi USW-Pro-48-POE | UniFi | 48 port PoE switch |
| UACC-DAC-SFP10-0.5M | UniFi | SFP cable for UDM ↔ switch ↔ NVR |
| Monoprice Cat6 1' Patch Cable | Amazon | Switch patch cable |
| Monoprice Cat6 3' Patch Cable | Amazon | Mac Mini and PDU |
| Monoprice Cat6 10' Patch Cable | Amazon | Kisi |
| iwillink 24 Patch Panel w Couplers | Amazon | 24 port patch panel with coupler keystones |
| UACC-Rack-Panel-Patch-Blank-24 | UniFi | Patch panel for rack |
| Rapink 24 PassThru Patch Panel | Amazon | Patch panel with pre-installed keystones |

## PingPod Specific

| Item | Source | Notes |
|------|--------|-------|
| UniFi U6-Plus | UniFi | Wi-Fi access point for PingPods |

## Front Desk

| Item | Source | Notes |
|------|--------|-------|
| Anker PowerConf C200 2K Webcam | Amazon | Webcam for check-in photo |
| 2D QR Barcode Scanner | Amazon | QR code scanner for check-in |

## Surveillance

| Item | Source | Notes |
|------|--------|-------|
| UniFi UNVR | UniFi | 4 bay NVR |
| UniFi UNVR-Pro | UniFi | 7 bay NVR |
| WD Purple 8TB HD | Amazon | Hard drive for NVR |
| UniFi G5 Turret Ultra White | UniFi | Security camera — pickleball clubs |
| UACC-Camera-CJB-White | UniFi | White junction box — pickleball clubs |
| UniFi G5 Turret Ultra Black | UniFi | Security camera — PingPods |
| UACC-Camera-CJB-Black | UniFi | Black junction box — PingPods |
| UniFi G5 Dome | UniFi | 2K dome camera for security |
| UniFi G5 Dome Ultra | UniFi | Smaller form factor, black — PingPods |

## Replay System

| Item | Source | Notes |
|------|--------|-------|
| Mac Mini 16GB 256 SSD | Apple Business | Replay server — **chip/year unknown, need to confirm** |
| Pyle 19-Inch 1U Vented Shelf | Amazon | Rack shelf for Mac Mini |
| Samsung T7 1TB | Amazon | External SSD — small club |
| Samsung T7 2TB | Amazon | External SSD — large club |
| Samsung T7 4TB | Amazon | External SSD — extra large club |
| EmpireTech IPC-T54IR-ZE White | EmpireTech | Replay camera 4MP varifocal (Dahua OEM) |
| EmpireTech IPC-T54IR-ZE Black | EmpireTech | Replay camera 4MP varifocal (Dahua OEM) |
| EmpireTech PFA130-E White | EmpireTech | White junction box for replay camera |
| EmpireTech PFA130-E Black | EmpireTech | Black junction box for replay camera |
| Flic Button | Flic | Buttons for scoring system |
| Aluminum Printed Sign 6x8 | Fast Signs | Signs for replay/score buttons |
| Hardware Kit | RC Fasteners | Bolts, nuts, screws, zip ties for sign mounting |

## Displays

| Item | Source | Notes |
|------|--------|-------|
| Apple TV 4K + Ethernet | Apple Business | Display output |
| HIDEit Mount | HIDEit | Apple TV wall/rack mount |
| Amazon Basics 3ft HDMI | Amazon | HDMI cables for Apple TVs |

## Access Control

| Item | Source | Notes |
|------|--------|-------|
| Kisi Controller Pro 2 | Kisi | Access control controller |
| Kisi Reader Pro 2 | Kisi | Access control reader |

---

## Philippines Sourcing Notes

Items to confirm availability in PH:
- **EmpireTech cameras** — Dahua OEM, may need to source through Dahua PH distributor or import
- **Mac Mini** — Available via Apple PH or authorized resellers, but Apple Business enrollment TBD (see Q24)
- **Apple TV** — Same as Mac Mini
- **Flic buttons** — May need to import, not commonly available in PH
- **Kisi** — Check if Kisi ships to PH or if there's a local distributor
- **UniFi gear** — Available in PH through authorized distributors

## Open Questions

- Mac Mini chip and year? (M1/M2/M4 matters for local sourcing and price)
- Brother label maker model? (not in BOM)
- Which UDM variant is recommended for a standard 4-court venue?
- Which switch variant for different venue sizes?
- UNVR vs UNVR-Pro — when to use which?
