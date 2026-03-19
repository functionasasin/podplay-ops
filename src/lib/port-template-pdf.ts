import { jsPDF } from 'jspdf';
import type { PortTemplateData, UDMPanel, PortColumn } from '@/lib/port-template';
import { PORT_COLORS } from '@/lib/port-template';

// ─── Layout constants (all in mm) ────────────────────────────────────────────

const MARGIN   = 10;   // page margin
const BOX_W    = 11;   // port box width
const BOX_H    = 12;   // port box height
const GAP      = 0.5;  // gap between adjacent boxes in a row
const NULL_W   = 8;    // gap spacer width (null entry in port arrays)
const NUM_H    = 4;    // port number label row height
const PAD      = 3;    // panel inner padding (each side)
const PANEL_H  = 2 * NUM_H + 2 * BOX_H + 2 * PAD; // total panel height
const PANEL_SPACING  = 16; // horizontal gap between UDM and switch panel
const SW_ROW_SPACING = 20; // vertical gap between switch rows (2-switch layout)

// ─── Color helpers ────────────────────────────────────────────────────────────

/** Color squares for the legend — also used for empty fills in renderer */
const LEGEND_COLORS: Record<string, string> = {
  iPad:             PORT_COLORS.ipad,
  'Replay Camera':  PORT_COLORS.camera,
  'Apple TV':       PORT_COLORS.appletv,
  'Mac Mini':       PORT_COLORS.udm,
  'Security Camera':PORT_COLORS.securitycam,
  'Kisi':           PORT_COLORS.kisi,
};

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  return [
    parseInt(clean.substring(0, 2), 16),
    parseInt(clean.substring(2, 4), 16),
    parseInt(clean.substring(4, 6), 16),
  ];
}

function setFill(doc: jsPDF, hex: string) {
  const [r, g, b] = hexToRgb(hex);
  doc.setFillColor(r, g, b);
}

function setDraw(doc: jsPDF, hex: string) {
  const [r, g, b] = hexToRgb(hex);
  doc.setDrawColor(r, g, b);
}

function setTextCol(doc: jsPDF, hex: string) {
  // Use hex string directly — most reliable across jsPDF versions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (doc as any).setTextColor(hex);
}

// ─── Row width calculation ────────────────────────────────────────────────────

/**
 * Calculate the rendered width (mm) of a sequence of port entries.
 * Each non-null entry is BOX_W wide; null entries are NULL_W wide.
 * GAP is added between consecutive items.
 */
function rowWidth(ports: (number | null)[]): number {
  if (ports.length === 0) return 0;
  const baseW = ports.reduce((sum, p) => sum + (p === null ? NULL_W : BOX_W), 0);
  const gaps   = (ports.length - 1) * GAP;
  return baseW + gaps;
}

/**
 * Calculate the rendered width (mm) of a switch column array.
 * Accounts for gapBefore (NULL_W + GAP) on the SFP column.
 */
function switchRowWidth(columns: PortColumn[]): number {
  let w = 0;
  columns.forEach((col, i) => {
    if (col.gapBefore) w += NULL_W + GAP;
    w += BOX_W;
    if (i < columns.length - 1 && !columns[i + 1].gapBefore) w += GAP;
  });
  return w;
}

// ─── Drawing primitives ───────────────────────────────────────────────────────

function drawPortBox(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  deviceLabel: string,
  ip: string,
) {
  setFill(doc, color);
  setDraw(doc, '#000000');
  doc.setLineWidth(0.2);
  doc.rect(x, y, w, h, 'FD');

  if (!deviceLabel) return;

  setTextCol(doc, '#000000');
  const lines = deviceLabel.split('\n');
  const labelSize = 5;
  const ipSize    = 4;
  const lineH     = 2.0;  // mm per label line
  const ipH       = 1.8;  // mm for IP line
  const bottomPad = 0.8;

  const totalH = lines.length * lineH + (ip ? ipH : 0);
  let textY = y + h - bottomPad - totalH;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(labelSize);
  for (const line of lines) {
    doc.text(line, x + 1, textY + lineH * 0.75);
    textY += lineH;
  }

  if (ip) {
    doc.setFontSize(ipSize);
    doc.text(ip, x + 1, textY + ipH * 0.75);
  }
}

