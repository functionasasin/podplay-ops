#!/usr/bin/env python3
"""Generate PodPlay Venue Deployment Guide PDF."""

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, HRFlowable
)

OUTPUT = "/home/clsandoval/cs/monorepo/docs/podplay-venue-deployment-guide.pdf"

# Colors
DARK = HexColor("#1a1a2e")
ACCENT = HexColor("#e94560")
MID = HexColor("#16213e")
LIGHT_BG = HexColor("#f5f5f5")
LIGHT_ACCENT = HexColor("#fce4ec")
CODE_BG = HexColor("#2d2d2d")
WHITE = white
TABLE_HEADER = HexColor("#16213e")
TABLE_ALT = HexColor("#f0f4f8")
BORDER = HexColor("#cccccc")
PHASE_BG = HexColor("#e94560")
NOTE_BG = HexColor("#fff3cd")
WARN_BG = HexColor("#f8d7da")

styles = getSampleStyleSheet()

# Custom styles
styles.add(ParagraphStyle(
    "CoverTitle", parent=styles["Title"],
    fontSize=32, leading=38, textColor=DARK,
    spaceAfter=6, alignment=TA_CENTER, fontName="Helvetica-Bold"
))
styles.add(ParagraphStyle(
    "CoverSub", parent=styles["Normal"],
    fontSize=14, leading=18, textColor=HexColor("#555555"),
    alignment=TA_CENTER, spaceAfter=4
))
styles.add(ParagraphStyle(
    "PhaseTitle", parent=styles["Heading1"],
    fontSize=18, leading=22, textColor=WHITE,
    fontName="Helvetica-Bold", spaceBefore=20, spaceAfter=0,
    leftIndent=0
))
styles.add(ParagraphStyle(
    "SectionHead", parent=styles["Heading2"],
    fontSize=13, leading=16, textColor=DARK,
    fontName="Helvetica-Bold", spaceBefore=14, spaceAfter=6
))
styles.add(ParagraphStyle(
    "Step", parent=styles["Normal"],
    fontSize=9.5, leading=13, textColor=HexColor("#222222"),
    spaceBefore=2, spaceAfter=2, leftIndent=18, fontName="Helvetica"
))
styles.add(ParagraphStyle(
    "StepBold", parent=styles["Normal"],
    fontSize=9.5, leading=13, textColor=HexColor("#222222"),
    spaceBefore=2, spaceAfter=2, leftIndent=18, fontName="Helvetica-Bold"
))
styles.add(ParagraphStyle(
    "Body", parent=styles["Normal"],
    fontSize=9.5, leading=13, textColor=HexColor("#333333"),
    spaceBefore=2, spaceAfter=2, fontName="Helvetica"
))
styles.add(ParagraphStyle(
    "CodeBlock", parent=styles["Normal"],
    fontSize=8.5, leading=11, textColor=HexColor("#d4d4d4"),
    fontName="Courier", backColor=HexColor("#1e1e1e"),
    leftIndent=18, rightIndent=6, spaceBefore=4, spaceAfter=4,
    borderPadding=6
))
styles.add(ParagraphStyle(
    "NoteText", parent=styles["Normal"],
    fontSize=9, leading=12, textColor=HexColor("#856404"),
    fontName="Helvetica", leftIndent=6
))
styles.add(ParagraphStyle(
    "WarnText", parent=styles["Normal"],
    fontSize=9, leading=12, textColor=HexColor("#721c24"),
    fontName="Helvetica-Bold", leftIndent=6
))
styles.add(ParagraphStyle(
    "TableCell", parent=styles["Normal"],
    fontSize=8.5, leading=11, textColor=HexColor("#333333"),
    fontName="Helvetica"
))
styles.add(ParagraphStyle(
    "TableHeader", parent=styles["Normal"],
    fontSize=8.5, leading=11, textColor=WHITE,
    fontName="Helvetica-Bold"
))
styles.add(ParagraphStyle(
    "TOCEntry", parent=styles["Normal"],
    fontSize=11, leading=16, textColor=DARK,
    fontName="Helvetica", spaceBefore=3, spaceAfter=3, leftIndent=12
))
styles.add(ParagraphStyle(
    "SmallGray", parent=styles["Normal"],
    fontSize=8, leading=10, textColor=HexColor("#888888"),
    fontName="Helvetica"
))


def phase_banner(title):
    """Create a colored phase banner."""
    t = Table(
        [[Paragraph(title, styles["PhaseTitle"])]],
        colWidths=[7.1 * inch],
        rowHeights=[36]
    )
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), PHASE_BG),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("ROUNDEDCORNERS", [4, 4, 4, 4]),
    ]))
    return t


def note_box(text):
    """Create a note callout."""
    t = Table(
        [[Paragraph(f"NOTE: {text}", styles["NoteText"])]],
        colWidths=[6.8 * inch]
    )
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), NOTE_BG),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("ROUNDEDCORNERS", [3, 3, 3, 3]),
        ("BOX", (0, 0), (-1, -1), 0.5, HexColor("#ffc107")),
    ]))
    return t


def warn_box(text):
    """Create a warning callout."""
    t = Table(
        [[Paragraph(f"WARNING: {text}", styles["WarnText"])]],
        colWidths=[6.8 * inch]
    )
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), WARN_BG),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("ROUNDEDCORNERS", [3, 3, 3, 3]),
        ("BOX", (0, 0), (-1, -1), 0.5, HexColor("#dc3545")),
    ]))
    return t


def make_table(headers, rows, col_widths=None):
    """Create a styled data table."""
    header_row = [Paragraph(h, styles["TableHeader"]) for h in headers]
    data = [header_row]
    for row in rows:
        data.append([Paragraph(str(c), styles["TableCell"]) for c in row])

    if col_widths is None:
        col_widths = [7.1 * inch / len(headers)] * len(headers)

    t = Table(data, colWidths=col_widths, repeatRows=1)
    style_cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), TABLE_HEADER),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 8.5),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 6),
        ("TOPPADDING", (0, 0), (-1, 0), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]
    for i in range(1, len(data)):
        if i % 2 == 0:
            style_cmds.append(("BACKGROUND", (0, i), (-1, i), TABLE_ALT))
    t.setStyle(TableStyle(style_cmds))
    return t


def step(num, text):
    return Paragraph(f"<b>{num}.</b>&nbsp;&nbsp;{text}", styles["Step"])


def substep(text):
    return Paragraph(f"&nbsp;&nbsp;&nbsp;&nbsp;• {text}", styles["Step"])


def code(text):
    return Paragraph(text, styles["CodeBlock"])


