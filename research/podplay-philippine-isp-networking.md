---
source: Web research on Philippine ISP networking for PodPlay venue setup
date: 2026-02-20
related: [[Pod Play]], [[Pod Play SEA]], [[podplay-asia-infrastructure-analysis]], [[podplay-config-guide-v1]]
tags: [podplay, infrastructure, networking, philippines, isp, port-forwarding]
---

# Philippine ISP Networking Research for PodPlay Venues

Research into PLDT, Globe, and Converge ISP capabilities for PodPlay venue deployment. The core requirement is **incoming TCP/UDP traffic on port 4000** reaching a Mac Mini (192.168.32.100) inside the venue, through the chain:

```
Internet → ISP Router → UDM (Unifi Dream Machine) → Mac Mini (192.168.32.100:4000)
```

---

## Executive Summary

| Feature | PLDT | Globe | Converge |
|---|---|---|---|
| **Static IP (Residential)** | Not available | Not available | Available on Plan 2500+ (₱650/mo add-on), but inconsistent support |
| **Static IP (Business)** | Free with Beyond Fiber (from ~₱2,500/mo) | ₱1,000/mo add-on on GFiber Biz (from ₱1,899/mo) | ₱700/mo add-on on FlexiBIZ Peak (from ₱3,000/mo) |
| **CGNAT** | Yes (residential, since ~2020) | Yes (residential) | Yes (all residential) |
| **DMZ Support** | Yes (admin/superadmin access required) | Yes (even basic user can configure) | Yes (admin access required) |
| **Port Forwarding** | Yes (requires adminpldt/superadmin) | Yes (requires admin access) | Yes (but useless without public IP) |
| **Router Admin Access** | 192.168.1.1 | 192.168.254.254 | 192.168.1.1 or 192.168.100.1 |
| **Bridge Mode** | Possible with superadmin | Possible with admin | Possible with superadmin |
| **Recommendation** | Business plan (Beyond Fiber) | Business plan (GFiber Biz) | Business plan (FlexiBIZ Peak) |

**Bottom line: All three ISPs use CGNAT on residential plans, which completely blocks incoming connections. A business plan with a static/public IP is mandatory for PodPlay venues.**

---

## 1. PLDT

### 1.1 Static IP Availability

- **Residential (PLDT Home Fibr):** Static IP is NOT available. All residential subscribers get dynamic private IPs behind CGNAT.
- **Business (PLDT Beyond Fiber / FibrBiz):** Static IP is included FREE with Beyond Fiber MSME plans.
  - Beyond Fiber plans: ~₱2,500/mo (50 Mbps) up to higher tiers at 100/300/500 Mbps
  - FibrBiz additional static IPs: ₱2,250/mo for a /29 block (5 usable IPs), VAT exclusive
  - 24-month contract term, 0 OTC standard
  - Includes Cisco Meraki WiFi AP, enterprise-grade features
  - 90% speed guarantee

### 1.2 CGNAT Status

- **All residential plans are behind CGNAT** since approximately 2020.
- New customers are automatically placed on CGNAT.
- Even existing customers may be moved to CGNAT via firmware updates or service resets.
- CGNAT detection: Check WAN VLAN — if it's 1030, you're on CGNAT. Or run tracert and look for 100.64.x.x hops.
- You can call 171 to request CGNAT removal (get a real dynamic public IP), but this may not always work and is a temporary fix — the IP is still dynamic.

### 1.3 Router Admin Access

- **Default Gateway:** 192.168.1.1
- **Login URL:** `https://192.168.1.1/login.html`
- **Three access levels on Fiberhome routers:**

| Level | Username | Password | Access |
|---|---|---|---|
| Basic admin | admin | admin or 1234 | WiFi name/password, basic settings only |
| adminpldt | adminpldt | 1234567890 or 0123456789 | Port forwarding, VPN, DNS, DMZ, full config |
| superadmin | fiberhomesuperadmin | sfuhgu | Root access, bridge mode, VLAN config |

**Important:** PLDT aggressively changes passwords via OTA firmware updates. The superadmin credentials vary by model and firmware version:

| Model / Firmware | Login URL | Username | Password |
|---|---|---|---|
| AN5506-04-F/FA/FAT (2019) | https://192.168.1.1/fh | fiberhomesuperadmin | sfuhgu |
| AN5506-04-FA (RP2631) / HG6245D (RP2662) | https://192.168.1.1/fh | f\~i!b@e#r$h%o^m\*esuperadmin | s(f)u\_h+g\|u |
| Newer firmware (RP2662+) | https://192.168.1.1/fh | (complex encoded string) | (complex encoded string) |

