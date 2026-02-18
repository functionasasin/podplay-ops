---
source: Stanley Wu (Pod Play)
date: 2024-09-24
related: [[Pod Play]], [[Pod Play SEA]], [[2026-03 NJ PodPlay Training]]
tags: [podplay, hardware, configuration, reference]
---

# PodPlay Configuration Guide v1.0

**Last Update:** 9/24/2024
**Written by:** Stanley Wu

**Purpose:** Step-by-step instructions on how to configure PodPlay hardware for customers.

---

## Table of Contents

1. [Prior to Unboxing](#prior-to-unboxing)
2. [Unboxing](#unboxing)
3. [Networking Setup](#networking-setup)
4. [Modem/Router Configuration](#modemrouter-configuration)
5. [DDNS Setup](#ddns-setup)
6. [ISP DMZ](#isp-dmz)
7. [Cameras](#cameras)
8. [iPads](#ipads)
9. [Apple TVs](#apple-tvs)
10. [Mac Mini](#mac-mini)
11. [Testing](#testing)

---

## Prior to Unboxing

1. Check for correct amount of iPads, AppleTVs, and Unifi Equipment.
2. Ensure PodPlay App is ready for the customer. (Ask Agustin if it is ready.)
3. In Mosyle, create the AppleTV and iPad device groups for the client.
4. Create an **"Install App"** group for both Apple TVs and iPads in Mosyle. Add the custom config for the PodPlay app:

   ```xml
   <dict> <key>id</key><string>CUSTOMERNAME</string></dict>
   ```

5. In the customer's admin dashboard, go to **Settings > Venues > Select the location** and enable **"On-premises Replays Enabled"**. This is necessary for the instant replays to work correctly. The On-premises Local/API URL will be added later in the guide, but should follow this format:

   - **On-premises API URL:** `http://CUSTOMERNAME.podplaydns.com:4000`
   - **On-premises Local API URL:** `http://192.168.32.100:4000`

---

## Unboxing

> **Keep all packaging materials intact for reuse for shipping.**

Unbox Unifi Equipment (UDM, Switch, PDU, NVR, etc.)

1. Using the Brother label machine, create labels with the court number (C1, C2, C3, C4, etc.).
2. Unbox iPads and label the box and the back of the iPad with the court number.
3. Unbox AppleTVs and label the box, the AppleTV, and remote with the court number.
4. Unbox POE Chargers and label the box and POE charger with the court number.
5. Unbox Replay cameras and apply the label with court number on top of the camera housing.
6. Unbox Mac Mini and label with court number.

---

## Networking Setup

1. **Power on PDU.**
   - Plug in UDM, Switch, NVR, and Mac Mini.
   - Apply outlet label on PDU.

2. **UDM — Connect to internet (DHCP initially).**
   - Using the Unifi app on your phone, sign into the PingPodIT account and setup UDM with correct naming scheme: `PL-{CUSTOMERNAME}`
   - Create a local admin account:
     - **Username:** `admin`
     - **Password:** *(see internal credentials)*

3. Apply port label to UDM (Mac Mini, Kisi Controller, Backup Internet, etc.).

4. Label PDU in Unifi with devices connected to it.

5. **Power on Switch.**
   - Connect to UDM using SFP cable.
   - Apply label to Unifi switch (iPads, Cameras, AppleTVs, Kisi Reader, etc.).

6. **Power on Mac Mini.**
   - Connect to Port #1 on UDM.

7. **Configure UDM with static IP (for testing purposes).**
   - Create a **REPLAY** VLAN with `192.168.32.254` subnet, but do **NOT** change the default network subnet yet.
   - The `192.168.1.1` subnet is needed to begin camera configuration because cameras are locked initially to `192.168.1.108`.
   - VLAN settings:
     - **Network Name:** REPLAY
     - **Host Address:** 192.168.32.254
     - **Netmask:** /24
     - **Gateway IP:** 192.168.32.254
     - **Broadcast IP:** 192.168.32.255
     - **VLAN ID:** 32 (Manual)
     - **Allow Internet Access:** ✅
     - **mDNS:** ✅
     - **DHCP Mode:** DHCP Server
     - **DHCP Range:** 192.168.32.1 – 192.168.32.254

8. **If the customer has ordered Surveillance/Access Control**, create the following VLANs:
   - **Surveillance:** .31
   - **Access Control:** .33

9. **Port forward** port 4000 for `192.168.32.100` (this will be for the Mac Mini).

10. **After cameras have been configured**, change the default network to a `192.168.30.1` subnet.

---

## Modem/Router Configuration

### 1.1 ISP Router Setup

Preferred method of ISP router setup (in order of preference):

1. **Static IP**
2. **DMZ w/ DDNS**
3. **Port Forward to UDM IP address w/ DDNS**

#### Option 1: Static IP

Order a static IP from the ISP ($10–$20/month). On the Unifi dashboard, go to **Settings > Internet > WAN1**. Under Advanced, toggle to "Manual" and select "Static IP". Enter the IP information given from the ISP. We still recommend creating a DDNS (see DDNS Setup section below).

#### Option 2: DMZ

If static IP is not available, add the Unifi Gateway into the **DMZ** of the ISP router.

#### Option 3: Port Forward

If DMZ mode is not available, as a last resort you can port forward **Port 4000 (TCP/UDP)** to the IP of the Unifi Gateway. However, this method may not work depending on the ISP provider.

#### Final Step (Most Important)

On the Unifi Gateway, **port forward port 4000 (UDP/TCP) to the Mac Mini**. This allows communication between PodPlay servers and the Mac Mini.

---

## DDNS Setup

You will need access to the Mac Mini and the [FreeDNS](https://freedns.afraid.org/) account (credentials in 1Password).

1. On FreeDNS, go to **Dynamic DNS**.
2. Click **[ add ]**.
3. Fill in the following:
   - **Type:** A
   - **Subdomain:** CustomerName
   - **Domain:** podplaydns.com (private) (stealth)
   - **Destination:** `10.10.10.10` (placeholder)
   - **TTL:** 60 seconds
   - **Wildcard:** unchecked
   - Click **Save**.

4. Go back to Dynamic DNS and click on **"quick cron example"**.

5. You will be directed to a cron example page. Each cronjob is unique to the DDNS created — **do NOT copy the example below directly**.

6. Copy the cron line (you do not need the `PATH=/sbin:/…` part). Then modify it:
   - Delete `wget --no-check-certificate -O -`
   - Replace with `curl`
   - Add quotes (`""`) around the URL

   **Before:**
   ```
   0,5,10,15,20,25,30,35,40,45,50,55 * * * * sleep 33 ; wget --no-check-certificate -O - https://freedns.afraid.org/dynamic/update.php?UNIQUE_KEY >> /tmp/freedns_CUSTOMER_podplaydns_com.log 2>&1 &
   ```

   **After:**
   ```
   0,5,10,15,20,25,30,35,40,45,50,55 * * * * sleep 33 ; curl "https://freedns.afraid.org/dynamic/update.php?UNIQUE_KEY" >> /tmp/freedns_CUSTOMER_podplaydns_com.log 2>&1 &
   ```

7. On the Mac Mini, open **Terminal**:
   - Type `crontab -e`
   - Press `i` to enter insert mode
   - Paste the edited cron text
   - Press `Esc`, then type `:wq` to save

8. Wait 5 minutes and check if the DDNS has been updated with the correct IP address. You can also check the log file at: `/tmp/freedns_CUSTOMERNAME_podplaydns_com.log`

9. Verify the URL reaches the Mac Mini (HTTP only, HTTPS does not work):
   ```
   http://CUSTOMERNAME.podplaydns.com:4000
   ```
   A successful response will show a JSON message like `{"statusCode":404,"message":"Cannot GET /","error":"Not Found"}`.

---

## ISP DMZ

*For installer/on-site configuration.*

Supported ISPs:

- Verizon
- Optimum
- Spectrum
- Google Fiber
- Backup ISP

---

## Cameras

1. Refer to the port template guide. Plug **1 camera at a time** into the switch, as each camera has a default IP of `192.168.1.108` (will be changed to DHCP afterwards).

2. Navigate to `192.168.1.108` in a browser to begin camera configuration.

3. Set initial values:
   - **Region:** United States
   - **Language:** English
   - **Video Standard:** NTSC

4. Set date/time:
   - **Date Format:** YYYY-MM-DD
   - **Time Zone:** *(Set to time zone of location)*
   - **System Time:** *(Set to current time of location)*

5. Set credentials:
   - **Username:** admin
   - **Password:** *(see internal credentials)*
   - **Email Address:** support@pingpod.com

6. Go to **Settings > Network Settings**. Set mode to **DHCP**. Afterwards, assign each camera to the (.32 subnet) **REPLAY VLAN**. Assign the fixed IP address in Unifi accordingly.

### Replay Camera Settings

**Encode — Main Stream:**

| Setting | Value |
|---|---|
| Compression | H.264 |
| Encoding Strategy | General |
| Resolution | 1920×1080 (1080P) |
| Frame Rate (FPS) | 30 |
| Bit Rate Type | VBR |
| Quality | 6 (Best) |
| Max Bit Rate | 8192 Kb/s |
| I Frame Interval | 90 |
| SVC | 1 (off) |
| Smooth Stream | 50 |
| Watermark | Off |

**Encode — Sub Stream:**

| Setting | Value |
|---|---|
| Compression | H.265 |
| Resolution | 704×480 (D1) |
| Frame Rate (FPS) | 30 |
| Bit Rate Type | CBR |
| Bit Rate | 512 Kb/s |
| I Frame Interval | 60 |
| Smooth Stream | 50 |

**Overlay:** Turn **OFF** Channel Title and Time Title.

**Audio Settings:**

| Setting | Value |
|---|---|
| Audio Input Type | Mic |
| Enable (Main Stream) | On |
| Audio Encoding | G.711Mu |
| Sampling Rate | 8000 |
| Noise Filter | On |
| Microphone Volume | 50 |

---

## iPads

1. Plug POE adapters into the switch. Plug in the corresponding iPad to the POE adapter.
   - Power on iPads. Wait about 5 seconds for the internet connection to establish.
   - Begin iPad initial setup. The iPads should display **"This device is managed by Pingpod Inc"** during setup.

2. Assign the iPads in Mosyle into the client's group and name devices accordingly: `iPad {Client} Court #`

3. Setup PodPlay app with correct court number. If the app does not show the customer's club, then the iPad did not get the correct app configuration — check the **"Install App"** group to see if the config was properly set.

---

## Apple TVs

1. Power on Apple TVs. Plug AppleTVs into the switch. Connect HDMI to monitor and AppleTV.

2. After Location Services, the **Remote Management** screen should show up: *"Pingpod Inc will automatically configure your AppleTV."*
   - If it does not show up, go all the way back to the first screen and try again.
   - If you set up the AppleTV without seeing the Remote Management screen, you will need to use **Apple Deployment Manager** to re-add it to the Apple Business account.

3. Ensure it displays **"This device is managed by PingPod Inc"** during setup.

4. Assign AppleTVs in Mosyle into the client's group and name devices accordingly: `AppleTV {Client} Court #`

5. Setup PodPlay app with correct court number. If it does not show the client's name when opening the app, check the **"Install App"** group in Mosyle.

---

## Mac Mini

1. Confirm access to the client's PodPlay admin dashboard with the ability to access settings.

2. In the **Replay Service Configuration (RSC)** sheet, add the cameras with the same name as within the PodPlay dashboard (Venues).

3. During initial setup, write down the username and password in the master accounts tab.

4. Connect the **Samsung SSD** to the Mac Mini and erase the drive according to the RSC sheet.

5. Create the **cache folder** in the home folder (`Cmd+Shift+H`) and create subfolders with the same name as the cameras. These will be used for instant replays.

6. In Unifi, assign the Mac Mini to the **REPLAY VLAN** with fixed address `192.168.32.100`.

7. **If the clips folder is not saving directly to the SSD**, create a symbolic link:
   ```bash
   ln -s /Volumes/Replays/clips /Users/<HOMEFOLDER>/
   ```
   Alternatively, you can type `ln -s` and drag the clips folder from the SSD into Terminal, then drag the home folder into Terminal.

8. Connect to the **Deployment server in Jersey City**. Upload the logo to the assets folder in the home folder (`Cmd+Shift+H`). Make sure the logo name matches what's in the RSC.

9. Launch **Upload Asset** script.

10. In Terminal, create the package:
    ```bash
    ./deploy.py setup <AREA_NAME>
    ```

11. Copy the URL to notepad. Connect back to the client's Mac Mini. Download the package.

12. When you first open the package, it will say it cannot open because it is from an unidentified developer. Go to **System Settings > Privacy & Security > Scroll down > Open Anyway**.

13. Add **"Find"** and **"Node"** to **Full Disk Access**.

14. **Restart the Mac Mini.**

15. Check the replays folder and verify that video files are writing to the Samsung SSD.

### .DS_Store Check

In Terminal, navigate to the cache folder:

```bash
cd cache
ls -la
```

If the `.DS_Store` file is present, remove it:

```bash
rm .DS_Store
```

Verify with `ls -la` again.

> **⚠️ Do not open the instant replay cache folder in Finder**, as it will recreate the `.DS_Store` file.

---

## Testing

1. Add the API URLs to the admin dashboard in the following format:
   - `http://CUSTOMERNAME.podplaydns.com:4000`
   - `https://192.168.32.100:4000`

2. Check the DDNS URL from your phone (or another network) to verify the Mac Mini is reachable externally:
   ```
   http://CUSTOMERNAME.podplaydns.com:4000/health
   ```
   This will also tell you if all cameras are correctly connected and writing to the Mac Mini. If there is any error on the health check page, the replay service will not work for all courts.

3. Create an **operations reservation** on the admin dashboard. Give yourself a few hundred free replays on your user profile so you do not get charged accidentally.

4. Using the iPad, **initiate a replay**. The instant replay should be shown on the AppleTV.

5. If it does not show up:
   - Try restarting the Mac Mini first.
   - Test the instant replay stream directly: `http://CUSTOMERNAME.podplaydns.com:4000/instant-replay/COURTNAME`
   - Check if the **On-premises Replay** option (from the Prior to Unboxing section) was toggled on.

6. If everything is working:
   - Print out the **Bill of Materials (BOM)**.
   - Begin packing the equipment.
   - Count all items and make sure they match the BOM. If they do not, contact **Stan or Chad**.
   - Print a new BOM and place it inside the box for the customer.
   - Securely tape the box closed (don't be afraid to use excess tape).
   - Weigh the package with a scale.
   - Print the shipping label.
