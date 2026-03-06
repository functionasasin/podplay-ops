# Analysis: source-hardware-guide

**Source:** `docs/podplay-hardware-installation-guide.md`
**Aspect Code:** source-hardware-guide
**Wave:** 1 — Source Acquisition & Domain Mapping

---

## 1. Document Structure

Sections:
1. Introduction
2. Cable and Hardware Positioning
3. Cable Requirements
4. Mounting Options
5. Installation
6. Networking
7. Bluetooth Buttons
8. Shipping
9. Internet Speed Requirements
10. Disclaimer

---

## 2. System Tiers

### PodPlay Pro
- Per-court hardware: Display (65" TV), Kiosk (iPad), Replay Camera, Apple TV
- No access control, no security cameras

### PodPlay Autonomous
- All Pro components plus:
  - Automated door access control (reader + hub + lock)
  - Security cameras

### PodPlay Autonomous+
- All Autonomous components plus:
  - NVR (Network Video Recorder) with preinstalled hard drives

---

## 3. Per-Court Hardware

| Device | Notes |
|--------|-------|
| 65" Display (TV) | VESA 400x300; mounted at center court, net-side |
| Apple TV | Connected via HDMI to HDMI 1 on TV; Ethernet + power |
| iPad (Kiosk) | PoE-powered via adapter; mounted below display |
| iPad PoE Adapter | Hidden when possible |
| Replay Camera | Model: EmpireTech IPC-T54IR-ZE; mounted behind baseline |
| Bluetooth Buttons | 2 per court (Left + Right); pre-paired to iPad |

---

## 4. Mounting Heights & Positions

### Display & Kiosk
- **Display height:** 8'9" AFF (Above Finished Floor)
- **Kiosk height:** 4'8" AFF
- Both at center court, net-side (spectator/deck side)
- 120V duplex outlet near display Cat6 drop

### Replay Camera
- **Ideal distance from baseline:** 16–20 feet
- **Maximum distance:** 26 feet from baseline
- **Ideal height at 16–20' distance:** 11' AFF (~30-degree angle)
- Ceiling-mounted cameras must be at least 2' from adjacent court's baseline
- Opposing cameras must be at identical height

**Wall-mount height chart (by baseline distance):**

| Distance from Baseline | Height AFF |
|------------------------|------------|
| 21'–26'                | 12'        |
| 16'–20' (ideal)        | 11'        |
| 12'–15'                | 10'        |
| 9'–11'                 | 9'         |
| <9'                    | 8'         |

**Cable at camera location:** Leave 12 feet coiled

**Camera angle comparison:**
- 7' from baseline: baseline cut off, fish-eye effect, bird's-eye view
- 18' from baseline: captures behind foreground baseline, better angle, no fish-eye

---

## 5. Cable Requirements

### Not Provided by PodPlay (Customer/Installer Supplies)
- Cat6 cable
- Speaker cable
- 18/2 wire (door strike/maglock)
- 22/4 wire (push-to-exit button, door sensor)
- Door lock mechanisms (mag locks, electric strikes)
- Unistrut, Allthread, conduit, ceiling mounting brackets

### Pre-Determined Before Ordering
- TV mount type
- iPad mount type
- Camera mount accessories

### Cat6 Cable Specs
- Solid Copper Core
- UTP (Unshielded Twisted Pair)
- UL Rated
- Jacket: Riser or Plenum per local code
- Max run length: 100m from network rack (intermediate switch required if exceeded)
- PoE adapters sensitive to cable quality issues; certification recommended

### Cable Slack Requirements
- Replay camera Cat6: leave **12 feet** coiled at camera location
- Display Cat6: leave minimum **3 feet** coiled
- Kiosk Cat6: leave minimum **3 feet** coiled
- Labels required on both ends; must be tested and qualified

### Cable Drops Per Court (Pro Tier)
- 1x Cat6 for display
- 1x Cat6 for kiosk
- 1x Cat6 for replay camera
- **Total: 3x Cat6 home runs per court**
- 1x 120V duplex outlet per court

### Cable Drops Per Door (Autonomous Tier)
- 1x Cat6 (access control reader)
- 1x 18/2 wire (electric strike / maglock)
- 1x 22/4 wire (push-to-exit button)
- 1x 22/4 wire (door sensor, if required)

### Cable Drops Per Security Camera (Autonomous Tier)
- 1x Cat6 per camera

### Total Cat6 Estimation Formula

```
Courts_Cat6 = num_courts × avg_distance_ft × 3
Doors_Cat6  = num_doors × avg_distance_ft × 1
Cams_Cat6   = num_sec_cameras × avg_distance_ft × 1
Total_Cat6  = Courts_Cat6 + Doors_Cat6 + Cams_Cat6
```

**Example (from guide):**
- 8 courts × 200 ft × 3 = 4,800 ft
- 2 doors × 300 ft × 1 = 600 ft
- 8 security cameras × 150 ft = 1,200 ft
- **Total: 6,600 ft**

---

## 6. Mounting Options

### TV Mounting Surfaces
| Surface | Hardware |
|---------|----------|
| Drywall (wood studs) | Lag bolts |
| Drywall (metal studs) | Toggle bolts |
| Cinder block / Concrete | Tapcon screws, toggle bolts, or concrete anchors |
| Column | Unistrut + all-thread or articulating arm mount; conduit/wire molding for cables |
| Ceiling / I-beam | Ceiling TV mount (VESA bottom + beam clamps top); or Uni-Strut |

- **VESA compatibility:** 400 x 300 (400x300 VESA Tilt Mount included)
- Additional ceiling/column accessories NOT included

### iPad (Kiosk) Mounting Surfaces
| Surface | Notes |
|---------|-------|
| Fence | Pro-Signal 75x75 VESA bracket (provided on request); Cat6 through fence poles or painted conduit |
| Drywall | Drywall anchors in four holes; PoE adapter behind wall |
| Concrete | PoE adapter behind TV above; USB-C cable in painted conduit |
| Fence post (back-to-back) | VESA pole clamp mount; brackets bolted together around pole |
| Column | Plywood mounted to pole, case screwed to plywood |
| Column (padded) | Recess in padding, or mount on outside of padding |
| Floor kiosk | Contact PodPlay to discuss |

- iPad uses PoE adapter; ethernet into adapter, USB-C into iPad

### Replay Camera Mounting Surfaces
| Surface | Notes |
|---------|-------|
| Drywall | Install without junction box; Cat6 dongle routed into wall behind camera |
| Ceiling | Conduit or all-thread for support |
| Column | Junction box with 3/4" threaded conduit opening provided |
| Pole | Universal pole mount bracket (purchased separately) |

- Position secured by hex set screw
- Model: **EmpireTech IPC-T54IR-ZE**
- Junction box provided

### Security Camera Mounting Surfaces
| Surface | Notes |
|---------|-------|
| Drywall | Without junction box; Cat6 dongle into wall |
| 3/4" conduit | Junction box attaches to conduit |
| Pole | Junction box with hose clamp |
| Exterior | Use arm mount |

---

## 7. Device Labeling

Each device labeled with court number, installed on matching court:
- Replay camera
- Apple TV
- iPad
- iPad PoE Adapter

Switch and UDM include port diagrams; device connected to matching labeled port.

---

## 8. Apple TV Installation Notes

- Mount to wall: use two screws
- Mount to column: double-sided adhesive (NOT to back of TV — heat causes it to fall)
- Connect: Ethernet cable + power cable + HDMI cable → **HDMI 1** on TV

---

## 9. Access Control

**Supported Systems:**
- Kisi
- UniFi Access

**Components required:** Hub + Reader + Lock

**Lock type by door:**
| Door Type | Lock Type | Power Failure State |
|-----------|-----------|---------------------|
| Glass doors | Magnetic lock (mag lock) | Fail-safe (unlocked) |
| Panic bar doors | Electric strike lock | Fail-secure |

- Mag lock requires push-to-exit button; electric strike does NOT require push-to-exit
- UniFi Door Hub: Powered Lock Output = 12V DC @ up to 1A
- Higher amperage or fire code compliance → separate power supply or fire relay required

**KISI Wire Diagram Types:**
1. Standalone fail-secure electric strike with wet contact
2. Standalone fail-safe magnetic lock with wet contact
3. External power supply & fail-secure electric lock with dry contact
4. External power supply & fail-safe electric lock with dry contact
5. External power supply & fail-safe electric lock with REx and motion sensor with dry contact

---

## 10. Network Rack

### Rack Size
- **7–12U** depending on number of courts and service tier

### Component Order (top to bottom)
| Position | Component | Notes |
|----------|-----------|-------|
| Top | Mac Mini | 2U space; shelf provided |
| — | ISP Modem | If rack-mountable |
| — | Gateway (UDM) | — |
| — | Patch Panel | Inline couplers provided (punch-down keystones preferred) |
| — | Switch | Size varies by courts; large clubs may have two |
| — | NVR | Only Autonomous+ package |
| — | UPS | Always at BOTTOM; internal battery must be connected first |
| — | Power Distributor (PDU) | Can be mounted on back of rack |

### Installation Notes
- All equipment delivered **preconfigured**
- IT room requires **dedicated 20A circuit**
- All devices → PDU → UPS → wall outlet
- Open or closed rack acceptable depending on location

---

## 11. Front Desk Equipment

| Equipment | Model / Detail |
|-----------|----------------|
| Credit Card Terminal | BBPOS WisePOS E; Admin PIN: 07139 |
| QR Code Scanner | — |
| Web Cam | — |
| Computer | NOT included; any Windows or Mac; desktop recommended |

---

## 12. Bluetooth Buttons

- **Purpose:** Score keeping and instant replay initiation
- **Per court:** 2 buttons (Left + Right baseline positions)
- Mounted on acrylic sign affixed to fence or wall behind baseline
- Pre-paired to specific court iPad at factory
- Label format: "Court 2 Left", "Court 4 Right"

**Button Actions:**
| Action | Gesture |
|--------|---------|
| Score | Single press |
| Undo Score | Double press |
| Get Replay | Long press |

**Pairing Troubleshooting:**
1. Exit Guided Access / App Lock mode (go to home screen)
2. If still failing → factory reset the button (manufacturer manual)

---

## 13. Shipping

**Shipped preconfigured from PodPlay office (in PodPlay box):**
- Apple TV
- iPads
- Cameras
- All networking equipment

**Drop-shipped (not from PodPlay office):**
- TVs
- TV Mounts
- Network Rack
- UPS

---

## 14. Internet Speed Requirements

### Circuit Types
| Type | Notes |
|------|-------|
| Fiber | Symmetrical (1:1); best performance; highly recommended |
| Cable (Coax/Broadband/Copper) | Asymmetrical ~10:1 download:upload; average performance |
| 5G | NOT recommended as primary; backup use only; unreliable |
| Dedicated Enterprise Fiber | Enterprise use; very expensive; last resort |

**Starlink:** NOT compatible — lacks static IP and port forwarding support.

### Network Requirements
- 1x static IP address required, OR
- Forward TCP and UDP port 4000 to the PodPlay UDM (if double NAT)
- UDM pre-configured for DHCP (comes online automatically with DHCP modem)
- Static IP without DHCP: connect laptop directly to UDM to configure

**Backup circuit:** Recommended to prevent downtime; **mandatory for Autonomous venues**

### Speed Recommendations by Court Count (Complete Table)

| Courts | Fiber | Cable/Broadband | 5G Cellular | Dedicated Fiber |
|--------|-------|-----------------|-------------|-----------------|
| 1 | 50/50 | 60 Mbps upload | Highest Possible | 30/30 |
| 2 | 100/100 | 60 Mbps upload | Highest Possible | 30/30 |
| 3 | 100/100 | 60 Mbps upload | Highest Possible | 30/30 |
| 4 | 100/100 | 60 Mbps upload | Highest Possible | 30/30 |
| 5 | 150/150 | Highest Possible | Highest Possible | 50/50 |
| 6 | 150/150 | Highest Possible | Highest Possible | 50/50 |
| 7 | 150/150 | Highest Possible | Highest Possible | 50/50 |
| 8 | 150/150 | Highest Possible | Highest Possible | 50/50 |
| 9 | 150/150 | Highest Possible | Highest Possible | 50/50 |
| 10 | 150/150 | Highest Possible | Highest Possible | 50/50 |
| 11 | 150/150 | Highest Possible | Highest Possible | 50/50 |
| 12 | 200/200 | Highest Possible | Highest Possible | 50/50 |
| 13 | 200/200 | Highest Possible | Highest Possible | 50/50 |
| 14 | 200/200 | Highest Possible | Highest Possible | 50/50 |
| 15 | 200/200 | Highest Possible | Highest Possible | 50/50 |
| 16 | 200/200 | Highest Possible | Highest Possible | 75/75 |
| 17 | 200/200 | Highest Possible | Highest Possible | 75/75 |
| 18 | 200/200 | Highest Possible | Highest Possible | 75/75 |
| 19 | 200/200 | Highest Possible | Highest Possible | 75/75 |
| 20 | 300/300 | Highest Possible | Highest Possible | 100/100 |
| 21 | 300/300 | Highest Possible | Highest Possible | 100/100 |
| 22 | 300/300 | Highest Possible | Highest Possible | 100/100 |
| 23 | 300/300 | Highest Possible | Highest Possible | 100/100 |
| 24 | 300/300 | Highest Possible | Highest Possible | 100/100 |
| 25 | 400/400 | Highest Possible | Highest Possible | 100/100 |
| 26 | 400/400 | Highest Possible | Highest Possible | 150/150 |
| 27 | 400/400 | Highest Possible | Highest Possible | 150/150 |
| 28 | 400/400 | Highest Possible | Highest Possible | 150/150 |
| 29 | 400/400 | Highest Possible | Highest Possible | 150/150 |
| 30 | 400/400 | Highest Possible | Highest Possible | 150/150 |

---

## 15. Pre-Installation Requirements

- Pre-installation call with Andy Korzeniacki required before purchase and installation
  - Phone: 917-937-6896
  - Email: andyk@podplay.app
- TV mount type must be determined before ordering
- iPad mount type must be determined before ordering
- Camera mount accessories must be determined before ordering

---

## 16. Key Implications for Data Model

### Fields surfaced for `projects` table:
- `num_courts` (integer) — drives Cat6 calculation, ISP speed tier
- `num_doors` (integer) — drives Autonomous cable calc
- `num_security_cameras` (integer) — drives Autonomous cable calc
- `service_tier` (enum: pro, autonomous, autonomous_plus) — determines NVR inclusion
- `rack_size_u` (integer, 7–12) — informational
- `isp_circuit_type` (enum: fiber, cable, 5g, dedicated_fiber) — drives speed recommendation
- `has_backup_circuit` (boolean) — required for autonomous

### Seed data items identified:
- BBPOS WisePOS E (credit card terminal, qty per venue)
- EmpireTech IPC-T54IR-ZE (replay camera model)
- iPad + PoE Adapter
- Apple TV
- 65" Display (TV)
- Bluetooth Buttons (2 per court)
- Acrylic Signs for buttons
- Gateway (UDM)
- Switch (size varies)
- Mac Mini
- Patch Panel
- NVR (Autonomous+ only)
- UPS
- PDU (Power Distributor)
- QR Code Scanner (front desk)
- Web Cam (front desk)

### ISP speed table: seed as `isp_speed_requirements` lookup table
- Keys: (courts, circuit_type)
- Values: recommended speed string

### Cat6 formula: implemented in `logic-cable-estimation` aspect
- courts × avg_dist × 3 + doors × avg_dist + sec_cameras × avg_dist
