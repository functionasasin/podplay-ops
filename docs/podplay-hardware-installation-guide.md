---
type: reference
source: https://gist.github.com/clsandoval/94a2bd5b2aa8c651b2e721e2bb74fdef
related: [[Pod Play]], [[Andy]]
tags: [podplay, hardware, installation, guide]
ingested: 2026-03-01
---

# PodPlay Hardware Installation Guide

**The Future of Play, Today.**

---

## Table of Contents

- [Introduction](#introduction)
- [Cable and Hardware Positioning](#cable-and-hardware-positioning)
- [Cable Requirements](#cable-requirements)
- [Mounting Options](#mounting-options)
- [Installation](#installation)
- [Networking](#networking)
- [Bluetooth Buttons](#bluetooth-buttons)
- [Shipping](#shipping)
- [Internet Speed Requirements](#internet-speed-requirements)
- [Disclaimer](#disclaimer)

---

## Introduction

This guide contains all the necessary information to complete the installation of the PodPlay system.

PodPlay is the leading reservation system for sports clubs. The **PodPlay Pro** system includes a display, kiosk, and replay camera at each court. The **Autonomous** system builds on Pro, adding automated door access control and security cameras.

This manual will walk you through the installation of low-voltage cabling, TVs, iPads, cameras, access control, and the network rack.

### Pre-Installation Requirement

A call is required before purchase and installation.

**Please schedule with:**

**Andy Korzeniacki**
- Phone: 917-937-6896
- Email: andyk@podplay.app

For any questions during installation, please contact **Andy Korzeniacki**.

### Hardware & Materials

All required hardware is supplied unless otherwise specified.

Due to variations in site conditions and specific dependencies, the following items are **not provided**:

- **Cat 6 cable**
- **Speaker cable**
- **Other low-voltage cables** (e.g., 18/2, 22/4)
- **Door lock mechanisms** (mag locks, electric strikes)
- **Miscellaneous hardware** including Unistrut, Allthread, conduit, ceiling mounting brackets

### Items to Be Determined Before Ordering

- **TV mount type**
- **iPad mount type**
- **Camera mount accessories**

Additional materials such as miscellaneous hardware, wire molding, and paint may be required based on the installation environment.

---

## Cable and Hardware Positioning

### Court Layout

Each court includes the following hardware positioned as shown:

- **Display** — Mounted at center court, aligned with the net (on the spectator/deck side)
- **Kiosk (iPad)** — Mounted below the display, also aligned with the net
- **Replay Camera** — Mounted behind the baseline on the opposite side of the court

### Required Cable Drops

#### Pro Tier Requirements

Each court requires the following:

- **One (1) 120V duplex outlet receptacle** for the display and Apple TV
- **Three (3) Cat6 Ethernet cables** (home runs):
  - 1 for the display
  - 1 for the kiosk
  - 1 for the replay camera

#### Autonomous Tier Requirements

Each door with access control requires:

- **One (1) Cat6 Ethernet cable** (home run) – for the access control reader
- **One (1) 18/2 wire** (home run) – for the electric strike/maglock
- **One (1) 22/4 wire** (home run) – for the push-to-exit button
- **One (1) 22/4 wire** (home run) – for the door sensor (if required)

Each security camera requires:

- **One (1) Cat6 Ethernet cable** (home run)

### Display & Kiosk Cat6 Location

Both the **display** and **kiosk** are mounted at the center of the court, aligned with the net.

- **Display height:** 8'9" AFF (Above Finished Floor)
- **Kiosk height:** 4'8" AFF
- **120V receptacle** positioned near the display Cat6 drop
- **Display Cat6** positioned behind/beside the 65" display
- **Kiosk Cat6** positioned at the iPad location

**Display Mounting Options:**
- Drywall
- Concrete wall
- Columns
- Ceiling (I-beams)

**Kiosk Mounting Options:**
- Drywall
- Concrete wall
- Columns
- Fences

### Replay Camera Cat6 Location

**Replay Camera Mounting Options:**
- Drywall
- Concrete wall
- Ceiling (using conduit)

> Leave **12 feet** of cable coiled at the camera location.

**Replay Camera Mounting Guidelines:**

- The ideal distance from the baseline is **16–20 feet**, at **11' AFF** (~30 degree angle).
- If the 16–20' distance is not possible, use the **maximum distance available**.
- Cameras can be mounted up to **26' from the baseline**.
- If **ceiling mounted**, the camera should be positioned **no lower than 11' AFF** and **at least 2' from another court's baseline**.
- Ceiling mounted cameras positioned **over 20'** from the baseline should be mounted **12' AFF**.
- If **wall mounted**, refer to the chart below for the ideal height above finished floor.

| Distance from Baseline | Distance AFF |
|------------------------|-------------|
| 21'–26'                | 12'         |
| **16'–20'**            | **11'** *(ideal)* |
| 12'–15'                | 10'         |
| 9'–11'                 | 9'          |
| <9'                    | 8'          |

### Court Layout Example

This example layout showcases the strategic placement of TVs, iPads, replay cameras, and security cameras across four courts.

**Replay Cameras:**
- Ceiling-mounted at a height of 16 feet behind the baseline of the court they monitor, with each camera facing the other directly.
- This configuration ensures that the cameras do not obstruct each other's view and remain out of the recorded footage.

> **Important Note:** When installing cameras, always position them at least **2 feet away** from the baseline of the adjacent court to ensure optimal performance and safety.

### Replay Camera Placement Example

This example features **ceiling-mounted replay cameras** positioned **opposite each other** to maximize their **distance from the baseline**. Each camera is mounted approximately **2 feet behind the baseline** of the adjacent court, ensuring it is **not directly overhead**.

> **Note:** The opposing cameras **must** be at the same height, otherwise they will obstruct each other.

### Example Replay Camera Angles

**7' from baseline:**
- Baseline cut off
- Fish eye effect noticeable
- More bird's eye view

**18' from baseline:**
- Captures behind foreground baseline
- Better angle
- No fish-eye effect

---

## Cable Requirements

### Cat 6 Cable Requirements

- For replay cameras Cat6, leave a minimum of **6' of cable** coiled at the required location
- For display and kiosk Cat6, leave a minimum of **3' of cable** coiled at the required location
- Cables must be **terminated** and **labeled** on both ends
- Cables must be at least **tested** and **qualified**. **Certification** is highly recommended.
  - > **Note:** The PoE adapters are very sensitive to cable issues. We have seen intermittent issues with scoreboards and replays result from poorly terminated cables, overly tightened zip ties, runs exceeding 100m.

**Cat6 cable length:**
- Keep the cable runs as short as possible to limit bandwidth issues
- Cable runs that exceed **100m** from the network rack require an intermediate switch to extend the run
  - Please contact us to discuss additional switch requirements
  - Additional switches can be purchased on the UniFi store

**Cat 6 requirements:**
- Determine specific jacket rating (riser/plenum) based on installation location and local code
- Solid Copper Core
- UTP (unshielded twisted pair)
- UL Rated

**Installation:**
- Determine whether conduit is required based on local code and aesthetics. Conduit is preferred for walls where cable cannot be run behind wall. Conduit is not required on the ceiling unless required by local code.
- Cat6 cable for the display and kiosk can be:
  - Punched through the wall
  - Terminated with an ethernet wall plate
  - Left inside a junction box
- Cat6 cable for the display, kiosk, and cameras can be installed:
  - Behind the wall (no conduit)
  - Behind the wall (in conduit)
  - On the wall (in conduit)
  - On the wall behind wire/cable molding

### Total Cat 6 Length Estimation Calculation

**Courts:**
Number of courts x average distance of the courts from the network rack x 3 drops per court = Total length of Cat6 required for courts

> *Example: 8 courts x 200 ft. x 3 drops = 4,800 ft.*

**Doors with access control:**
Number of doors with access control x average distance of doors from network rack x 1 drop = Total length of Cat6 required for door access

> *Example: 2 doors x 300 ft. x 1 drop = 600 ft.*

**Security Cameras:**
Number of security cameras x average distance of cameras from network rack = Total length of Cat6 required for security cameras

> *Example: 8 security cameras x 150 ft = 1,200 ft.*

**Total length of Cat6** = Total for courts + Total for door access + Total for security cameras

> *Example: 4,800 ft. + 600 ft. + 1,200 ft. = 6,600 ft.*

---

## Mounting Options

### TV Mounting Options

#### TVs — Drywall

**Drywall** is the easiest mounting method when there is drywall beside the court.

- Run power in conduit and Ethernet behind the wall whenever possible.
- If using **wood studs**, **lag bolts** should be employed.
- If using **metal studs**, **toggle bolts** are recommended.

#### TVs — Cinder Block / Concrete

- If cables cannot be run behind the wall, use **conduit or wire molding** painted the color of the wall.
- Mount using **Tapcon screws**, **toggle bolts**, or **concrete anchors**.

#### TVs — Column

- When mounting to a column, use **painted conduit or wire molding** for a clean installation.
- If the column is padded, the iPad can be mounted **inside the padding** or **on top of it**.
- **Unistrut and all-thread** are used to securely fasten the display to the column.
- **Articulating Mounts** can also be used to mount TVs to columns.
- A **120V outlet** should be installed **behind the display** or on the **side of the column** for proper cable management.

#### TVs — Ceiling / I-Beam

- For **I-beam-mounted installations**, a **ceiling TV mount** is used, featuring a **VESA interface on the bottom** and **beam clamps on the top** for secure attachment.
- Alternative ceiling mount solutions, such as **Uni-Strut**, can also be used.

### Camera Mounting Options

**Drywall:**
- For drywall-mounted cameras, running **Cat6 behind the wall** is the preferred installation method.
- A **camera-specific junction box** is used to house any excess cable.

**Ceiling:**
- For ceiling-mounted installations, **conduit or all-thread** can be used for support.

**Column:**
- The junction box featuring a **3/4" threaded opening for conduit** will be provided.

### iPad Mounting Options

#### iPad — Fence

- For **fence-mounted installations**, a **Pro-Signal 75x75 VESA mounting bracket** can be provided upon request.
- The **Cat6 cable** can be concealed within **fence poles** or routed through **painted conduit** to the iPad for a cleaner installation.

#### iPad — Drywall / Column

- For **columns wrapped in padding**, a hole can be cut to recess the iPad case, or the iPad can be mounted **on the outside of the padding**.
- When mounting on a **column**, it is best to **conceal the Cat6 inside the column**. If this is not possible, use **painted conduit or wire molding** for a clean installation.
- A **floor standing kiosk** option is also available.

---

## Installation

### Device Labeling and Network Connections

**Device Labeling:**

Each of the following devices will be labeled with a specific court number and must be installed on the corresponding court:

- Replay camera
- Apple TV
- iPad
- iPad PoE Adapter

**Switch Port Connections:**

The switch and UDM will include port diagrams. Each device must be connected to the port that matches its corresponding label.

### iPad + Case Installation

- iPads are powered with **PoE** and an adapter is required. Plug the ethernet cable into the adapter and the USB-C side into the iPad.
- **PoE adapter should be hidden** when possible.
- Pre-installed **adjustable brackets** are used to keep the iPad in place. Pinch the two vertical pieces to slide the adjustable bracket in and out.
- A **key** is used to lock/unlock the case. **Be sure to keep the keys for the customer.**

**Drywall:**
- Use drywall anchors in the four holes
- Cut a hole behind the case large enough for the PoE adapter to fit
- PoE adapter will be kept behind the wall

**Concrete:**
- If mounting on concrete, mount the PoE adapter behind the TV above
- Drop the USB-C cable down from the TV in painted conduit or wire molding

**Fence Post:**
- Use VESA pole clamp mount
- If mounting two cases back to back, pole mount brackets can be bolted together around the pole

**Column Mounting:**
- Plywood can be mounted to the pole and the case screwed into the plywood

**Kiosk:**
- If a floor mounted kiosk is required, call to discuss options

### TV & Apple TV Installation

**Drywall installation:**
- Ensure Ethernet, duplex outlet and Apple TV are hidden behind the TV

**I-beam installation:**
- A ceiling mount and beam clamps are required
- Install duplex outlet to a box above the TV
- Mount Apple TV on the I-beam and run cables through the mount
  - Longer HDMI cable will be required

**Column installation:**
- Unistrut and All-thread can be used to make a bracket
- An articulating arm mount can also be used
- Install duplex outlet on the side of the column or behind the TV
- Mount the Apple TV on the side of the column or behind the TV

- Use zip ties or velcro to organize cables
- TVs are compatible with **VESA 400 x 300**

> **Note:** Wall plate for Cat6 is **not** required.

> **Note:** The 400 x 300 **VESA Tilt Mount is included**. Any **additional mounting accessories** required for ceiling or column mounting are **not** included.

### Apple TV Installation

- When **mounting to a wall**, use **two screws** for secure attachment.
- When mounting the **TV to a column** or hanging it, **double-sided adhesive** can be used to secure the Apple TV mount. It is best to adhere the **Apple TV to the column** or secure it to an **I-beam**. Adhering it to the back of the TV may cause it to fall off due to the heat generated by the TV.
- Connect the **Ethernet cable**, **power cable**, and **HDMI cable** to the Apple TV, and ensure the **HDMI cable is connected to HDMI 1** on the TV.

### Replay Camera Installation

**Model:** EmpireTech IPC-T54IR-ZE

A **junction box** will be provided.

- When mounting to **drywall**, the camera can be installed **without the junction box** for a more streamlined appearance. The **Cat6 dongle** can be routed into the wall behind the camera.
- For **pole mounting**, a **universal pole mount bracket** can be purchased separately.
- The camera's position is secured using a **hex set screw** — adjust the position, then tighten the set screw to lock it in place.

### Security Camera Installation

A **junction box** will be provided, which can be attached to **drywall** using drywall anchors, to **3/4" conduit**, or to a **pole** using a hose clamp.

- When mounting to **drywall**, the camera can be installed **without the junction box** for a more streamlined appearance. The Cat6 dongle can be routed into the wall behind the camera.
- For **exterior installations**, the **arm mount** should be used.

### Access Control Installation

The access control system can be either **Kisi** or **UniFi Access**, which requires a **hub**, **reader**, and **lock**.

The type of lock used will depend on the door style and whether it must be configured as **fail-safe** or **fail-secure**.

- For **glass doors**, **magnetic locks (mag locks)** are used. These default to an **unlocked (open) state** in the event of a power failure. This setup also requires a **push-to-exit button**.
- For doors with a **panic bar**, an **electric strike lock** is used, and a push-to-exit button is **not required**.

The **UniFi Door Hub** has a Powered Lock Output of **12V DC at up to 1A**. If the lock requires higher amperage or if fire code compliance necessitates fire integration, a separate **power supply or fire relay** will be required.

**KISI Wire Diagrams:**
1. Standalone fail-secure electric strike with wet contact
2. Standalone fail-safe magnetic lock with wet contact
3. External power supply & fail-secure electric lock with dry contact
4. External power supply & fail-safe electric lock with dry contact
5. External power supply & fail-safe electric lock with REx and motion sensor with dry contact

---

## Networking

### Network Rack Installation

All equipment will be delivered **preconfigured**.

If the customer has an existing network rack for AV/IT equipment, the hardware may be installed within their rack. The installation will require **7–12U**, depending on the number of courts and the customer's service tier.

**Key installation notes:**

- The **uninterruptible power supply (UPS)** must always be installed **at the bottom of the rack**.
- A **2U space** should be reserved for the Mac Mini, and a shelf will be provided for mounting.
- A **patch panel with inline couplers** will be provided (to accommodate installers without punch down tools). However, if you are capable of using **punch down keystones**, they are recommended for better reliability.
- To optimize space, the **power distribution unit (PDU)** can be mounted on the **back of the rack**.
- All devices should be connected to the **PDU**, which is then plugged into the **UPS**, and the UPS should be connected to a **wall outlet**.
- The **IT room must have a dedicated 20A circuit** to support the equipment.
- If the customer has a **rack-mountable modem**, it can be installed within the rack.
- The network rack can be **open** or **closed**, depending on the installation location.

**Rack Components (top to bottom):**

| Component | Notes |
|-----------|-------|
| Mac Mini | — |
| ISP Modem | If rack mountable |
| Gateway | — |
| Patch Panel | — |
| Switch | Size varies by number of courts; large clubs may have two switches |
| NVR (Hard Drives preinstalled) | Only included with 'Autonomous +' package |
| UPS | Internal battery must be connected before starting |
| Power Distributor | Model may differ |

> **Note:** Before starting the UPS, the internal battery must be connected.

### Front Desk

**Stripe Credit Card Terminals:** BBPOS WisePOS E
- Admin PIN: 07139

Additional front desk equipment:
- QR Code Scanner
- Web Cam

**Front Desk Computers:**
Computers are not included with the PodPlay package. However, any Windows or Mac computer will work. Desktops are recommended.

---

## Bluetooth Buttons

### Scoring/Replay Buttons

The PodPlay Pro system uses **Bluetooth buttons** paired with the **iPads** on each court to keep **score** and initiate **instant replays**.

Each button is affixed to an **acrylic sign**, which is mounted to a **fence** or **wall** behind the **baseline** of the court. Each court has **two buttons** — one on either side of the baseline.

The buttons come **pre-paired** with the iPads, with each button **assigned to a specific court** (e.g., *Court 2 Left* or *Court 4 Right*). If a button requires **re-pairing**, refer to the PodPlay knowledge base article for step-by-step instructions.

**Button Actions:**

| Action | Gesture |
|--------|---------|
| Score | Single press |
| Undo Score | Double press |
| Get Replay | Long press |

### Troubleshooting Pairing Issues

If a pairing attempt fails:

1. Ensure the iPad is not in *Guided Access* or *App Lock* mode by exiting to the home screen.
2. If the iPad is **unlocked** and the button still does not pair, the button may need to be **reset**. Follow the factory reset instructions in the manufacturer's user manual.

---

## Shipping

All necessary equipment will be shipped to the customer's location.

Any equipment that requires configuration will be shipped **pre-configured** from the PodPlay office in a **PodPlay box**. This includes items such as **Apple TV**, **iPads**, **cameras**, and all **networking equipment**.

The only items that will be **drop-shipped** are:

- TVs
- TV Mounts
- Network Rack
- UPS

---

## Internet Speed Requirements

### Circuit Types

1. **Fiber:** Fiber internet is symmetrical, providing equal download and upload speeds (1/1). Highly recommended if available — provides the best performance for the cost.

2. **Cable:** Also known as Coax/Broadband/Copper. Cable internet is asymmetrical and bandwidth typically follows a 10:1 ratio (e.g., 100 Mbps download / 10 Mbps upload). This asymmetry can impact service quality — especially for replays. Provides average performance at a reasonable cost.

3. **5G:** Not recommended as the Primary ISP as the connection is not 100% reliable. Suggested as a **backup** internet service or if no other service is available.

4. **Dedicated Enterprise Fiber Circuit:** Used for enterprise customers and is very expensive. Only recommended as a last resort if other services are not available.

> **Note:** PodPlay systems are **not compatible with Starlink** internet service due to Starlink's lack of support for static IP addresses and port forwarding.

### Network Requirements

- **PodPlay requires one static IP address** OR
- If double NAT is in place, **forward TCP and UDP on port 4000** to the PodPlay UDM
- The UniFi UDM Gateway is pre-configured for DHCP. If the modem/router is still issuing DHCP, the UDM will come online automatically. If a static IP has been assigned and DHCP is not available, a laptop must be connected directly to the UDM to configure the static IP.
- For assistance, please contact PodPlay.

> *We recommend having a backup circuit to prevent downtime. This is especially important for Autonomous clubs.*

### Internet Speed Recommendations Chart

| # Courts | Fiber | Cable/Broadband | 5G Cellular | Dedicated Fiber |
|----------|-------|-----------------|-------------|-----------------|
| 1 | 50/50 | 60 Mbps upload | Highest Possible | 30/30 |
| 2 | 100/100 | 60 Mbps upload | Highest Possible | 30/30 |
| 3 | 100/100 | 60 Mbps upload | Highest Possible | 30/30 |
| 4 | 100/100 | 60 Mbps upload | Highest Possible | 30/30 |
| 5 | 150/150 | Highest Possible Upload | Highest Possible | 50/50 |
| 6 | 150/150 | Highest Possible Upload | Highest Possible | 50/50 |
| 7 | 150/150 | Highest Possible Upload | Highest Possible | 50/50 |
| 8 | 150/150 | Highest Possible Upload | Highest Possible | 50/50 |
| 9 | 150/150 | Highest Possible Upload | Highest Possible | 50/50 |
| 10 | 150/150 | Highest Possible Upload | Highest Possible | 50/50 |
| 11 | 150/150 | Highest Possible Upload | Highest Possible | 50/50 |
| 12 | 200/200 | Highest Possible Upload | Highest Possible | 50/50 |
| 13 | 200/200 | Highest Possible Upload | Highest Possible | 50/50 |
| 14 | 200/200 | Highest Possible Upload | Highest Possible | 50/50 |
| 15 | 200/200 | Highest Possible Upload | Highest Possible | 50/50 |
| 16 | 200/200 | Highest Possible Upload | Highest Possible | 75/75 |
| 17 | 200/200 | Highest Possible Upload | Highest Possible | 75/75 |
| 18 | 200/200 | Highest Possible Upload | Highest Possible | 75/75 |
| 19 | 200/200 | Highest Possible Upload | Highest Possible | 75/75 |
| 20 | 300/300 | Highest Possible Upload | Highest Possible | 100/100 |
| 21 | 300/300 | Highest Possible Upload | Highest Possible | 100/100 |
| 22 | 300/300 | Highest Possible Upload | Highest Possible | 100/100 |
| 23 | 300/300 | Highest Possible Upload | Highest Possible | 100/100 |
| 24 | 300/300 | Highest Possible Upload | Highest Possible | 100/100 |
| 25 | 400/400 | Highest Possible Upload | Highest Possible | 100/100 |
| 26 | 400/400 | Highest Possible Upload | Highest Possible | 150/150 |
| 27 | 400/400 | Highest Possible Upload | Highest Possible | 150/150 |
| 28 | 400/400 | Highest Possible Upload | Highest Possible | 150/150 |
| 29 | 400/400 | Highest Possible Upload | Highest Possible | 150/150 |
| 30 | 400/400 | Highest Possible Upload | Highest Possible | 150/150 |

---

## Disclaimer

### Professional Installation Required

The installation of the PodPlay system, including but not limited to TVs, iPads, cameras, and IT equipment, should be performed by qualified professionals. This guide provides general instructions and is not intended to replace or override the manufacturer's installation guidelines.

### Follow Manufacturer's Instructions

It is imperative that all installation work strictly adheres to the specific installation instructions provided by each manufacturer. PodPlay does not guarantee the performance or safety of the system if the manufacturer's guidelines are not followed.

### Limitation of Liability

PodPlay is not liable for any damages, losses, or injuries arising from the installation, use, or maintenance of the system, regardless of whether the installation was performed properly. The company or individual performing the installation assumes all responsibility for any issues that arise. By using this guide, you acknowledge and agree that you are responsible for ensuring that all installations comply with applicable standards and manufacturer specifications.

### Confidentiality

The design, specifications, and documentation provided in this guide are confidential and proprietary to PodPlay. You are prohibited from copying, reproducing, distributing, or disclosing any part of this guide or its contents to third parties without the express written consent of PodPlay. Any unauthorized use or disclosure of this information is strictly prohibited and may result in legal action.

### Code Compliance

All installers are required to adhere to all applicable local codes and regulations during the installation process. In the event of any discrepancies or uncertainties, the local codes and regulations shall take precedence. Installers must rely on local design professionals to ensure full compliance with these codes and regulations. It is the responsibility of each installer to be knowledgeable about and act in accordance with all relevant local requirements to guarantee a safe and compliant installation.
