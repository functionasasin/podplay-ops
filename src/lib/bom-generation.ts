// BOM Generation — pure TypeScript function with static data structures.
// Implements every rule from final-mega-spec/business-logic/bom-generation.md.
// Uses seed-data.md SKUs and unit costs (some SKUs differ from bom-generation.md — see spec-gaps.md).

import type { ServiceTier, BomCategory } from '@/lib/types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ProjectBomItem {
  sku: string;
  name: string;
  category: BomCategory;
  quantity: number;
  unitCost: number | null;
}

interface CatalogItem {
  sku: string;
  name: string;
  category: BomCategory;
  unitCost: number | null;
}

interface TemplateRow {
  sku: string;
  qtyPerVenue: number;
  qtyPerCourt: number;
  qtyPerDoor: number;
  qtyPerCamera: number;
  sortOrder: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Static Hardware Catalog
// All 47 items from final-mega-spec/data-model/seed-data.md Section 2.
// ─────────────────────────────────────────────────────────────────────────────

const CATALOG: Record<string, CatalogItem> = {
  // Network Rack
  'NET-UDM-SE':           { sku: 'NET-UDM-SE',           name: 'UniFi UDM-SE Gateway',                        category: 'network_rack',      unitCost: 379.00 },
  'NET-UDM-PRO':          { sku: 'NET-UDM-PRO',          name: 'UniFi UDM-Pro Gateway',                       category: 'network_rack',      unitCost: 379.00 },
  'NET-UDM-PRO-MAX':      { sku: 'NET-UDM-PRO-MAX',      name: 'UniFi UDM-Pro-Max Gateway',                   category: 'network_rack',      unitCost: 599.00 },
  'NET-USW-PRO-24-POE':   { sku: 'NET-USW-PRO-24-POE',   name: 'UniFi USW-Pro-24-POE Switch',                 category: 'network_rack',      unitCost: 249.00 },
  'NET-USW-24-POE':       { sku: 'NET-USW-24-POE',       name: 'UniFi USW-24-POE Switch',                     category: 'network_rack',      unitCost: 189.00 },
  'NET-USW-PRO-48-POE':   { sku: 'NET-USW-PRO-48-POE',   name: 'UniFi USW-Pro-48-POE Switch',                 category: 'network_rack',      unitCost: 519.00 },
  'NET-SFP-DAC':          { sku: 'NET-SFP-DAC',          name: 'UniFi SFP+ DAC Cable 0.5m',                   category: 'network_rack',      unitCost: 12.00  },
  'NET-PATCH-1FT':        { sku: 'NET-PATCH-1FT',        name: 'Monoprice Cat6 1ft Patch Cable',               category: 'network_rack',      unitCost: 3.00   },
  'NET-PATCH-3FT':        { sku: 'NET-PATCH-3FT',        name: 'Monoprice Cat6 3ft Patch Cable',               category: 'network_rack',      unitCost: 5.00   },
  'NET-PATCH-10FT':       { sku: 'NET-PATCH-10FT',       name: 'Monoprice Cat6 10ft Patch Cable',              category: 'network_rack',      unitCost: 8.00   },
  'NET-PDU':              { sku: 'NET-PDU',              name: 'TrippLite 12-Outlet Rack PDU',                 category: 'network_rack',      unitCost: 45.00  },
  'NET-PATCH-PANEL-24':   { sku: 'NET-PATCH-PANEL-24',   name: 'iwillink 24-Port Patch Panel with Couplers',  category: 'network_rack',      unitCost: 30.00  },
  // Infrastructure
  'INFRA-UPS':            { sku: 'INFRA-UPS',            name: 'APC 1500VA Rack-Mount UPS',                   category: 'infrastructure',    unitCost: 250.00 },
  'INFRA-RACK':           { sku: 'INFRA-RACK',           name: '12U Network Rack Enclosure',                  category: 'infrastructure',    unitCost: 180.00 },
  'INFRA-RACK-SHELF':     { sku: 'INFRA-RACK-SHELF',     name: 'Pyle 19-Inch 1U Vented Rack Shelf',           category: 'infrastructure',    unitCost: 20.00  },
  // Replay System
  'REPLAY-MACMINI':       { sku: 'REPLAY-MACMINI',       name: 'Mac Mini 16GB 256GB',                         category: 'replay_system',     unitCost: 700.00 },
  'REPLAY-SSD-1TB':       { sku: 'REPLAY-SSD-1TB',       name: 'Samsung T7 1TB External SSD',                 category: 'replay_system',     unitCost: 90.00  },
  'REPLAY-SSD-2TB':       { sku: 'REPLAY-SSD-2TB',       name: 'Samsung T7 2TB External SSD',                 category: 'replay_system',     unitCost: 160.00 },
  'REPLAY-SSD-4TB':       { sku: 'REPLAY-SSD-4TB',       name: 'Samsung T7 4TB External SSD',                 category: 'replay_system',     unitCost: 310.00 },
  'REPLAY-CAMERA-WHITE':  { sku: 'REPLAY-CAMERA-WHITE',  name: 'EmpireTech Replay Camera White',               category: 'replay_system',     unitCost: 120.00 },
  'REPLAY-CAMERA-BLACK':  { sku: 'REPLAY-CAMERA-BLACK',  name: 'EmpireTech Replay Camera Black',               category: 'replay_system',     unitCost: 120.00 },
  'REPLAY-CAMERA-JB-WHITE': { sku: 'REPLAY-CAMERA-JB-WHITE', name: 'EmpireTech Replay Camera Junction Box White', category: 'replay_system', unitCost: 15.00  },
  'REPLAY-CAMERA-JB-BLACK': { sku: 'REPLAY-CAMERA-JB-BLACK', name: 'EmpireTech Replay Camera Junction Box Black', category: 'replay_system', unitCost: 15.00  },
  'REPLAY-FLIC':          { sku: 'REPLAY-FLIC',          name: 'Flic Button',                                 category: 'replay_system',     unitCost: 35.00  },
  'REPLAY-SIGN':          { sku: 'REPLAY-SIGN',          name: 'Aluminum Printed Sign 6x8',                   category: 'replay_system',     unitCost: 25.00  },
  'REPLAY-HW-KIT':        { sku: 'REPLAY-HW-KIT',        name: 'Sign Mounting Hardware Kit',                   category: 'replay_system',     unitCost: 15.00  },
  // Displays
  'DISPLAY-TV-65':        { sku: 'DISPLAY-TV-65',        name: '65" TV Display',                              category: 'displays',          unitCost: 500.00 },
  'DISPLAY-TV-MOUNT':     { sku: 'DISPLAY-TV-MOUNT',     name: 'VESA 400x300 TV Tilt Wall Mount',             category: 'displays',          unitCost: 30.00  },
  'DISPLAY-APPLETV':      { sku: 'DISPLAY-APPLETV',      name: 'Apple TV 4K with Ethernet',                   category: 'displays',          unitCost: 130.00 },
  'DISPLAY-HDMI-3FT':     { sku: 'DISPLAY-HDMI-3FT',     name: 'Amazon Basics 3ft HDMI Cable',                category: 'displays',          unitCost: 7.00   },
  'DISPLAY-ATV-MOUNT':    { sku: 'DISPLAY-ATV-MOUNT',    name: 'HIDEit Apple TV Wall Mount',                  category: 'displays',          unitCost: 25.00  },
  'DISPLAY-IPAD':         { sku: 'DISPLAY-IPAD',         name: 'iPad 64GB WiFi+Cellular',                     category: 'displays',          unitCost: 600.00 },
  'DISPLAY-IPAD-POE':     { sku: 'DISPLAY-IPAD-POE',     name: 'iPad PoE Adapter',                            category: 'displays',          unitCost: 40.00  },
  'DISPLAY-IPAD-CASE':    { sku: 'DISPLAY-IPAD-CASE',    name: 'iPad Kiosk Case with Lock',                   category: 'displays',          unitCost: 80.00  },
  // Access Control (Autonomous / Autonomous+ only)
  'AC-KISI-CONTROLLER':   { sku: 'AC-KISI-CONTROLLER',   name: 'Kisi Controller Pro 2',                       category: 'access_control',    unitCost: 299.00 },
  'AC-KISI-READER':       { sku: 'AC-KISI-READER',       name: 'Kisi Reader Pro 2',                           category: 'access_control',    unitCost: 179.00 },
  // Surveillance (Autonomous+ only)
  'SURV-UNVR':            { sku: 'SURV-UNVR',            name: 'UniFi UNVR 4-Bay NVR',                        category: 'surveillance',      unitCost: 279.00 },
  'SURV-UNVR-PRO':        { sku: 'SURV-UNVR-PRO',        name: 'UniFi UNVR-Pro 7-Bay NVR',                    category: 'surveillance',      unitCost: 499.00 },
  'SURV-HDD':             { sku: 'SURV-HDD',             name: 'WD Purple 8TB Surveillance Hard Drive',        category: 'surveillance',      unitCost: 140.00 },
  'SURV-CAMERA-WHITE':    { sku: 'SURV-CAMERA-WHITE',    name: 'UniFi G5 Turret Ultra Security Camera White',  category: 'surveillance',      unitCost: 109.00 },
  'SURV-CAMERA-BLACK':    { sku: 'SURV-CAMERA-BLACK',    name: 'UniFi G5 Turret Ultra Security Camera Black',  category: 'surveillance',      unitCost: 109.00 },
  'SURV-CAMERA-JB-WHITE': { sku: 'SURV-CAMERA-JB-WHITE', name: 'UniFi Security Camera Junction Box White',     category: 'surveillance',      unitCost: 12.00  },
  'SURV-CAMERA-JB-BLACK': { sku: 'SURV-CAMERA-JB-BLACK', name: 'UniFi Security Camera Junction Box Black',     category: 'surveillance',      unitCost: 12.00  },
  // Front Desk (conditional: has_front_desk = true)
  // NOTE: bom-generation.md uses DESK-CC-TERMINAL/DESK-QR-SCANNER/DESK-WEBCAM SKUs;
  //       seed-data.md uses FD-CC-TERMINAL/FD-QR-SCANNER/FD-WEBCAM. Using seed-data SKUs.
  'FD-CC-TERMINAL':       { sku: 'FD-CC-TERMINAL',       name: 'BBPOS WisePOS E Credit Card Terminal',        category: 'front_desk',        unitCost: 249.00 },
  'FD-QR-SCANNER':        { sku: 'FD-QR-SCANNER',        name: '2D QR Code Barcode Scanner',                  category: 'front_desk',        unitCost: 40.00  },
  'FD-WEBCAM':            { sku: 'FD-WEBCAM',            name: 'Anker PowerConf C200 2K Webcam',              category: 'front_desk',        unitCost: 46.00  },
  // PingPod Specific (conditional: has_pingpod_wifi = true)
  'PP-WIFI-AP':           { sku: 'PP-WIFI-AP',           name: 'UniFi U6-Plus WiFi Access Point',             category: 'pingpod_specific',  unitCost: 99.00  },
};

// ─────────────────────────────────────────────────────────────────────────────
// BOM Templates — static data matching seed-data.md Section 6 (bom_templates)
// ─────────────────────────────────────────────────────────────────────────────
// NOTE on SURV-HDD: bom-generation.md specifies qty_per_camera=1 (one HDD per security camera).
// seed-data.md SQL uses qty_per_venue=4. Following bom-generation.md algorithm spec.

const TEMPLATES: Record<ServiceTier, TemplateRow[]> = {
  // ===========================================================================
  // PRO — 24 rows
  // ===========================================================================
  pro: [
    // Network Rack
    { sku: 'NET-UDM-SE',           qtyPerVenue: 1, qtyPerCourt: 0, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 100 },
    { sku: 'NET-USW-PRO-24-POE',   qtyPerVenue: 1, qtyPerCourt: 0, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 110 },
    { sku: 'NET-SFP-DAC',          qtyPerVenue: 1, qtyPerCourt: 0, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 120 },
    { sku: 'NET-PDU',              qtyPerVenue: 1, qtyPerCourt: 0, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 130 },
    { sku: 'NET-PATCH-PANEL-24',   qtyPerVenue: 1, qtyPerCourt: 0, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 140 },
    { sku: 'NET-PATCH-1FT',        qtyPerVenue: 0, qtyPerCourt: 3, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 150 },
    { sku: 'NET-PATCH-3FT',        qtyPerVenue: 6, qtyPerCourt: 0, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 160 },
    // Infrastructure
    { sku: 'INFRA-UPS',            qtyPerVenue: 1, qtyPerCourt: 0, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 200 },
    { sku: 'INFRA-RACK',           qtyPerVenue: 1, qtyPerCourt: 0, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 210 },
    { sku: 'INFRA-RACK-SHELF',     qtyPerVenue: 1, qtyPerCourt: 0, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 220 },
    // Replay System
    { sku: 'REPLAY-MACMINI',       qtyPerVenue: 1, qtyPerCourt: 0, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 300 },
    { sku: 'REPLAY-SSD-1TB',       qtyPerVenue: 1, qtyPerCourt: 0, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 310 },
    { sku: 'REPLAY-CAMERA-WHITE',  qtyPerVenue: 0, qtyPerCourt: 1, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 320 },
    { sku: 'REPLAY-CAMERA-JB-WHITE', qtyPerVenue: 0, qtyPerCourt: 1, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 330 },
    { sku: 'REPLAY-FLIC',          qtyPerVenue: 0, qtyPerCourt: 2, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 340 },
    { sku: 'REPLAY-SIGN',          qtyPerVenue: 0, qtyPerCourt: 1, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 350 },
    { sku: 'REPLAY-HW-KIT',        qtyPerVenue: 1, qtyPerCourt: 0, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 360 },
    // Displays
    { sku: 'DISPLAY-TV-65',        qtyPerVenue: 0, qtyPerCourt: 1, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 400 },
    { sku: 'DISPLAY-TV-MOUNT',     qtyPerVenue: 0, qtyPerCourt: 1, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 410 },
    { sku: 'DISPLAY-APPLETV',      qtyPerVenue: 0, qtyPerCourt: 1, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 420 },
    { sku: 'DISPLAY-HDMI-3FT',     qtyPerVenue: 0, qtyPerCourt: 1, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 430 },
    { sku: 'DISPLAY-ATV-MOUNT',    qtyPerVenue: 0, qtyPerCourt: 1, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 440 },
    { sku: 'DISPLAY-IPAD',         qtyPerVenue: 0, qtyPerCourt: 1, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 450 },
    { sku: 'DISPLAY-IPAD-POE',     qtyPerVenue: 0, qtyPerCourt: 1, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 460 },
    { sku: 'DISPLAY-IPAD-CASE',    qtyPerVenue: 0, qtyPerCourt: 1, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 470 },
  ],

  // ===========================================================================
  // AUTONOMOUS — 27 rows (Pro + 10ft patch cables + Kisi controller/reader + G5 cameras)
  // ===========================================================================
  autonomous: [
    // Network Rack
    { sku: 'NET-UDM-SE',           qtyPerVenue: 1, qtyPerCourt: 0, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 100 },
    { sku: 'NET-USW-PRO-24-POE',   qtyPerVenue: 1, qtyPerCourt: 0, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 110 },
    { sku: 'NET-SFP-DAC',          qtyPerVenue: 1, qtyPerCourt: 0, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 120 },
    { sku: 'NET-PDU',              qtyPerVenue: 1, qtyPerCourt: 0, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 130 },
    { sku: 'NET-PATCH-PANEL-24',   qtyPerVenue: 1, qtyPerCourt: 0, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 140 },
    { sku: 'NET-PATCH-1FT',        qtyPerVenue: 0, qtyPerCourt: 3, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 150 },
    { sku: 'NET-PATCH-3FT',        qtyPerVenue: 6, qtyPerCourt: 0, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 160 },
    { sku: 'NET-PATCH-10FT',       qtyPerVenue: 2, qtyPerCourt: 0, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 165 },
    // Infrastructure
    { sku: 'INFRA-UPS',            qtyPerVenue: 1, qtyPerCourt: 0, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 200 },
    { sku: 'INFRA-RACK',           qtyPerVenue: 1, qtyPerCourt: 0, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 210 },
    { sku: 'INFRA-RACK-SHELF',     qtyPerVenue: 1, qtyPerCourt: 0, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 220 },
    // Replay System
    { sku: 'REPLAY-MACMINI',       qtyPerVenue: 1, qtyPerCourt: 0, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 300 },
    { sku: 'REPLAY-SSD-1TB',       qtyPerVenue: 1, qtyPerCourt: 0, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 310 },
    { sku: 'REPLAY-CAMERA-WHITE',  qtyPerVenue: 0, qtyPerCourt: 1, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 320 },
    { sku: 'REPLAY-CAMERA-JB-WHITE', qtyPerVenue: 0, qtyPerCourt: 1, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 330 },
    { sku: 'REPLAY-FLIC',          qtyPerVenue: 0, qtyPerCourt: 2, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 340 },
    { sku: 'REPLAY-SIGN',          qtyPerVenue: 0, qtyPerCourt: 1, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 350 },
    { sku: 'REPLAY-HW-KIT',        qtyPerVenue: 1, qtyPerCourt: 0, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 360 },
    // Displays
    { sku: 'DISPLAY-TV-65',        qtyPerVenue: 0, qtyPerCourt: 1, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 400 },
    { sku: 'DISPLAY-TV-MOUNT',     qtyPerVenue: 0, qtyPerCourt: 1, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 410 },
    { sku: 'DISPLAY-APPLETV',      qtyPerVenue: 0, qtyPerCourt: 1, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 420 },
    { sku: 'DISPLAY-HDMI-3FT',     qtyPerVenue: 0, qtyPerCourt: 1, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 430 },
    { sku: 'DISPLAY-ATV-MOUNT',    qtyPerVenue: 0, qtyPerCourt: 1, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 440 },
    { sku: 'DISPLAY-IPAD',         qtyPerVenue: 0, qtyPerCourt: 1, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 450 },
    { sku: 'DISPLAY-IPAD-POE',     qtyPerVenue: 0, qtyPerCourt: 1, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 460 },
    { sku: 'DISPLAY-IPAD-CASE',    qtyPerVenue: 0, qtyPerCourt: 1, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 470 },
    // Access Control (Autonomous addition)
    { sku: 'AC-KISI-CONTROLLER',   qtyPerVenue: 1, qtyPerCourt: 0, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 500 },
    { sku: 'AC-KISI-READER',       qtyPerVenue: 0, qtyPerCourt: 0, qtyPerDoor: 1, qtyPerCamera: 0, sortOrder: 510 },
    // Surveillance — cameras without NVR (cloud-managed)
    { sku: 'SURV-CAMERA-WHITE',    qtyPerVenue: 0, qtyPerCourt: 0, qtyPerDoor: 0, qtyPerCamera: 1, sortOrder: 600 },
    { sku: 'SURV-CAMERA-JB-WHITE', qtyPerVenue: 0, qtyPerCourt: 0, qtyPerDoor: 0, qtyPerCamera: 1, sortOrder: 610 },
  ],

  // ===========================================================================
  // AUTONOMOUS+ — 29 rows (Autonomous + extra SFP DAC + NVR + hard drives)
  // NOTE: qty_per_camera=1 for SURV-HDD per bom-generation.md algorithm spec.
  //       seed-data.md SQL uses qty_per_venue=4 — see spec-gaps.md.
  // ===========================================================================
  autonomous_plus: [
    // Network Rack (extra SFP DAC for NVR link = 2 total)
    { sku: 'NET-UDM-SE',           qtyPerVenue: 1, qtyPerCourt: 0, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 100 },
    { sku: 'NET-USW-PRO-24-POE',   qtyPerVenue: 1, qtyPerCourt: 0, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 110 },
    { sku: 'NET-SFP-DAC',          qtyPerVenue: 2, qtyPerCourt: 0, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 120 },
    { sku: 'NET-PDU',              qtyPerVenue: 1, qtyPerCourt: 0, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 130 },
    { sku: 'NET-PATCH-PANEL-24',   qtyPerVenue: 1, qtyPerCourt: 0, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 140 },
    { sku: 'NET-PATCH-1FT',        qtyPerVenue: 0, qtyPerCourt: 3, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 150 },
    { sku: 'NET-PATCH-3FT',        qtyPerVenue: 6, qtyPerCourt: 0, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 160 },
    { sku: 'NET-PATCH-10FT',       qtyPerVenue: 2, qtyPerCourt: 0, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 165 },
    // Infrastructure
    { sku: 'INFRA-UPS',            qtyPerVenue: 1, qtyPerCourt: 0, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 200 },
    { sku: 'INFRA-RACK',           qtyPerVenue: 1, qtyPerCourt: 0, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 210 },
    { sku: 'INFRA-RACK-SHELF',     qtyPerVenue: 1, qtyPerCourt: 0, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 220 },
    // Replay System
    { sku: 'REPLAY-MACMINI',       qtyPerVenue: 1, qtyPerCourt: 0, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 300 },
    { sku: 'REPLAY-SSD-1TB',       qtyPerVenue: 1, qtyPerCourt: 0, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 310 },
    { sku: 'REPLAY-CAMERA-WHITE',  qtyPerVenue: 0, qtyPerCourt: 1, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 320 },
    { sku: 'REPLAY-CAMERA-JB-WHITE', qtyPerVenue: 0, qtyPerCourt: 1, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 330 },
    { sku: 'REPLAY-FLIC',          qtyPerVenue: 0, qtyPerCourt: 2, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 340 },
    { sku: 'REPLAY-SIGN',          qtyPerVenue: 0, qtyPerCourt: 1, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 350 },
    { sku: 'REPLAY-HW-KIT',        qtyPerVenue: 1, qtyPerCourt: 0, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 360 },
    // Displays
    { sku: 'DISPLAY-TV-65',        qtyPerVenue: 0, qtyPerCourt: 1, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 400 },
    { sku: 'DISPLAY-TV-MOUNT',     qtyPerVenue: 0, qtyPerCourt: 1, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 410 },
    { sku: 'DISPLAY-APPLETV',      qtyPerVenue: 0, qtyPerCourt: 1, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 420 },
    { sku: 'DISPLAY-HDMI-3FT',     qtyPerVenue: 0, qtyPerCourt: 1, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 430 },
    { sku: 'DISPLAY-ATV-MOUNT',    qtyPerVenue: 0, qtyPerCourt: 1, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 440 },
    { sku: 'DISPLAY-IPAD',         qtyPerVenue: 0, qtyPerCourt: 1, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 450 },
    { sku: 'DISPLAY-IPAD-POE',     qtyPerVenue: 0, qtyPerCourt: 1, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 460 },
    { sku: 'DISPLAY-IPAD-CASE',    qtyPerVenue: 0, qtyPerCourt: 1, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 470 },
    // Access Control
    { sku: 'AC-KISI-CONTROLLER',   qtyPerVenue: 1, qtyPerCourt: 0, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 500 },
    { sku: 'AC-KISI-READER',       qtyPerVenue: 0, qtyPerCourt: 0, qtyPerDoor: 1, qtyPerCamera: 0, sortOrder: 510 },
    // Surveillance (Autonomous+ additions: NVR + hard drives + cameras)
    { sku: 'SURV-CAMERA-WHITE',    qtyPerVenue: 0, qtyPerCourt: 0, qtyPerDoor: 0, qtyPerCamera: 1, sortOrder: 600 },
    { sku: 'SURV-CAMERA-JB-WHITE', qtyPerVenue: 0, qtyPerCourt: 0, qtyPerDoor: 0, qtyPerCamera: 1, sortOrder: 610 },
    { sku: 'SURV-UNVR',            qtyPerVenue: 1, qtyPerCourt: 0, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 620 },
    { sku: 'SURV-HDD',             qtyPerVenue: 0, qtyPerCourt: 0, qtyPerDoor: 0, qtyPerCamera: 1, sortOrder: 630 },
  ],

  // ===========================================================================
  // PBK — 24 rows (identical hardware to Pro; custom pricing via settings)
  // ===========================================================================
  pbk: [
    // Network Rack
    { sku: 'NET-UDM-SE',           qtyPerVenue: 1, qtyPerCourt: 0, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 100 },
    { sku: 'NET-USW-PRO-24-POE',   qtyPerVenue: 1, qtyPerCourt: 0, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 110 },
    { sku: 'NET-SFP-DAC',          qtyPerVenue: 1, qtyPerCourt: 0, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 120 },
    { sku: 'NET-PDU',              qtyPerVenue: 1, qtyPerCourt: 0, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 130 },
    { sku: 'NET-PATCH-PANEL-24',   qtyPerVenue: 1, qtyPerCourt: 0, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 140 },
    { sku: 'NET-PATCH-1FT',        qtyPerVenue: 0, qtyPerCourt: 3, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 150 },
    { sku: 'NET-PATCH-3FT',        qtyPerVenue: 6, qtyPerCourt: 0, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 160 },
    // Infrastructure
    { sku: 'INFRA-UPS',            qtyPerVenue: 1, qtyPerCourt: 0, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 200 },
    { sku: 'INFRA-RACK',           qtyPerVenue: 1, qtyPerCourt: 0, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 210 },
    { sku: 'INFRA-RACK-SHELF',     qtyPerVenue: 1, qtyPerCourt: 0, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 220 },
    // Replay System
    { sku: 'REPLAY-MACMINI',       qtyPerVenue: 1, qtyPerCourt: 0, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 300 },
    { sku: 'REPLAY-SSD-1TB',       qtyPerVenue: 1, qtyPerCourt: 0, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 310 },
    { sku: 'REPLAY-CAMERA-WHITE',  qtyPerVenue: 0, qtyPerCourt: 1, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 320 },
    { sku: 'REPLAY-CAMERA-JB-WHITE', qtyPerVenue: 0, qtyPerCourt: 1, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 330 },
    { sku: 'REPLAY-FLIC',          qtyPerVenue: 0, qtyPerCourt: 2, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 340 },
    { sku: 'REPLAY-SIGN',          qtyPerVenue: 0, qtyPerCourt: 1, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 350 },
    { sku: 'REPLAY-HW-KIT',        qtyPerVenue: 1, qtyPerCourt: 0, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 360 },
    // Displays
    { sku: 'DISPLAY-TV-65',        qtyPerVenue: 0, qtyPerCourt: 1, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 400 },
    { sku: 'DISPLAY-TV-MOUNT',     qtyPerVenue: 0, qtyPerCourt: 1, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 410 },
    { sku: 'DISPLAY-APPLETV',      qtyPerVenue: 0, qtyPerCourt: 1, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 420 },
    { sku: 'DISPLAY-HDMI-3FT',     qtyPerVenue: 0, qtyPerCourt: 1, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 430 },
    { sku: 'DISPLAY-ATV-MOUNT',    qtyPerVenue: 0, qtyPerCourt: 1, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 440 },
    { sku: 'DISPLAY-IPAD',         qtyPerVenue: 0, qtyPerCourt: 1, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 450 },
    { sku: 'DISPLAY-IPAD-POE',     qtyPerVenue: 0, qtyPerCourt: 1, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 460 },
    { sku: 'DISPLAY-IPAD-CASE',    qtyPerVenue: 0, qtyPerCourt: 1, qtyPerDoor: 0, qtyPerCamera: 0, sortOrder: 470 },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Sizing Helpers (from bom-generation.md)
// ─────────────────────────────────────────────────────────────────────────────

/** Step 3A: Select SSD SKU based on court count. */
function selectSsdSku(courtCount: number): string {
  if (courtCount <= 4) return 'REPLAY-SSD-1TB';
  if (courtCount <= 8) return 'REPLAY-SSD-2TB';
  return 'REPLAY-SSD-4TB';
}

/** Step 3B: Select switch SKU and qty for pro/pbk tiers. */
function selectSwitchConfig(courtCount: number): { sku: string; qty: number } {
  if (courtCount <= 8) return { sku: 'NET-USW-PRO-24-POE', qty: 1 };
  if (courtCount <= 16) return { sku: 'NET-USW-PRO-48-POE', qty: 1 };
  return { sku: 'NET-USW-PRO-48-POE', qty: 2 };
}

/** Step 3B: Select switch SKU and qty for autonomous/autonomous_plus tiers.
 *  Accounts for Kisi controller and security camera PoE port usage.
 */
function selectSwitchConfigAutonomous(
  courtCount: number,
  securityCameraCount: number
): { sku: string; qty: number } {
  // PoE ports needed: 3 per court + Mac Mini (1) + Kisi controller (1) + security cameras (1 each)
  const portsNeeded = courtCount * 3 + 1 + 1 + securityCameraCount;
  if (portsNeeded <= 22) return { sku: 'NET-USW-PRO-24-POE', qty: 1 };
  if (portsNeeded <= 46) return { sku: 'NET-USW-PRO-48-POE', qty: 1 };
  return { sku: 'NET-USW-PRO-48-POE', qty: 2 };
}

/** Step 3C: Select NVR SKU based on security camera count (autonomous_plus only).
 *  NOTE: bom-generation.md uses SURV-NVR-4BAY/SURV-NVR-7BAY as SKU names;
 *        seed-data.md uses SURV-UNVR/SURV-UNVR-PRO. Using seed-data SKUs.
 */
function selectNvrSku(securityCameraCount: number): string {
  return securityCameraCount <= 4 ? 'SURV-UNVR' : 'SURV-UNVR-PRO';
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Export
// ─────────────────────────────────────────────────────────────────────────────

/**
 * generateBOM
 *
 * Pure function — no I/O. Generates a full BOM for a project based on its parameters.
 * Implements the 5-step algorithm from final-mega-spec/business-logic/bom-generation.md:
 *   Step 1: Load template rows for tier (static data)
 *   Step 2: Apply base quantity formula per row
 *   Step 3: Apply sizing substitutions (SSD, switch, NVR)
 *   Step 4: Add conditional items (front desk, PingPod WiFi)
 *   Step 5: Cost chain — unit costs already embedded in catalog; computed columns
 *           (est_total_cost, landed_cost, customer_price) are Postgres GENERATED ALWAYS.
 *
 * @returns Array of ProjectBomItem sorted by sort_order, with zero-qty rows excluded.
 */
export function generateBOM(
  tier: ServiceTier,
  courtCount: number,
  doorCount: number,
  cameraCount: number,
  hasFrontDesk: boolean,
  hasPingpodWifi: boolean
): ProjectBomItem[] {
  const templateRows = TEMPLATES[tier];
  const items: ProjectBomItem[] = [];

  // Steps 2 + 3: Base qty formula + sizing substitutions
  for (const row of templateRows) {
    const rawQty =
      row.qtyPerVenue +
      row.qtyPerCourt * courtCount +
      row.qtyPerDoor * doorCount +
      row.qtyPerCamera * cameraCount;

    if (rawQty === 0) continue; // Skip zero-qty items (spec: "excluded entirely")

    let sku = row.sku;
    let qty = rawQty;

    // 3A: SSD substitution — template defaults to REPLAY-SSD-1TB
    if (sku === 'REPLAY-SSD-1TB') {
      sku = selectSsdSku(courtCount);
    }

    // 3B: Switch substitution — template defaults to NET-USW-PRO-24-POE
    if (sku === 'NET-USW-PRO-24-POE') {
      const cfg =
        tier === 'autonomous' || tier === 'autonomous_plus'
          ? selectSwitchConfigAutonomous(courtCount, cameraCount)
          : selectSwitchConfig(courtCount);
      sku = cfg.sku;
      qty = cfg.qty;
    }

    // 3C: NVR substitution — template defaults to SURV-UNVR (autonomous_plus only)
    if (sku === 'SURV-UNVR') {
      sku = selectNvrSku(cameraCount);
    }

    const catalogItem = CATALOG[sku];
    if (!catalogItem) {
      console.warn(`[generateBOM] SKU not found in catalog: ${sku} — skipping`);
      continue;
    }

    items.push({
      sku: catalogItem.sku,
      name: catalogItem.name,
      category: catalogItem.category,
      quantity: qty,
      unitCost: catalogItem.unitCost,
    });
  }

  // Step 4A: Front desk items (has_front_desk = true)
  if (hasFrontDesk) {
    for (const fdSku of ['FD-CC-TERMINAL', 'FD-QR-SCANNER', 'FD-WEBCAM'] as const) {
      const catalogItem = CATALOG[fdSku];
      if (!catalogItem) {
        console.warn(`[generateBOM] Front desk SKU not found: ${fdSku} — skipping`);
        continue;
      }
      items.push({
        sku: catalogItem.sku,
        name: catalogItem.name,
        category: catalogItem.category,
        quantity: 1,
        unitCost: catalogItem.unitCost,
      });
    }
  }

  // Step 4B: PingPod WiFi AP (has_pingpod_wifi = true)
  if (hasPingpodWifi) {
    const catalogItem = CATALOG['PP-WIFI-AP'];
    if (!catalogItem) {
      console.warn('[generateBOM] PP-WIFI-AP not found in catalog — skipping');
    } else {
      items.push({
        sku: catalogItem.sku,
        name: catalogItem.name,
        category: catalogItem.category,
        quantity: 1,
        unitCost: catalogItem.unitCost,
      });
    }
  }

  return items;
}
