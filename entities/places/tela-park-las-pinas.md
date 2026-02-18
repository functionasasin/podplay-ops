---
type: place
name: Tela Park
location: Las Piñas, Metro Manila, Philippines
related: [[Pod Play SEA]], [[Pod Play]]
tags: [venue, podplay, philippines, installation]
---

# Tela Park — PodPlay Facility Checklist

Target venue for PodPlay installation in Las Piñas, Metro Manila. This checklist covers **every facility detail** that must be verified before installation day so setup goes smoothly on arrival.

All items derived from the [[PodPlay Config Guide v1]] and [[PodPlay Asia Infrastructure Analysis]].

---

## 1. Court Information

- [ ] **Total number of courts** — How many courts will have PodPlay installed? (Determines quantity of ALL per-court hardware: cameras, iPads, Apple TVs, POE chargers, monitors/TVs)
- [ ] **Court numbering** — What is the numbering scheme? (C1, C2, C3… or do they have their own labels?) Needed for labeling every piece of equipment
- [ ] **Court dimensions** — Length × width of each court (affects camera positioning and field of view)
- [ ] **Court layout / floor plan** — Get a diagram or photo showing court positions relative to each other and the equipment room. Need to understand cable run distances

---

## 2. Camera Mounting & Positioning

- [ ] **Camera mount points** — Where will each court's camera be mounted? (wall, ceiling, pole?) Each court gets exactly 1 replay camera
- [ ] **Camera mounting height** — What height is available? Need clear overhead or elevated angle of the full court
- [ ] **Obstructions** — Any pillars, beams, netting, lighting fixtures, or other obstructions that would block camera view of the court?
- [ ] **Mounting surface material** — Concrete wall, drywall, metal beam, wood? (Determines mounting hardware needed)
- [ ] **Cable routing from camera to switch** — How will ethernet cable run from each camera mount point back to the network equipment? Through conduit, cable trays, exposed run? Measure the distance for each court

---

## 3. TV / Monitor for Apple TV (Instant Replay Display)

- [ ] **TV/monitor availability per court** — Is there already a TV/screen at each court, or do we need to supply them?
- [ ] **TV location per court** — Where is / will the TV be positioned? Visible to players?
- [ ] **HDMI accessibility** — Can we plug an Apple TV into each TV via HDMI?
- [ ] **Power outlet near each TV** — Apple TV needs power near the display

---

## 4. Network & Internet

### ISP / Internet Connection
- [ ] **ISP provider** — Which ISP? (PLDT, Globe, Converge, Sky?) Needed to document DMZ/port-forwarding procedure for that specific ISP router
- [ ] **Internet plan speed** — Upload speed is critical. Minimum recommended? (Replay clips need to upload to PodPlay servers via port 4000)
- [ ] **ISP router model** — Exact model number. Need to know if it supports DMZ mode or port forwarding (port 4000 TCP/UDP)
- [ ] **ISP router admin access** — Do we have admin login credentials to the ISP router? Can we configure DMZ or port forwarding?
- [ ] **Static IP availability** — Can a static IP be ordered from the ISP? (Preferred method; typically costs extra monthly). If not, DMZ or port forwarding with DDNS will be used
- [ ] **Backup internet available?** — Is there a secondary ISP line? The UDM has a backup internet port

### On-Site Network Infrastructure
- [ ] **Existing network equipment** — Is there any existing network infrastructure we need to work around, or is this a clean install?
- [ ] **Ethernet cabling in place?** — Are there ethernet runs from a central location to each court? If not, cabling needs to be installed BEFORE we arrive
- [ ] **Ethernet cable category** — Cat5e minimum, Cat6 preferred. Each court needs runs for: camera, iPad (POE), Apple TV
- [ ] **Number of ethernet drops per court** — Need at minimum 3 per court: (1) camera, (2) iPad via POE, (3) Apple TV. Confirm these are in place or planned

---

## 5. Equipment Room / Network Closet

- [ ] **Dedicated equipment room** — Is there a room or closet where the Unifi rack (UDM, switch, PDU, NVR, Mac Mini) will live?
- [ ] **Room location** — Where is it relative to the courts? All ethernet runs terminate here
- [ ] **Power outlets in equipment room** — How many? Need enough for: PDU (which powers UDM, switch, NVR, Mac Mini), plus ISP modem/router
- [ ] **Ventilation / cooling** — Equipment room must not overheat. Is there AC or ventilation? Mac Mini + networking gear generate heat
- [ ] **Physical security** — Can the room be locked? Equipment should not be publicly accessible
- [ ] **Rack or shelf space** — Is there a network rack, shelf, or table for the equipment? Need space for: UDM, switch, PDU, NVR, Mac Mini + Samsung SSD