### 1.4 DMZ Configuration

- **URL:** `http://192.168.1.1/application/dmz.asp`
- Simple interface: enable/disable toggle + DMZ Host IP field
- Requires adminpldt or superadmin access
- Set DMZ host to the UDM's WAN IP (e.g., 192.168.1.100 if PLDT router is on 192.168.1.0/24)

### 1.5 Port Forwarding

- **URL:** `http://192.168.1.1/application/port_forwarding.asp`
- Available under Application menu with adminpldt access
- Port forwarding is locked behind basic admin — need adminpldt or superadmin
- **Note:** Port forwarding is irrelevant if behind CGNAT. Get a public IP first.

### 1.6 Recommended Setup for PodPlay

1. Subscribe to **PLDT Beyond Fiber** (business plan, includes free static IP)
2. Log in with adminpldt/superadmin credentials
3. Set DMZ host to UDM's WAN IP address
4. On UDM: forward port 4000 TCP/UDP to Mac Mini at 192.168.32.100
5. Disable WiFi on PLDT router (UDM handles WiFi)
6. Alternatively, set PLDT router to bridge mode (requires superadmin) so UDM gets the public IP directly

---

## 2. Globe

### 2.1 Static IP Availability

- **Residential (Globe At Home):** Static IP is NO LONGER available. Previously offered on Platinum plans, then as ₱750/mo add-on, now completely removed from residential.
- **Business (GFiber Biz):** Static IP available as add-on for ₱1,000/mo.
  - GFiber Biz plans: ₱1,899/mo (20 Mbps) to ₱9,499/mo (1 Gbps)
  - Includes free modem, free landline with unlimited calls, free installation
  - Choice of Microsoft 365 or Google Workspace license, or TP-Link WiFi Mesh (50 Mbps+ plans)
  - Enterprise: Globe Freeway IP for dedicated fixed bandwidth

### 2.2 CGNAT Status

- **Residential plans use CGNAT.** Globe assigns private IPs to residential customers.
- Mixed community reports on severity — some areas may still get dynamic public IPs, but this is not guaranteed.
- If you do get a public IP (even dynamic), port forwarding works on Globe routers.
- Requesting a public IP on residential may require calling Globe and negotiating.

### 2.3 Router Admin Access

- **Default Gateway:** 192.168.254.254
- **Login URL:** `http://192.168.254.254`
- **Two access levels:**

| Level | Username | Password | Access |
|---|---|---|---|
| Basic user | user | @l03e1t3 | WiFi password changes only |
| Admin | (varies by model) | (varies by model) | Full access including port forwarding, DMZ |

**Huawei HG8245H (common Globe router):**
- Admin password: `globe@XXXXXX` where XXXXXX = last 6 characters of router's MAC address (uppercase)
- MAC address is on the sticker on bottom/back of router

### 2.4 DMZ Configuration

- DMZ can be configured even with the basic user login (username/password on modem sticker) in many cases
- Set static IP on UDM's WAN interface (e.g., 192.168.254.100)
- Set DMZ host IP to the UDM's address (192.168.254.100)
- Set subnet to 255.255.255.0, gateway to 192.168.254.254
- Disable wireless radio on Globe modem (UDM handles WiFi)

### 2.5 Port Forwarding

- Available in admin panel under Firewall/Security section
- Supports standard port forwarding rules (internal IP, port range, protocol)
- **Useless without a public IP** — CGNAT blocks all incoming traffic at the ISP level

### 2.6 Recommended Setup for PodPlay

1. Subscribe to **GFiber Biz** (business plan)
2. Add **static IP** (₱1,000/mo add-on)
3. Assign UDM a static IP on the Globe router's subnet (192.168.254.100)
4. Set Globe router DMZ to 192.168.254.100
5. On UDM: forward port 4000 TCP/UDP to Mac Mini at 192.168.32.100
6. Disable WiFi on Globe router
7. Alternatively, request bridge mode from Globe (may require calling support)

---

## 3. Converge

### 3.1 Static IP Availability

- **Residential (FiberX):** Technically available on Plan 2500+ as a ₱650/mo add-on, BUT:
  - Frontline customer service often doesn't know about this option
  - You may need to escalate to a supervisor
  - Some reps will flatly say "not possible"
  - Requires persistence and luck with which agent you speak to
- **Business (FlexiBIZ Peak):** Static IP available as ₱700/mo add-on
  - FlexiBIZ Peak plans: ₱3,000/mo (50 Mbps) to ₱18,000/mo (300 Mbps)
  - Symmetrical upload/download speeds
  - 24-month lock-in, ₱2,500 installation fee
  - Legacy iBIZ plans included static IP by default but are being phased out