function drawPortNum(doc: jsPDF, x: number, y: number, w: number, h: number, port: number | null, label?: string) {
  if (port === null && !label) return;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(4.5);
  setTextCol(doc, '#000000');
  const text = label ?? `Port ${port}`;
  doc.text(text, x + w / 2, y + h / 2 + 0.8, { align: 'center' });
}

// ─── UDM panel ────────────────────────────────────────────────────────────────

function drawUDMPanel(doc: jsPDF, udm: UDMPanel, panelX: number, panelY: number): number {
  const topW    = rowWidth(udm.topPorts);
  const botW    = rowWidth(udm.bottomPorts);
  const innerW  = Math.max(topW, botW);
  const panelW  = innerW + 2 * PAD;
  const innerH  = 2 * NUM_H + 2 * BOX_H;

  // Panel border
  setFill(doc, '#FFFFFF');
  setDraw(doc, '#000000');
  doc.setLineWidth(0.5);
  doc.rect(panelX, panelY, panelW, innerH + 2 * PAD, 'S');

  // Panel title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  setTextCol(doc, '#000000');
  doc.text('UDM', panelX, panelY - 1.5);

  const innerX = panelX + PAD;
  const innerY = panelY + PAD;

  // Helper to iterate a port array and draw boxes/labels
  function drawRow(
    ports: (number | null)[],
    baseY: number,
    mode: 'num' | 'box',
  ) {
    let x = innerX;
    ports.forEach((p, i) => {
      const w = p === null ? NULL_W : BOX_W;
      if (p !== null) {
        if (mode === 'num') {
          drawPortNum(doc, x, baseY, BOX_W, NUM_H, p);
        } else {
          const color = udm.colors[p] ??
            (udm.assign[p] ? PORT_COLORS.udm : PORT_COLORS.empty);
          drawPortBox(doc, x, baseY, BOX_W, BOX_H, color, udm.assign[p] ?? '', udm.ips[p] ?? '');
        }
      }
      x += w;
      if (i < ports.length - 1) x += GAP;
    });
  }

  // Row 1: top port numbers
  drawRow(udm.topPorts, innerY, 'num');
  // Row 2: top port boxes
  drawRow(udm.topPorts, innerY + NUM_H, 'box');
  // Row 3: bottom port boxes
  drawRow(udm.bottomPorts, innerY + NUM_H + BOX_H, 'box');
  // Row 4: bottom port numbers
  drawRow(udm.bottomPorts, innerY + NUM_H + BOX_H + BOX_H, 'num');

  return panelW;
}

// ─── Switch panel ─────────────────────────────────────────────────────────────

function drawSwitchPanel(
  doc: jsPDF,
  columns: PortColumn[],
  title: string,
  panelX: number,
  panelY: number,
) {
  const innerW = switchRowWidth(columns);
  const panelW = innerW + 2 * PAD;
  const innerH = 2 * NUM_H + 2 * BOX_H;

  // Panel border
  setFill(doc, '#FFFFFF');
  setDraw(doc, '#000000');
  doc.setLineWidth(0.5);
  doc.rect(panelX, panelY, panelW, innerH + 2 * PAD, 'S');

  // Panel title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  setTextCol(doc, '#000000');
  doc.text(title, panelX, panelY - 1.5);

  const innerX = panelX + PAD;
  const innerY = panelY + PAD;

  // Draw each column
  let x = innerX;
  columns.forEach((col, i) => {
    if (col.gapBefore) x += NULL_W + GAP;

    // Top port number
    if (col.isSfp) {
      drawPortNum(doc, x, innerY, BOX_W, NUM_H, null, 'SFP/Uplink');
    } else {
      drawPortNum(doc, x, innerY, BOX_W, NUM_H, col.topPort);
    }

    // Top box
    drawPortBox(doc, x, innerY + NUM_H, BOX_W, BOX_H, col.color, col.topDevice, col.topIp);

    // Bottom box
    const botColor = col.bottomDevice ? col.color : PORT_COLORS.empty;
    drawPortBox(doc, x, innerY + NUM_H + BOX_H, BOX_W, BOX_H, botColor, col.bottomDevice, col.bottomIp);

    // Bottom port number (blank for SFP)
    if (!col.isSfp) {
      drawPortNum(doc, x, innerY + NUM_H + 2 * BOX_H, BOX_W, NUM_H, col.bottomPort);
    }

    x += BOX_W;
    if (i < columns.length - 1 && !columns[i + 1].gapBefore) x += GAP;
  });
}