---

## 6. Power

- [ ] **Voltage standard** — Philippines is 220V/60Hz. All equipment (UDM, switch, Mac Mini, etc.) must be compatible or have correct power adapters
- [ ] **Power stability** — Is the power supply stable? Frequent brownouts? If so, a UPS (uninterruptible power supply) is strongly recommended
- [ ] **Power outlets at each court** — For Apple TV and TV/monitor at each court location
- [ ] **POE switch port count** — Enough ports on the switch for all iPads (POE-powered) + cameras + Apple TVs? This is on us to spec, but need total court count first

---

## 7. iPad Placement (Per Court)

- [ ] **iPad mounting location per court** — Where will the iPad be positioned? (Wall mount, stand, counter?) Players interact with this for bookings/replays
- [ ] **POE ethernet drop at iPad location** — iPad is powered via POE adapter over ethernet, NOT plugged into a wall outlet. Ethernet must reach the iPad mount point
- [ ] **iPad security** — How will iPads be secured against theft? (Mounting bracket, cable lock, enclosure?)

---

## 8. Facility Access & Logistics

- [ ] **Facility contact person** — Name and phone number of the on-site person who can grant access and answer questions
- [ ] **Access hours** — When can the installation team access the facility? Any restrictions?
- [ ] **Loading / delivery access** — How does equipment get into the building? Elevator, stairs, loading dock? (Shipping boxes are heavy — UDM, switch, PDU, NVR, Mac Mini, screens)
- [ ] **Construction / renovation status** — Is the facility finished or under construction? Any upcoming renovations that could affect installation?
- [ ] **Other tenants / shared space** — Is this a shared facility? Any coordination needed with other parties?

---

## 9. Signage & Branding

- [ ] **Logo / branding assets** — Venue logo file needed for the PodPlay replay overlay. Must match the name in the RSC (Replay Service Configuration) sheet. Get the logo file in advance
- [ ] **Venue name (exact)** — The official customer name as it will appear in the PodPlay admin dashboard and DDNS (`telapark.podplaydns.com` or similar)

---

## 10. Regional / Philippines-Specific

- [ ] **Video standard confirmation** — Philippines uses PAL. Need to confirm during NJ training whether PAL works with the replay pipeline or if NTSC must be used regardless
- [ ] **Camera compatibility** — Confirm camera model works with PAL settings (25fps vs 30fps NTSC). Pending answer from NJ training
- [ ] **Payment terminal** — If there's an on-site payment kiosk or QR code display for GCash ([[Magpie]]), where does it go?
- [ ] **Time zone** — Asia/Manila (UTC+8). Needed for camera date/time config and replay timestamps

---

## Summary: Minimum Info Needed Before Installation

| Item | Why It's Needed |
|---|---|
| **Number of courts** | Determines ALL hardware quantities (cameras, iPads, Apple TVs, POE adapters, ethernet runs, switch port count) |
| **Court numbers/names** | Every piece of hardware gets labeled by court |
| **Floor plan / layout** | Cable run planning, camera placement, equipment room location |
| **Camera mount points + distances** | Ethernet cable lengths, mounting hardware |
| **TV situation per court** | Supply or existing? HDMI + power available? |
| **ISP details (provider, speed, router model, admin access)** | Network configuration on install day |
| **Static IP or DMZ capability** | Critical for Mac Mini reachability (port 4000) |
| **Ethernet infrastructure** | Must be cabled BEFORE install day — this is the biggest lead-time item |
| **Equipment room location + power** | Where everything lives |
| **Facility contact + access hours** | Logistics |
| **Venue name + logo** | Software/dashboard config |

---

## Notes

- The **ethernet cabling** is the single biggest pre-requisite. If it's not in place, installation cannot proceed. This should be done by a local contractor before the team arrives.
- Hardware quantities follow a simple formula: **1 per court** for cameras, iPads, Apple TVs, POE chargers, and monitors. Plus **1 each** for the shared equipment (UDM, switch, PDU, NVR, Mac Mini, SSD).
- Some questions (PAL vs NTSC, deployment server access) are pending answers from the [[2026-03 NJ PodPlay Training]] trip. Those boxes can't be fully checked until after training.