### 3.2 CGNAT Status

- **ALL residential subscribers are behind CGNAT (double NAT).** This is the most aggressive CGNAT implementation of the three ISPs.
- No dynamic public IP is available on residential plans at all.
- Port forwarding is completely non-functional on residential plans without a public IP.
- Even after configuring port forwarding and DMZ on the router, external port checks will show ports as closed.

### 3.3 Router Admin Access

Default gateway and credentials depend on the router brand Converge issued:

| Router Brand | Default IP | Username | Password |
|---|---|---|---|
| **Huawei EG8245H5** | 192.168.100.1 | root | adminHW |
| **Huawei (alt)** | 192.168.100.1 | telecomadmin | admintelecom or [email protected] |
| **FiberHome** | 192.168.1.1 | user1 or user2 | 12345 or user1234 or user12345 |
| **ZTE F670L** | 192.168.1.1 | (on sticker) | (on sticker) |
| **Cisco** | 192.168.1.1 | (blank) | (blank) |

**SuperAdmin access** is needed for bridge mode and advanced settings. SuperAdmin credentials are model-specific and not always publicly documented for Converge routers (unlike PLDT). Check the router sticker or contact Converge.

### 3.4 DMZ Configuration

- Found under Firewall or Security section in admin panel
- For ZTE F670L: Application → DMZ (vertical menu) or Internet → Security → DMZ (horizontal menu)
- Enable DMZ and set host IP to UDM's WAN address
- **DMZ is useless without a public IP** — traffic never reaches the ISP router if behind CGNAT

### 3.5 Port Forwarding

- For FiberHome: Application → Port Forwarding
- For ZTE: Application → Port Forwarding or Internet → Security → Port Forwarding
- Standard fields: internal IP, port range, protocol (TCP/UDP)
- **Completely non-functional behind CGNAT** — this is the most common complaint on Philippine tech forums about Converge

### 3.6 Recommended Setup for PodPlay

1. Subscribe to **FlexiBIZ Peak** (business plan) with **static IP add-on** (₱700/mo)
   - Or try to get static IP on residential Plan 2500+ (₱650/mo add-on) — but this is unreliable
2. Log in with admin/superadmin credentials
3. Set DMZ host to UDM's WAN IP
4. On UDM: forward port 4000 TCP/UDP to Mac Mini at 192.168.32.100
5. Disable WiFi on Converge router
6. Alternative: Set Converge router to bridge mode (requires SuperAdmin on ZTE F670L)

---

## UDM (Unifi Dream Machine) Setup Behind ISP Router

Regardless of ISP, the UDM configuration is the same:

### Option A: ISP Router in DMZ Mode (Recommended)

```
Internet → ISP Router (public IP) → [DMZ] → UDM (192.168.X.100) → Mac Mini (192.168.32.100)
```

1. Give UDM a static IP on the ISP router's subnet
   - PLDT: 192.168.1.100 (gateway 192.168.1.1)
   - Globe: 192.168.254.100 (gateway 192.168.254.254)
   - Converge (Huawei): 192.168.100.100 (gateway 192.168.100.1)
   - Converge (others): 192.168.1.100 (gateway 192.168.1.1)
2. Set ISP router's DMZ host to UDM's IP
3. On UDM, create port forwarding rule:
   - Port: 4000
   - Protocol: TCP/UDP
   - Forward to: 192.168.32.100 (Mac Mini)
4. Disable WiFi on ISP router

### Option B: ISP Router in Bridge Mode (Best, but harder)

```
Internet → ISP Modem (bridged) → UDM (gets public IP directly) → Mac Mini (192.168.32.100)
```

1. Access ISP router with superadmin
2. Set to bridge mode (disables NAT/DHCP/WiFi on ISP device)
3. UDM WAN interface gets the public static IP directly
4. Port forward 4000 on UDM to 192.168.32.100
5. **Advantage:** Eliminates double NAT entirely, UDM has full control

### Avoiding IP Conflicts

- If ISP router uses 192.168.1.0/24 (PLDT/Converge), make sure UDM LAN is on a different subnet (192.168.32.0/24 for the Replay VLAN — already different, good)
- The UDM WAN-side IP must be on the ISP router's subnet
- The UDM LAN-side devices (Mac Mini at 192.168.32.100) are on a completely separate VLAN

---

## Verification Checklist

After setup, verify the chain works:

1. **Check ISP router WAN IP:** Should be a real public IP (not 10.x.x.x, 100.64.x.x, or 192.168.x.x)
2. **Check UDM WAN IP:** Should be on ISP router's LAN subnet (or public IP if bridged)
3. **Test port 4000 externally:** Use https://www.yougetsignal.com/tools/open-ports/ or similar
4. **Test from PodPlay cloud:** Confirm CUSTOMER.podplaydns.com:4000 resolves and connects
5. **DDNS update:** Verify Mac Mini cron job is updating FreeDNS with correct public IP

---

## Cost Comparison for PodPlay Venue

| ISP | Plan | Speed | Monthly Cost | Static IP | Total Monthly |
|---|---|---|---|---|---|
| **PLDT Beyond Fiber** | MSME 100 Mbps | 100 Mbps | ~₱2,500+ | Included | ~₱2,500+ |
| **PLDT Beyond Fiber** | MSME 300 Mbps | 300 Mbps | ~₱3,500+ | Included | ~₱3,500+ |
| **Globe GFiber Biz** | 100 Mbps | 100 Mbps | ~₱2,499 | +₱1,000 | ~₱3,499 |
| **Globe GFiber Biz** | 200 Mbps | 200 Mbps | ~₱3,499 | +₱1,000 | ~₱4,499 |
| **Converge FlexiBIZ Peak** | 50 Mbps | 50 Mbps (sym) | ₱3,000 | +₱700 | ₱3,700 |
| **Converge FlexiBIZ Peak** | 120 Mbps | 120 Mbps (sym) | ~₱5,000+ | +₱700 | ~₱5,700+ |

*Note: PLDT Beyond Fiber pricing may have changed since the 2020 launch. Contact PLDT Enterprise for current rates. All prices approximate and may exclude VAT.*

---

## Recommendation

**PLDT Beyond Fiber** is the best option for PodPlay venues because:
1. Static IP is included free (no add-on fee)
2. Well-documented router admin access (Fiberhome routers)
3. Widest fiber coverage in the Philippines
4. Enterprise-grade features (Cisco Meraki AP, 90% speed guarantee)
5. DMZ and port forwarding are straightforward with adminpldt access

**Converge FlexiBIZ Peak** is the second choice:
1. Known for fastest raw speeds (Ookla #1 in PH)
2. Symmetrical speeds on Peak plans (better for upstream)
3. Static IP is available but as a paid add-on
4. Inconsistent customer service around static IP requests

**Globe GFiber Biz** is the third choice:
1. Good coverage but higher total cost for static IP
2. Router admin is relatively accessible
3. DMZ works even with basic user login

**For any ISP: A business plan with a static public IP is non-negotiable for PodPlay.**

---

## Sources

- [PLDT Enterprise Beyond Fiber](https://pldtenterprise.com/msme/solutions/internet/beyond-fiber)
- [PLDT Admin Default Passwords - Tech Pilipinas](https://techpilipinas.com/pldt-admin-default-passwords-usernames/)
- [PLDT Default Superadmin Passwords - Kuya IT](https://www.kuyait.ph/pldt-default-superadmin/)
- [PLDT CGNAT Removal Guide - PHCorner](https://phcorner.org/threads/pldt-cgnat-removal-without-calling-171.1255405/)
- [Globe Admin Default Passwords - Tech Pilipinas](https://techpilipinas.com/globe-admin-default-passwords-usernames)
- [Globe Admin Password - HowToQuick](https://www.howtoquick.net/2021/10/globe-fiber-default-admin-password-and-username-uno-dsl-lte.html)
- [Globe Business Broadband](https://www.globe.com.ph/business/connectivity/internet/broadband)
- [Converge FlexiBIZ Plans](https://www.convergeict.com/flexibiz/)
- [Converge Router Login Guide](https://router-network.com/converge-router-login)
- [Converge ZTE F670L Admin - HowToQuick](https://www.howtoquick.net/2023/12/converge-zte-f670l-admin-username-and-password.html)
- [Converge Bridge Mode Guide](https://gist.github.com/marfillaster/5cfdc5d2c9e0bed3d8979f07944c051a)
- [Port Forwarding Behind CGNAT - PureVPN](https://www.purevpn.com/blog/port-forwarding-pldt-and-bypass-cgnat/)
- [UniFi Gateway Port Forwarding - Ubiquiti](https://help.ui.com/hc/en-us/articles/235723207-UniFi-Gateway-Port-Forwarding)
- [Bridging Modem to UDM Pro](https://medium.com/@izevaka/bridging-a-modem-to-unifi-dreammachine-pro-612e83fe025)
- [TipidPC Converge Thread](https://tipidpc.com/viewtopic.php?tid=298525)
- [TipidPC Globe Thread](https://tipidpc.com/viewtopic.php?tid=289418)