// ─── Legend ───────────────────────────────────────────────────────────────────

function drawLegend(doc: jsPDF, data: PortTemplateData, startY: number): number {
  const items: [string, string][] = [
    ['iPad — 192.168.32.(20+N)',       LEGEND_COLORS['iPad']],
    ['Camera — 192.168.31.(20+N)',     LEGEND_COLORS['Replay Camera']],
    ['Apple TV — 192.168.32.(40+N)',   LEGEND_COLORS['Apple TV']],
    ['Mac Mini — 192.168.32.100',      LEGEND_COLORS['Mac Mini']],
  ];
  if (data.cams > 0)   items.push(['UniFi Cam — 192.168.33.(10+N)',                              LEGEND_COLORS['Security Camera']]);
  if (data.isAuto)     items.push(['Kisi — 192.168.34.10+ (Controller .10, Readers .11+)',       LEGEND_COLORS['Kisi']]);
  items.push(['N = court/device number', '']);

  const SQUARE = 4;
  const ITEM_GAP = 8;
  let x = MARGIN;

  for (const [label, color] of items) {
    if (color) {
      setFill(doc, color);
      setDraw(doc, '#000000');
      doc.setLineWidth(0.2);
      doc.rect(x, startY, SQUARE, SQUARE, 'FD');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      setTextCol(doc, '#000000');
      doc.text(label, x + SQUARE + 1, startY + SQUARE * 0.7);
      x += SQUARE + 1 + doc.getTextWidth(label) + ITEM_GAP;
    } else {
      // "N = ..." note without a color square
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      setTextCol(doc, '#666666');
      doc.text(label, x, startY + SQUARE * 0.7);
      x += doc.getTextWidth(label) + ITEM_GAP;
    }
  }

  return startY + SQUARE + 4; // return Y after legend
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function downloadPortTemplatePdf(data: PortTemplateData): void {
  try {
    const doc = new jsPDF({ orientation: 'landscape', format: 'a3', unit: 'mm' });

    let y = MARGIN;

    // Title
    const titleParts = [
      `Port Template — ${data.tierDisplayName} | ${data.courts} Courts`,
      data.isAuto ? `${data.doors} Doors` : null,
      data.cams > 0 ? `${data.cams} Security Cameras` : null,
    ].filter(Boolean);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    setTextCol(doc, '#1F3864');
    doc.text(titleParts.join(' | '), MARGIN, y + 4);
    y += 10;

    // Legend
    y = drawLegend(doc, data, y);
    y += 6; // breathing room between legend and panels

    // Switch panel title
    const sw1Title = data.switchCount === 1
      ? `${data.switchSize} Port Switch`
      : `Switch 1 (48-port) — iPads + Cameras`;

    // UDM panel
    const udmW = (() => {
      const botW = rowWidth(data.udm.bottomPorts);
      return botW + 2 * PAD;
    })();

    const switchX = MARGIN + udmW + PANEL_SPACING;

    drawUDMPanel(doc, data.udm, MARGIN, y);
    drawSwitchPanel(doc, data.switch1Columns, sw1Title, switchX, y);

    // Second switch row (if needed)
    if (data.switch2Columns !== null) {
      const extraLabel = [
        data.cams > 0 ? 'Security Cameras' : null,
        data.isAuto    ? 'Kisi'            : null,
      ].filter(Boolean).join(' + ');
      const sw2Title = `Switch 2 (48-port) — Apple TVs${extraLabel ? ` + ${extraLabel}` : ''}`;
      const sw2Y = y + PANEL_H + SW_ROW_SPACING;
      drawSwitchPanel(doc, data.switch2Columns, sw2Title, MARGIN, sw2Y);
    }

    // Auto-download
    const blob = doc.output('blob');
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = data.filename;
    a.click();
    // Defer revoke to avoid race condition on slower browsers
    setTimeout(() => URL.revokeObjectURL(url), 100);

  } catch (err) {
    console.error('Port template PDF generation failed:', err);
    throw err;
  }
}