def section(text):
    return Paragraph(text, styles["SectionHead"])


def body(text):
    return Paragraph(text, styles["Body"])


def hr():
    return HRFlowable(width="100%", thickness=0.5, color=BORDER, spaceBefore=8, spaceAfter=8)


def build_pdf():
    doc = SimpleDocTemplate(
        OUTPUT, pagesize=letter,
        leftMargin=0.7 * inch, rightMargin=0.7 * inch,
        topMargin=0.7 * inch, bottomMargin=0.7 * inch
    )
    story = []

    # ─── COVER PAGE ───
    story.append(Spacer(1, 1.5 * inch))
    story.append(Paragraph("PodPlay Venue<br/>Deployment Guide", styles["CoverTitle"]))
    story.append(Spacer(1, 12))
    story.append(HRFlowable(width="40%", thickness=2, color=ACCENT, spaceBefore=0, spaceAfter=12))
    story.append(Paragraph("Complete Step-by-Step Hardware &amp; Software Configuration", styles["CoverSub"]))
    story.append(Spacer(1, 8))
    story.append(Paragraph("Compiled from: Config Guide v1 (Stan Wu) · Nico Training Call (2026-02-25)<br/>Hardware Installation Guide (Andy) · System Diagram · Asia Infrastructure Analysis", styles["CoverSub"]))
    story.append(Spacer(1, 24))
    story.append(Paragraph("Version 1.0 — March 2026", styles["CoverSub"]))
    story.append(Paragraph("CONFIDENTIAL — Internal Use Only", styles["CoverSub"]))
    story.append(PageBreak())

    # ─── TABLE OF CONTENTS ───
    story.append(Paragraph("Table of Contents", styles["Heading1"]))
    story.append(Spacer(1, 8))
    toc_items = [
        "Phase 0: Pre-Purchase &amp; Planning",
        "Phase 1: Pre-Configuration (PodPlay Office)",
        "Phase 2: Unboxing &amp; Labeling",
        "Phase 3: Network Rack Assembly",
        "Phase 4: Networking Setup (UniFi)",
        "Phase 5: ISP Router Configuration",
        "Phase 6: Camera Configuration",
        "Phase 7: DDNS Setup",
        "Phase 8: Mac Mini Setup",
        "Phase 9: Replay Service Deployment (V1)",
        "Phase 10: iPad Setup",
        "Phase 11: Apple TV Setup",
        "Phase 12: Physical Installation (On-Site)",
        "Phase 13: Testing &amp; Verification",
        "Phase 14: Health Monitoring Setup",
        "Phase 15: Packaging &amp; Shipping",
        "Appendix A: Troubleshooting",
        "Appendix B: Hardware BOM",
        "Appendix C: Network Reference",
        "Appendix D: Support Escalation Tiers",
        "Appendix E: Device Migration (ABM Transfer)",
        "Appendix F: Open Questions (Asia)",
    ]
    for i, item in enumerate(toc_items):
        story.append(Paragraph(f"{i}. {item}" if i > 0 else f"0. {item}", styles["TOCEntry"]))
    story.append(PageBreak())

    # ─── PHASE 0 ───
    story.append(phase_banner("Phase 0: Pre-Purchase &amp; Planning"))
    story.append(Spacer(1, 8))
    story.append(step(1, "Schedule kickoff call with <b>Andy Korzeniacki</b> (917-937-6896, andyk@podplay.app)"))
    story.append(step(2, "Determine tier: <b>Pro</b> (display + kiosk + replay) or <b>Autonomous</b> (+ access control + security cameras)"))
    story.append(step(3, "Determine court count — sets internet speed, switch size, SSD size, rack size (7–12U)"))
    story.append(step(4, "Confirm ISP: fiber preferred (symmetrical), cable acceptable"))
    story.append(warn_box("PodPlay systems are NOT compatible with Starlink (CGNAT blocks port 4000)."))
    story.append(Spacer(1, 4))
    story.append(step(5, "Confirm internet speed per court count:"))
    story.append(make_table(
        ["Courts", "Fiber", "Cable", "Dedicated"],
        [
            ["1–4", "50–100 / 100 Mbps", "60 Mbps upload", "30/30"],
            ["5–11", "150 / 150 Mbps", "Highest possible upload", "50/50"],
            ["12–19", "200 / 200 Mbps", "Highest possible upload", "50/50"],
            ["20–24", "300 / 300 Mbps", "Highest possible upload", "100/100"],
            ["25+", "400 / 400 Mbps", "Highest possible upload", "150/150"],
        ],
        [1.0 * inch, 2.0 * inch, 2.0 * inch, 2.1 * inch]
    ))
    story.append(Spacer(1, 4))
    story.append(step(6, "Confirm <b>static IP</b> from ISP — or ability to port forward 4000 through ISP router"))
    story.append(step(7, "Determine TV mount type, iPad mount type, camera mount accessories per venue layout"))
    story.append(step(8, "Calculate Cat6 requirements: courts × avg distance × 3 drops + doors + security cameras"))
    story.append(substep("Pro tier: 3 Cat6 drops + 1 duplex outlet per court"))
    story.append(substep("Autonomous tier: add 1 Cat6 per door reader + 1 per security camera"))
    story.append(PageBreak())

    # ─── PHASE 1 ───
    story.append(phase_banner("Phase 1: Pre-Configuration (PodPlay Office)"))
    story.append(Spacer(1, 8))
    story.append(section("Mosyle MDM"))
    story.append(step(9, "Create iPad device group for the client in Mosyle"))
    story.append(step(10, "Create Apple TV device group for the client in Mosyle"))
    story.append(step(11, 'Create <b>"Install App"</b> group for both iPads and Apple TVs with custom config:'))
    story.append(code('&lt;dict&gt;&lt;key&gt;id&lt;/key&gt;&lt;string&gt;CUSTOMERNAME&lt;/string&gt;&lt;/dict&gt;'))
    story.append(Spacer(1, 4))
    story.append(section("Admin Dashboard"))
    story.append(step(12, "In client's PodPlay admin dashboard → Settings → Venues → Select location"))
    story.append(step(13, 'Enable <b>"On-premises Replays Enabled"</b>'))
    story.append(step(14, "Note the URL format (filled in later during testing):"))
    story.append(substep("API URL: http://CUSTOMERNAME.podplaydns.com:4000"))
    story.append(substep("Local URL: http://192.168.32.100:4000"))
    story.append(Spacer(1, 4))
    story.append(section("Hardware Verification"))
    story.append(step(15, "Verify correct quantity of iPads, Apple TVs, UniFi equipment per BOM"))
    story.append(step(16, "Confirm PodPlay app is ready for the customer (ask <b>Agustin</b>)"))
    story.append(PageBreak())

    # ─── PHASE 2 ───
    story.append(phase_banner("Phase 2: Unboxing &amp; Labeling"))
    story.append(Spacer(1, 8))
    story.append(note_box("Keep all packaging materials intact for reuse / shipping."))
    story.append(Spacer(1, 4))
    story.append(step(17, "Unbox UniFi equipment (UDM, Switch, PDU, NVR if applicable)"))
    story.append(step(18, "Using <b>Brother label machine</b>, create labels: C1, C2, C3, C4..."))
    story.append(step(19, "Unbox iPads — label box + back of iPad with court number"))
    story.append(step(20, "Unbox Apple TVs — label box, Apple TV unit, and remote with court number"))
    story.append(step(21, "Unbox PoE chargers — label box and charger with court number"))
    story.append(step(22, "Unbox replay cameras — label on top of camera housing with court number"))
    story.append(step(23, "Unbox Mac Mini — label with location name"))
    story.append(PageBreak())

    # ─── PHASE 3 ───
    story.append(phase_banner("Phase 3: Network Rack Assembly"))
    story.append(Spacer(1, 8))
    story.append(step(24, "Install UPS at <b>bottom of rack</b> (connect internal battery first)"))
    story.append(step(25, "Install PDU (can mount on back of rack to save space)"))
    story.append(step(26, "Mount shelf for Mac Mini (2U space reserved)"))
    story.append(step(27, "Install patch panel with inline couplers (or punch-down keystones if capable)"))
    story.append(step(28, "Rack order top-to-bottom:"))
    story.append(make_table(
        ["Position", "Component", "Notes"],
        [
            ["Top", "Mac Mini", "2U shelf"],
            ["2", "ISP Modem", "If rack-mountable"],
            ["3", "Gateway (UDM)", "UDM-SE / Pro / Pro-Max"],
            ["4", "Patch Panel", "24-port with couplers"],
            ["5", "Switch", "USW-Pro-24/48-POE (size varies by court count)"],
            ["6", "NVR", "Autonomous+ only (UNVR / UNVR-Pro)"],
            ["7", "UPS", "Battery must be connected before starting"],
            ["Back", "PDU", "TrippLite RS-1215-RA (12 outlet)"],
        ],
        [0.8 * inch, 2.0 * inch, 4.3 * inch]
    ))
    story.append(Spacer(1, 4))
    story.append(step(29, "All devices plug into PDU → PDU into UPS → UPS into <b>dedicated 20A circuit</b>"))
    story.append(warn_box("Mac Mini needs breathing room — do not install too close to other equipment (overheating risk)."))
    story.append(PageBreak())

    # ─── PHASE 4 ───
    story.append(phase_banner("Phase 4: Networking Setup (UniFi)"))
    story.append(Spacer(1, 8))
    story.append(section("Power On &amp; UDM Initial Setup"))
    story.append(step(30, "Power on PDU; plug in UDM, Switch, NVR, Mac Mini"))
    story.append(step(31, "Apply outlet labels on PDU"))
    story.append(step(32, "Using UniFi app on phone, sign into <b>PingPodIT</b> account"))
    story.append(step(33, "Set up UDM with naming scheme: <b>PL-{CUSTOMERNAME}</b>"))
    story.append(step(34, "Create local admin account: username <b>admin</b>, password per internal credentials"))
    story.append(step(35, "Apply port labels to UDM (Mac Mini, Kisi Controller, Backup Internet, etc.)"))
    story.append(step(36, "Label PDU in UniFi with connected devices"))

    story.append(section("Switch Setup"))
    story.append(step(37, "Power on switch"))
    story.append(step(38, "Connect switch to UDM using <b>SFP DAC cable</b>"))
    story.append(step(39, "Apply labels to switch ports (iPads, Cameras, Apple TVs, Kisi Reader, etc.)"))

    story.append(section("Mac Mini Connection"))
    story.append(step(40, "Power on Mac Mini"))
    story.append(step(41, "Connect to <b>Port #1 on UDM</b>"))

    story.append(section("VLAN Configuration"))
    story.append(note_box("Do NOT change the default network yet — need 192.168.1.1 subnet for initial camera configuration (cameras default to 192.168.1.108)."))
    story.append(Spacer(1, 4))
    story.append(step(42, "Create <b>REPLAY</b> VLAN with the following settings:"))
    story.append(make_table(
        ["Setting", "Value"],
        [
            ["Network Name", "REPLAY"],
            ["Host Address", "192.168.32.254"],
            ["Netmask", "/24"],
            ["Gateway IP", "192.168.32.254"],
            ["Broadcast IP", "192.168.32.255"],
            ["VLAN ID", "32 (Manual)"],
            ["Allow Internet Access", "Yes"],
            ["mDNS", "Yes (required for Apple TV discovery)"],
            ["DHCP Mode", "DHCP Server"],
            ["DHCP Range", "192.168.32.1 – 192.168.32.254"],
        ],
        [2.5 * inch, 4.6 * inch]
    ))
    story.append(Spacer(1, 4))
    story.append(step(43, "If Surveillance ordered → create <b>SURVEILLANCE</b> VLAN (subnet .31)"))
    story.append(step(44, "If Access Control ordered → create <b>ACCESS CONTROL</b> VLAN (subnet .33)"))

    story.append(section("Port Forwarding"))
    story.append(step(45, "Port forward <b>port 4000 (TCP/UDP)</b> to <b>192.168.32.100</b> (Mac Mini)"))
    story.append(warn_box("Port 4000 is critical — all replay service communication flows through it. If blocked, the entire system fails."))
    story.append(PageBreak())

    # ─── PHASE 5 ───
    story.append(phase_banner("Phase 5: ISP Router Configuration"))
    story.append(Spacer(1, 8))
    story.append(step(46, "Configure ISP router using one of these methods (in preference order):"))
    story.append(make_table(
        ["Priority", "Method", "Details"],
        [
            ["1 (Best)", "Static IP", "Order from ISP ($10-20/mo). UDM → Settings → Internet → WAN1 → Advanced → Manual → Static IP"],
            ["2", "DMZ", "Put UDM's IP into ISP router's DMZ"],
            ["3 (Last resort)", "Port Forward", "Forward port 4000 TCP/UDP to UDM IP (ISP-dependent)"],
        ],
        [1.0 * inch, 1.2 * inch, 4.9 * inch]
    ))
    story.append(Spacer(1, 4))
    story.append(step(47, "<b>Final step (most important):</b> On UDM, port forward port 4000 TCP/UDP → Mac Mini (192.168.32.100)"))
    story.append(Spacer(1, 6))
    story.append(body("<b>Supported US ISPs:</b> Verizon, Optimum, Spectrum, Google Fiber"))
    story.append(body("<b>Philippines ISPs:</b> PLDT Beyond Fiber, Globe GFiber Biz, Converge FlexiBIZ"))
    story.append(warn_box("Philippines: MUST have business plan + static IP. Residential plans use CGNAT which blocks all incoming connections."))
    story.append(PageBreak())

    # ─── PHASE 6 ───
    story.append(phase_banner("Phase 6: Camera Configuration"))
    story.append(Spacer(1, 8))
    story.append(note_box("Plug ONE camera at a time — all cameras share default IP 192.168.1.108."))
    story.append(Spacer(1, 4))
    story.append(step(48, "Plug camera into switch"))
    story.append(step(49, "Navigate to <b>192.168.1.108</b> in browser"))
    story.append(step(50, "Set initial values: Region: United States, Language: English, Video Standard: NTSC"))
    story.append(step(51, "Set date/time: Format YYYY-MM-DD, correct time zone and local time"))
    story.append(step(52, "Set credentials: username <b>admin</b>, password per internal creds, email support@pingpod.com"))
    story.append(step(53, "Settings → Network Settings → set mode to <b>DHCP</b>"))
    story.append(step(54, "In UniFi, assign camera to <b>REPLAY VLAN</b> (.32 subnet) with <b>fixed IP</b>"))
    story.append(step(55, "Repeat for each camera (one at a time)"))

    story.append(section("Camera Encoding — Main Stream"))
    story.append(make_table(
        ["Setting", "Value"],
        [
            ["Compression", "H.264"],
            ["Resolution", "1920×1080 (1080P)"],
            ["Frame Rate", "30 FPS"],
            ["Bit Rate Type", "VBR"],
            ["Quality", "6 (Best)"],
            ["Max Bit Rate", "8192 Kb/s"],
            ["I Frame Interval", "90"],
            ["SVC", "1 (off)"],
            ["Smooth Stream", "50"],
            ["Watermark", "Off"],
        ],
        [2.5 * inch, 4.6 * inch]
    ))

    story.append(section("Camera Encoding — Sub Stream"))
    story.append(make_table(
        ["Setting", "Value"],
        [
            ["Compression", "H.265"],
            ["Resolution", "704×480 (D1)"],
            ["Frame Rate", "30 FPS"],
            ["Bit Rate Type", "CBR"],
            ["Bit Rate", "512 Kb/s"],
            ["I Frame Interval", "60"],
            ["Smooth Stream", "50"],
        ],
        [2.5 * inch, 4.6 * inch]
    ))
    story.append(Spacer(1, 4))
    story.append(step(56, "Overlay: Turn <b>OFF</b> Channel Title and Time Title"))
    story.append(step(57, "Audio: Mic input, enabled on main stream, G.711Mu, 8000 sampling, noise filter on, volume 50"))
    story.append(step(58, "<b>After ALL cameras configured</b>, change default network to <b>192.168.30.1</b> subnet"))
    story.append(PageBreak())

    # ─── PHASE 7 ───
    story.append(phase_banner("Phase 7: DDNS Setup"))
    story.append(Spacer(1, 8))
    story.append(step(59, "On <b>FreeDNS</b> (freedns.afraid.org) → Dynamic DNS → click <b>[ add ]</b>"))
    story.append(step(60, "Create A record:"))
    story.append(make_table(
        ["Field", "Value"],
        [
            ["Type", "A"],
            ["Subdomain", "CUSTOMERNAME"],
            ["Domain", "podplaydns.com (private/stealth)"],
            ["Destination", "10.10.10.10 (placeholder)"],
            ["TTL", "60 seconds"],
            ["Wildcard", "Unchecked"],
        ],
        [2.0 * inch, 5.1 * inch]
    ))
    story.append(Spacer(1, 4))
    story.append(step(61, "Go to Dynamic DNS → click <b>\"quick cron example\"</b>"))
    story.append(step(62, "Copy the cron line, modify: replace <b>wget</b> with <b>curl</b>, add quotes around URL:"))
    story.append(code('0,5,10,...,55 * * * * sleep 33 ; curl "https://freedns.afraid.org/dynamic/update.php?UNIQUE_KEY" &gt;&gt; /tmp/freedns_CUSTOMER_podplaydns_com.log 2&gt;&amp;1 &amp;'))
    story.append(step(63, "On Mac Mini terminal: <b>crontab -e</b> → i (insert) → paste → Esc → :wq"))
    story.append(step(64, "Wait 5 minutes, verify DDNS updated with correct IP"))
    story.append(step(65, "Check log: /tmp/freedns_CUSTOMERNAME_podplaydns_com.log"))
    story.append(PageBreak())

    # ─── PHASE 8 ───
    story.append(phase_banner("Phase 8: Mac Mini Setup"))
    story.append(Spacer(1, 8))
    story.append(step(66, "Confirm access to client's PodPlay admin dashboard with settings access"))
    story.append(step(67, "In <b>Replay Service Configuration (RSC)</b> sheet, add cameras with same names as in dashboard"))
    story.append(step(68, "Write down Mac Mini username/password in master accounts tab"))
    story.append(step(69, "Connect <b>Samsung SSD</b> to Mac Mini, erase drive per RSC sheet"))
    story.append(step(70, "Create <b>cache folder</b> in home folder (Cmd+Shift+H)"))
    story.append(substep("Create subfolders matching camera names (used for instant replays)"))
    story.append(step(71, "In UniFi, assign Mac Mini to REPLAY VLAN with fixed address <b>192.168.32.100</b>"))
    story.append(step(72, "If clips folder doesn't save to SSD, create symlink:"))
    story.append(code("ln -s /Volumes/Replays/clips /Users/&lt;HOMEFOLDER&gt;/"))
    story.append(step(73, "Remove .DS_Store from cache folder:"))
    story.append(code("cd cache &amp;&amp; rm .DS_Store"))
    story.append(warn_box("NEVER open the cache folder in Finder — it recreates .DS_Store which breaks replay processing."))
    story.append(PageBreak())

    # ─── PHASE 9 ───
    story.append(phase_banner("Phase 9: Replay Service Deployment (V1)"))
    story.append(Spacer(1, 8))
    story.append(note_box("V2 replay service (coming ~April 2026) will eliminate steps 74-79 — deploy directly from GitHub, config via dashboard instead of Google Doc. V2 switches from UDP to TCP, fixing pixelation issues seen at some clubs with V1."))
    story.append(Spacer(1, 4))
    story.append(step(74, "Connect to <b>Deployment Server</b> in Jersey City (VPN required)"))
    story.append(step(75, "Upload venue logo to assets folder in home folder"))
    story.append(step(76, "Ensure logo name matches RSC"))
    story.append(step(77, "Launch <b>Upload Asset</b> script"))
    story.append(step(78, "In terminal, create the package:"))
    story.append(code("./deploy.py setup &lt;AREA_NAME&gt;"))
    story.append(step(79, "Copy generated URL to notepad"))
    story.append(step(80, "Connect back to client's Mac Mini, download the package"))
    story.append(step(81, "First open: System Settings → Privacy &amp; Security → scroll down → <b>Open Anyway</b>"))
    story.append(step(82, 'Add <b>"Find"</b> and <b>"Node"</b> to <b>Full Disk Access</b>'))
    story.append(step(83, "<b>Restart Mac Mini</b>"))
    story.append(step(84, "Verify video files are writing to Samsung SSD"))
    story.append(PageBreak())

    # ─── PHASE 10 ───
    story.append(phase_banner("Phase 10: iPad Setup"))
    story.append(Spacer(1, 8))
    story.append(step(85, "Plug PoE adapters into switch, connect iPads to PoE adapters"))
    story.append(note_box("UniFi detects the PoE injector, not the iPad itself. If you move a PoE injector to a different port, UniFi will show the injector on the new port — keep this in mind when troubleshooting."))
    story.append(Spacer(1, 4))
    story.append(step(86, "Power on iPads <b>in court-number order</b> (C1 first, then C2, etc.)"))
    story.append(warn_box("Enrollment order in Mosyle matches power-on order. If you power on out of order, device-to-court mapping will be wrong. Filter by enrolled date in Mosyle to verify."))
    story.append(Spacer(1, 4))
    story.append(step(87, "Wait ~5 seconds for internet connection"))
    story.append(step(88, 'Begin iPad setup — should display <b>"This device is managed by Pingpod Inc"</b>'))
    story.append(step(89, "If managed screen doesn't appear: go back to first screen and retry"))
    story.append(substep("If still not showing: use <b>Apple Deployment Manager</b> to re-add device"))
    story.append(substep("~80% of devices enroll successfully on first attempt. Factory reset and retry if needed."))
    story.append(step(90, "<b>Turn off auto-lock</b> on each iPad during configuration (MDM commands cannot reach a sleeping iPad)"))
    story.append(step(91, "In Mosyle, assign iPads to client's group, name: <b>iPad {Client} Court #</b>"))

    story.append(section("App Installation (VPP)"))
    story.append(step(92, "In Mosyle → Profiles → <b>Install App</b> → create new profile"))
    story.append(substep("Installation source: <b>VPP</b> (never App Store) — apps are custom/white-labeled per facility"))
    story.append(substep("Verify you have enough VPP licenses in Apple Business Manager"))
    story.append(step(93, "Click Add App → search for client's PodPlay kiosk app"))
    story.append(step(94, "Add P-List configuration with location ID:"))
    story.append(code('&lt;dict&gt;&lt;key&gt;id&lt;/key&gt;&lt;string&gt;LOCATION_ID&lt;/string&gt;&lt;/dict&gt;'))
    story.append(substep("The LOCATION_ID comes from the PodPlay development team — confirm it's ready before configuring"))
    story.append(step(95, "Enable <b>Auto App Install Update</b> — but set to <b>do not update automatically</b> to avoid disrupting play"))
    story.append(step(96, "Set up PodPlay app with correct court number"))
    story.append(step(97, 'If app doesn\'t show customer\'s club: check <b>"Install App"</b> group for correct P-List config'))

    story.append(section("App Lock"))
    story.append(step(98, "In Mosyle, enable <b>App Lock</b> for all iPads — locks device to PodPlay app so users can't exit"))
    story.append(step(99, "Schedule App Lock <b>OFF window: 2:00 AM – 3:00 AM</b>"))
    story.append(substep("During this window: app lock disengages, device restarts, MDM sends pending updates"))
    story.append(substep("At ~2:30 AM: scheduled commands (app updates, config pushes) are sent to the device"))
    story.append(substep("App lock re-engages at 3:00 AM — device is ready for next day"))
    story.append(note_box("For initial setup, keep App Lock at 24/7 until all configuration and testing is complete."))
    story.append(Spacer(1, 4))
    story.append(warn_box("NEVER send a shutdown from Mosyle — only restart. Shutdown requires physical on-site access to power back on."))
    story.append(Spacer(1, 4))
    story.append(note_box("iPads can run on WiFi instead of PoE — some locations do this (e.g. portable setups). PoE adapters are fragile — cable runs must be clean, not bunched up."))
    story.append(PageBreak())

    # ─── PHASE 11 ───
    story.append(phase_banner("Phase 11: Apple TV Setup"))
    story.append(Spacer(1, 8))
    story.append(step(92, "Power on Apple TVs, plug into switch"))
    story.append(step(93, "Connect HDMI to <b>HDMI 1</b> on TV"))
    story.append(step(94, 'After Location Services, <b>Remote Management</b> screen should appear: "Pingpod Inc will automatically configure your AppleTV"'))
    story.append(step(95, "If no Remote Management screen: go all the way back to first screen, retry"))
    story.append(substep("If set up without Remote Management: use <b>Apple Deployment Manager</b> to re-add"))
    story.append(step(96, "In Mosyle, assign to client's group, name: <b>AppleTV {Client} Court #</b>"))
    story.append(step(97, "Set up PodPlay app with correct court number"))
    story.append(step(98, 'If app doesn\'t show client name: check <b>"Install App"</b> group in Mosyle'))
    story.append(PageBreak())

    # ─── PHASE 12 ───
    story.append(phase_banner("Phase 12: Physical Installation (On-Site)"))
    story.append(Spacer(1, 8))
    story.append(section("Replay Cameras"))
    story.append(step(99, "Mount <b>16–20 feet behind baseline</b> at <b>11' AFF</b> (ideal)"))
    story.append(step(100, "Leave <b>12 feet</b> of cable coiled at camera location"))
    story.append(step(101, "Opposing cameras must be at <b>same height</b>"))
    story.append(step(102, "At least <b>2 feet</b> from adjacent court's baseline"))

    story.append(Spacer(1, 4))
    story.append(body("<b>Camera height by distance from baseline:</b>"))
    story.append(make_table(
        ["Distance from Baseline", "Height AFF"],
        [
            ["21'–26'", "12'"],
            ["16'–20' (ideal)", "11'"],
            ["12'–15'", "10'"],
            ["9'–11'", "9'"],
            ["< 9'", "8'"],
        ],
        [3.55 * inch, 3.55 * inch]
    ))

    story.append(section("TV Displays"))
    story.append(step(103, "Mount 65\" display at <b>8'9\" AFF</b>, center court, aligned with net (spectator side)"))
    story.append(step(104, "VESA 400×300 mount (included). Hide ethernet, outlet, Apple TV behind TV."))

    story.append(section("iPad Kiosks"))
    story.append(step(105, "Mount kiosk at <b>4'8\" AFF</b>, center court"))
    story.append(step(106, "Hide PoE adapter (behind wall for drywall, behind TV for concrete)"))
    story.append(step(107, "Keep case keys for the customer"))

    story.append(section("Bluetooth Buttons (Flic)"))
    story.append(step(108, "Mount on fence/wall behind baseline, <b>2 per court</b> (left + right)"))
    story.append(step(109, "Pre-paired with iPads per court assignment"))
    story.append(substep("Label each button with court number and side (e.g. C1-L, C1-R) using Sharpie"))
    story.append(body("Single press = score · Double press = undo · Long press = replay"))
    story.append(body("<b>Battery:</b> CR2032 coin cell. Yellow blink = low battery."))
    story.append(body("<b>Factory reset:</b> Remove battery → wait 5 seconds → reinsert → hold top + bottom for 10 seconds until red blink."))
    story.append(warn_box("App Lock MUST be OFF to pair buttons. If App Lock is on, pairing will show 'Bluetooth Pairing Failed' / 'Verification Failed'. Turn off App Lock for the location in Mosyle before pairing."))

    story.append(section("Access Control (Autonomous tier only)"))
    story.append(step(110, "Install Kisi Controller Pro 2 or UniFi Access hub"))
    story.append(step(111, "Install readers at doors"))
    story.append(step(112, "Wire locks: mag lock for glass doors (fail-safe), electric strike for panic bars (fail-secure)"))
    story.append(body("UniFi Door Hub output: 12V DC at up to 1A. Higher amperage or fire code = separate power supply."))
    story.append(PageBreak())

    # ─── PHASE 13 ───
    story.append(phase_banner("Phase 13: Testing &amp; Verification"))
    story.append(Spacer(1, 8))
    story.append(step(113, "Add API URLs to admin dashboard:"))
    story.append(substep("http://CUSTOMERNAME.podplaydns.com:4000"))
    story.append(substep("http://192.168.32.100:4000"))
    story.append(step(114, "From a <b>different network</b> (phone on cellular), verify DDNS:"))
    story.append(code("http://CUSTOMERNAME.podplaydns.com:4000/health"))
    story.append(substep('Success = JSON response (even a 404 JSON means Mac Mini is reachable)'))
    story.append(substep("Health check shows: camera status, SSD usage, rename service, CPU/memory"))
    story.append(step(115, "Test RTSP streams with <b>VLC</b>"))
    story.append(step(116, "Create an <b>operations reservation</b> on admin dashboard"))
    story.append(step(117, "Give yourself free replays on your user profile (avoid charges)"))
    story.append(step(118, "On iPad, <b>initiate a replay</b> — instant replay should appear on Apple TV"))

    story.append(section("If Replay Doesn't Work"))
    story.append(step("A", "Restart Mac Mini first"))
    story.append(step("B", "Test instant replay stream directly:"))
    story.append(code("http://CUSTOMERNAME.podplaydns.com:4000/instant-replay/COURTNAME"))
    story.append(step("C", 'Verify <b>"On-premises Replay"</b> toggle is enabled in dashboard'))

    story.append(section("Bluetooth Button Testing"))
    story.append(body("Single press = score · Double press = undo score · Long press = get replay"))
    story.append(step("D", "Open the <b>configuration menu</b> on the iPad (long-press the logo in the corner)"))
    story.append(substep("Verify left and right buttons appear in the button assignment section"))
    story.append(substep("Press each button — indicator should turn <b>green</b> with a button event logged"))
    story.append(substep("If button event shows but scoring doesn't work: restart iPad to re-sync <b>Firebase</b> connection"))
    story.append(substep("If no button appears: button may not be paired, battery may be dead, or needs factory reset"))
    story.append(body("If pairing fails: exit Guided Access / App Lock → retry. If still fails: factory reset button (remove battery 5s, reinsert, hold 10s)."))
    story.append(PageBreak())

    # ─── PHASE 14 ───
    story.append(phase_banner("Phase 14: Health Monitoring Setup"))
    story.append(Spacer(1, 8))
    story.append(step(119, "Set up <b>Google Cloud alerting</b> for the venue (can use own GCP account)"))
    story.append(step(120, "Health check endpoint: http://CUSTOMERNAME.podplaydns.com:4000/health"))
    story.append(step(121, "GCP pings every <b>5 minutes</b>"))
    story.append(step(122, "Checks: SSD storage &lt; 80%, memory/swap, CPU load, rename service, link status"))
    story.append(step(123, "Alerts sent to <b>Slack</b> (configurable destination)"))
    story.append(note_box("Nico monitors ~70 live locations this way. Set up the same for all Asia venues."))
    story.append(Spacer(1, 12))

    # ─── PHASE 15 ───
    story.append(phase_banner("Phase 15: Packaging &amp; Shipping"))
    story.append(Spacer(1, 8))
    story.append(step(124, "Print <b>Bill of Materials (BOM)</b>"))
    story.append(step(125, "Count all items against BOM — if mismatch, contact <b>Stan or Chad</b>"))
    story.append(step(126, "Print new BOM, place inside box"))
    story.append(step(127, "Securely tape box closed (excess tape is fine)"))
    story.append(step(128, "Weigh package with scale"))
    story.append(step(129, "Print shipping label"))
    story.append(PageBreak())

    # ─── APPENDIX A ───
    story.append(phase_banner("Appendix A: Troubleshooting"))
    story.append(Spacer(1, 8))
    story.append(make_table(
        ["Issue", "Solution"],
        [
            ["Mac Mini black screen (crash)", "SSH in and restart. Screen share won't work if screen is black."],
            ["Mac Mini overheating", "Needs breathing room in rack — don't install flush against other equipment."],
            ["Replays not generating for a time window", "Rename service may have failed — files need timestamps (e.g. 0225). Check rename service status via /health."],
            ["PoE adapter intermittent issues", "Cable runs must be clean, not bunched up, under 100m. Very sensitive to cable quality — re-terminate if needed."],
            ["iPad buttons won't pair", "App lock must be OFF during pairing. Exit Guided Access first, then pair."],
            ["Camera image warped", "Coefficients need adjustment. Start at zero for raw image, calibrate after physical install."],
            ["DDNS not updating", "Check cron: crontab -l on Mac Mini. Check log at /tmp/freedns_*.log"],
            ["Port 4000 unreachable from outside", "Verify: ISP router forwarding → UDM forwarding → Mac Mini on .32.100. Test from cellular network."],
            [".DS_Store in cache folder", "cd cache && rm .DS_Store — NEVER open cache folder in Finder."],
            ["App doesn't show customer club", 'Check Mosyle "Install App" group — P-List config must have correct LOCATION_ID string.'],
            ["Replay video pixelated", "V1 replay service uses UDP — pixelation is a known issue. Deploy V2 (TCP) to fix. Contact developer (Patrick)."],
            ["Button paired but score not updating", "Restart iPad to re-sync Firebase connection. If still failing, check Firebase service status."],
            ["Flic button won't pair", "App Lock MUST be off. Turn off App Lock for location in Mosyle, then retry pairing on iPad."],
            ["Flic button unresponsive", "Replace CR2032 battery. If still dead: factory reset (remove battery 5s, reinsert, hold top+bottom 10s until red blink)."],
            ["iPad not receiving MDM commands", "iPad may be asleep with auto-lock on. Turn off auto-lock during configuration. For deployed iPads, commands are sent during 2-3 AM App Lock off window."],
            ["iPad enrollment out of order", "Filter by enrolled date in Mosyle. iPads enroll in the order they are powered on — always power on in court-number order."],
        ],
        [2.2 * inch, 4.9 * inch]
    ))
    story.append(PageBreak())

    # ─── APPENDIX B ───
    story.append(phase_banner("Appendix B: Hardware BOM"))
    story.append(Spacer(1, 8))
    story.append(section("Network Rack"))
    story.append(make_table(
        ["Item", "Source"],
        [
            ["TrippLite 12 Outlet RS-1215-RA (PDU)", "Ingram"],
            ["UniFi UDM-SE / Pro / Pro-Max (Gateway)", "UniFi"],
            ["UniFi USW-Pro-24-POE or 48-POE (Switch)", "UniFi"],
            ["UACC-DAC-SFP10-0.5M (SFP cable)", "UniFi"],
            ["Patch Panel w/ Couplers (24-port)", "Amazon"],
            ["Monoprice Cat6 patch cables (1', 3', 10')", "Amazon"],
        ],
        [4.5 * inch, 2.6 * inch]
    ))
    story.append(section("Replay System (Per Court)"))
    story.append(make_table(
        ["Item", "Source"],
        [
            ["Mac Mini 16GB 256GB SSD", "Apple Business"],
            ["Samsung T7 SSD (1TB / 2TB / 4TB)", "Amazon"],
            ["EmpireTech IPC-T54IR-ZE (replay camera)", "EmpireTech"],
            ["EmpireTech PFA130-E (junction box)", "EmpireTech"],
            ["Flic Button (2 per court)", "Flic"],
        ],
        [4.5 * inch, 2.6 * inch]
    ))
    story.append(section("Display System (Per Court)"))
    story.append(make_table(
        ["Item", "Source"],
        [
            ["65\" TV (VESA 400×300)", "Drop-shipped"],
            ["Apple TV 4K + Ethernet", "Apple Business"],
            ["HIDEit Mount (Apple TV)", "HIDEit"],
            ["iPad + PoE Adapter", "Apple / Supplier"],
            ["iPad Kiosk Case", "Supplier"],
            ["Amazon Basics 3ft HDMI", "Amazon"],
        ],
        [4.5 * inch, 2.6 * inch]
    ))
    story.append(PageBreak())

    # ─── APPENDIX C ───
    story.append(phase_banner("Appendix C: Network Reference"))
    story.append(Spacer(1, 8))
    story.append(section("VLAN Architecture"))
    story.append(make_table(
        ["VLAN", "ID", "Subnet", "Purpose"],
        [
            ["Default", "—", "192.168.30.x (after camera config)", "Management"],
            ["REPLAY", "32", "192.168.32.x", "Mac Mini, cameras, iPads, Apple TVs"],
            ["SURVEILLANCE", "31", "192.168.31.x", "NVR + security cameras (optional)"],
            ["ACCESS CONTROL", "33", "192.168.33.x", "Kisi / UniFi Access (optional)"],
        ],
        [1.5 * inch, 0.6 * inch, 2.5 * inch, 2.5 * inch]
    ))
    story.append(section("Key IP Addresses"))
    story.append(make_table(
        ["Device", "IP Address", "Notes"],
        [
            ["Mac Mini", "192.168.32.100 (fixed)", "Always this IP on REPLAY VLAN"],
            ["REPLAY Gateway", "192.168.32.254", "UDM gateway for VLAN 32"],
            ["Camera default", "192.168.1.108", "Factory default — changed to DHCP during config"],
            ["DDNS", "CUSTOMER.podplaydns.com", "Resolves to venue's public IP via FreeDNS"],
        ],
        [1.8 * inch, 2.3 * inch, 3.0 * inch]
    ))
    story.append(section("Internal Bandwidth"))
    story.append(body("<b>1 Gbps</b> (standard switch ports) is sufficient for up to ~20 replay cameras. SFP+ (10 Gbps) is available on UDM/switch but unnecessary for most deployments."))
    story.append(note_box("If large video uploads compete with camera streams, consider traffic prioritization rules on the switch — but most clubs do not need this."))
    story.append(Spacer(1, 4))

    story.append(section("Backup Internet (Autonomous / 24hr Venues)"))
    story.append(body("Autonomous venues operating 24/7 <b>must have two ISPs</b> from different providers, each with a static IP."))
    story.append(substep("Example: PLDT + Converge (Philippines) or Verizon + Spectrum (US)"))
    story.append(substep("Do NOT use two ISPs that share the same backbone — if one goes down, the other likely will too"))
    story.append(substep("UDM supports WAN failover — configure secondary WAN on UDM"))
    story.append(Spacer(1, 4))

    story.append(section("Critical Ports"))
    story.append(make_table(
        ["Port", "Protocol", "Direction", "Purpose"],
        [
            ["4000", "TCP/UDP", "Inbound → Mac Mini", "Replay service — ALL cloud communication"],
        ],
        [0.8 * inch, 1.2 * inch, 2.0 * inch, 3.1 * inch]
    ))
    story.append(section("Key Contacts"))
    story.append(make_table(
        ["Person", "Role", "Contact"],
        [
            ["Andy Korzeniacki", "Project Manager — specs, kickoff, camera positions", "917-937-6896 / andyk@podplay.app"],
            ["Nico", "Hardware, replay service, installs", "Via Chad"],
            ["Chad", "Head of operations — account decisions, credentials", "—"],
            ["Stan Wu", "Config guide author, hardware expert", "—"],
            ["Agustin", "App readiness", "—"],
            ["CS Team", "Booking / credits questions", "—"],
        ],
        [1.5 * inch, 3.0 * inch, 2.6 * inch]
    ))
    story.append(PageBreak())

    # ─── APPENDIX D ───
    story.append(phase_banner("Appendix D: Support Escalation Tiers"))
    story.append(Spacer(1, 8))
    story.append(make_table(
        ["Tier", "Handled By", "Examples"],
        [
            ["Tier 1", "On-site staff / remote monitoring team", "Device restart, app lock toggle, button battery replacement, basic connectivity checks"],
            ["Tier 2", "Configuration specialist (Nico-level)", "VLAN changes, camera re-config, Mosyle profile issues, DDNS troubleshooting, replay service restart"],
            ["Tier 3", "Engineer / Developer (Patrick-level)", "Replay service code bugs, video encoding issues (pixelation, stream corruption), port 4000 architecture issues, firmware-level camera problems"],
        ],
        [0.8 * inch, 2.0 * inch, 4.3 * inch]
    ))
    story.append(Spacer(1, 8))
    story.append(body("Most day-to-day issues are Tier 1. Tier 3 issues are rare — weekly developer call is used to review outstanding issues."))
    story.append(PageBreak())

    # ─── APPENDIX E ───
    story.append(phase_banner("Appendix E: Device Migration (ABM Transfer)"))
    story.append(Spacer(1, 8))
    story.append(body("When transferring devices from one Apple Business Manager organization to another:"))
    story.append(Spacer(1, 4))
    story.append(step(1, "Original org <b>releases</b> devices from their ABM"))
    story.append(step(2, "Released devices are <b>factory reset</b> automatically (all MDM profiles removed)"))
    story.append(step(3, "New org adds devices to their ABM (serial number or Apple Configurator)"))
    story.append(step(4, "New org links ABM to their MDM (Mosyle/Jamf)"))
    story.append(step(5, "Power on devices — should auto-enroll into new MDM"))
    story.append(step(6, "Re-apply all configurations: naming, app installation, App Lock, profiles"))
    story.append(Spacer(1, 4))
    story.append(note_box("Mac Mini must also be re-enrolled. The replay service and camera configs are unaffected by MDM migration — only Apple device management changes."))
    story.append(Spacer(1, 4))
    story.append(body("<b>MDM Options:</b> Mosyle (cheaper, Apple-only, current PodPlay choice) or Jamf (premier, Apple-only, works directly with Apple, more configuration options). If considering Android devices, neither works — evaluate cross-platform MDMs."))
    story.append(PageBreak())


    story.append(phase_banner("Appendix F: Open Questions (Asia Deployment)"))
    story.append(Spacer(1, 8))
    story.append(body("Resolve during NJ Training (March 2–10, 2026):"))
    story.append(Spacer(1, 4))
    story.append(make_table(
        ["#", "Question", "Category", "Priority"],
        [
            ["1", "PAL vs NTSC — does changing video standard break replay pipeline?", "Video", "CRITICAL"],
            ["2", "Camera firmware region-locked?", "Video", "CRITICAL"],
            ["3", "All hardware confirmed 220V/60Hz compatible?", "Power", "CRITICAL"],
            ["4", "What data flows over port 4000? V1=UDP, V2=TCP. Replays + cloud sync.", "Architecture", "ANSWERED"],
            ["5", "Fallback if port 4000 blocked by ISP?", "Architecture", "CRITICAL"],
            ["6", "Deployment server accessible remotely from PH?", "Deployment", "CRITICAL"],
            ["7", "What does deploy.py produce? Can we run our own?", "Deployment", "CRITICAL"],
            ["8", "Admin Dashboard — shared instance or own?", "Accounts", "CRITICAL"],
            ["9", "Mosyle — own instance needed. Cosmos is separate entity, not sub-org.", "Accounts", "ANSWERED"],
            ["10", "Apple Business Manager — own ABM needed. Can release devices from PodPlay ABM → factory reset → re-enroll.", "Accounts", "ANSWERED"],
            ["11", "UniFi Account — transfer ownership planned. First club under PodPlay, future under Cosmos.", "Accounts", "ANSWERED"],
            ["12", "FreeDNS — same domain for Asia venues?", "Accounts", "CRITICAL"],
            ["13", "App binary — white-labeled per facility. Each facility gets own app via VPP, not App Store.", "App", "ANSWERED"],
            ["14", "LOCATION_ID in P-List config routes app to correct backend. Dev team (Agustin) creates per facility.", "App", "ANSWERED"],
            ["15", "Mac Mini chip (M1/M2/M4) and year?", "Hardware", "HIGH"],
            ["16", "EmpireTech cameras available in Philippines?", "Sourcing", "MEDIUM"],
            ["17", "Flic buttons available in Philippines?", "Sourcing", "MEDIUM"],
            ["18", "Kisi ships to Philippines?", "Sourcing", "MEDIUM"],
        ],
        [0.4 * inch, 3.3 * inch, 1.2 * inch, 1.0 * inch]
    ))

    # ─── FOOTER ───
    story.append(Spacer(1, 24))
    story.append(hr())
    story.append(Paragraph(
        "Sources: PodPlay Config Guide v1.0 (Stan Wu, Sept 2024) · "
        "Nico Training Call Transcript (Feb 25, 2026) · "
        "Cosmos/PodPlay NJ Setup Training Transcripts Parts 1-6 (March 2026) · "
        "PodPlay Hardware Installation Guide (Andy) · "
        "PodPlay System Diagram · "
        "PodPlay Asia Infrastructure Analysis · "
        "Hardware BOM",
        styles["SmallGray"]
    ))
    story.append(Paragraph("Generated March 2026 — CONFIDENTIAL", styles["SmallGray"]))

    doc.build(story)
    print(f"PDF generated: {OUTPUT}")


if __name__ == "__main__":
    build_pdf()
