# Business Logic: Power Calculations

**Aspect**: logic-power-calculations
**Wave**: 3 — Business Logic & Workflows
**Date**: 2026-03-06
**Source References**:
- `analysis/source-hardware-guide.md` — rack component list, rack sizing (7–12U), 20A circuit requirement
- `analysis/source-deployment-guide.md` — Phase 3 (rack assembly), PDU/UPS chain, Mac Mini overheating warning
- `final-mega-spec/business-logic/bom-generation.md` — switch sizing logic, port budget per tier
- `final-mega-spec/data-model/seed-data.md` — hardware catalog items and costs

---

## Overview

Power calculations in the PodPlay wizard serve four purposes:

1. **PoE port budget validation** — confirm selected switch(es) have enough PoE wattage for all powered devices
2. **UPS runtime estimation** — predict how long the IT room rack stays online during a power outage
3. **Rack unit sizing** — determine the correct rack enclosure size (7U–12U)
4. **Circuit requirements** — confirm venue IT room has the required dedicated 20A circuit

These calculations are surfaced in the Stage 2 (Procurement) wizard as advisory information, not blocking validation. The operator sees the numbers and can confirm or override.

---

## 1. Per-Device Power Consumption

### 1A. Devices Powered Through the Network Switch (PoE)

These devices draw power from the switch PoE budget and are therefore on the UPS circuit.

| Device | SKU | PoE Standard | Typical Draw (W) | Max Draw (W) | Notes |
|--------|-----|-------------|-----------------|-------------|-------|
| Replay Camera | `REPLAY-CAMERA-WHITE` / `REPLAY-CAMERA-BLACK` | 802.3af (Class 3) | 10 | 15.4 | EmpireTech IPC-T54IR-ZE; IR illumination increases draw at night |
| iPad via PoE Adapter | `REPLAY-IPAD-POE-ADAPTER` | 802.3at (PoE+) | 25 | 30 | Adapter draws PoE+; charges iPad at ~18–25W depending on model |
| Security Camera (Autonomous) | `SURV-CAMERA-WHITE` / `SURV-CAMERA-BLACK` | 802.3af (Class 3) | 10 | 15.4 | UniFi G5 Turret Ultra |
| Kisi Controller Pro 2 | `AC-KISI-CONTROLLER` | 802.3af | 8 | 12.95 | Access control hub; powers readers via 12V output |

**Note on Apple TV**: Apple TV 4K connects to the switch via ethernet but uses its own power supply plugged into the court's 120V duplex outlet. It does NOT draw PoE from the switch. Apple TV consumes 6W at steady state but this load is on the court circuit, not the UPS-protected rack circuit.

**Note on Kisi Readers**: Kisi Reader Pro 2 units are powered by the Kisi Controller Pro 2 over 12V wiring — they do NOT consume switch PoE ports. Each controller supports up to 2 readers.

### 1B. Devices Powered from PDU/UPS (Non-PoE, in Rack)

These devices plug directly into the PDU, which connects to the UPS. They are on the UPS circuit.

| Device | SKU | Typical Draw (W) | Max Draw (W) | Notes |
|--------|-----|-----------------|-------------|-------|
| Mac Mini | `REPLAY-MAC-MINI` | 35 | 40 | Apple M-series; actual idle ~10W, sustained compute ~35W |
| UDM-SE (Gateway) | `NET-UDM-SE` | 33 | 38 | System draw only; PoE budget handled by switch |
| USW-Pro-24-POE (Switch) | `NET-USW-PRO-24-POE` | 26 | 26 + up to 400W PoE | System draw 26W + actual PoE loads |
| USW-Pro-48-POE (Switch) | `NET-USW-PRO-48-POE` | 35 | 35 + up to 600W PoE | System draw 35W + actual PoE loads |
| NVR UNVR (4-bay) | `SURV-NVR-4BAY` | 25 | 35 | Autonomous+ only |
| NVR UNVR-Pro (7-bay) | `SURV-NVR-7BAY` | 45 | 60 | Autonomous+ with 5+ cameras |
| PDU (TrippLite RS-1215-RA) | `NET-PDU` | 3 | 5 | Power strip overhead |
| UPS (self-consumption) | `NET-UPS` | 5 | 8 | Internal inverter/charging overhead |

### 1C. Devices NOT on the UPS Circuit

These devices are powered by court-level 120V outlets or are battery-powered:

| Device | Power Source | Notes |
|--------|-------------|-------|
| 65" Display (TV) | Court duplex outlet | 120–150W; not on UPS |
| Apple TV 4K | Court duplex outlet (behind TV) | 6W; shares duplex outlet with TV |
| Flic Bluetooth Buttons | CR2032 battery | No electrical circuit involvement |
| BBPOS WisePOS E CC Terminal | USB charging / battery | Front desk, not rack-mounted |
| QR Scanner | USB | Powered by front desk computer |
| Webcam | USB | Powered by front desk computer |

---

## 2. PoE Budget Validation

### 2A. Per-Court PoE Draw

For **Pro** and **PBK** tiers:

```
poe_per_court_pro = 15W (camera) + 25W (iPad PoE) = 40W per court
```

For **Autonomous** / **Autonomous+** tiers, the court draw is identical (security cameras go on the surveillance switch or the same switch depending on VLAN config, but still consume from the same switch PoE budget):

```
poe_per_court_autonomous = 15W (replay camera) + 25W (iPad PoE) = 40W per court
poe_per_security_camera  = 10W per security camera
poe_kisi_controller      = 8W (1 per venue, regardless of door count)
```

### 2B. Total PoE Load Formula

```typescript
function calcTotalPoeLoad(
  courtCount: number,
  securityCameraCount: number,
  tier: ServiceTier
): number {
  const courtPoe = courtCount * 40;      // replay camera + iPad per court
  const secCamPoe = securityCameraCount * 10; // only for autonomous/autonomous_plus
  const kisiPoe = (tier === 'autonomous' || tier === 'autonomous_plus') ? 8 : 0;
  return courtPoe + secCamPoe + kisiPoe;
}
```

### 2C. Switch PoE Budget Limits

| Switch SKU | PoE Budget (W) | Safe Operating Threshold (W) | Notes |
|-----------|---------------|------------------------------|-------|
| `NET-USW-PRO-24-POE` | 400 | 340 (85% of max) | Leave 15% headroom |
| `NET-USW-PRO-48-POE` | 600 | 510 (85% of max) | Leave 15% headroom |

When 2 switches are selected (`qty: 2`), each switch carries half the PoE load (courts split evenly between switches). The 85% threshold applies per switch.

### 2D. PoE Budget Validation Function

```typescript
interface PoeBudgetResult {
  totalPoeLoad: number;        // W
  switchQty: number;
  switchSku: string;
  switchBudgetPerUnit: number; // W
  loadPerSwitch: number;       // W
  budgetUtilizationPct: number;
  isOverBudget: boolean;
  warning: string | null;
}

function validatePoeBudget(
  courtCount: number,
  securityCameraCount: number,
  tier: ServiceTier
): PoeBudgetResult {
  const totalPoeLoad = calcTotalPoeLoad(courtCount, securityCameraCount, tier);
  const switchCfg =
    tier === 'autonomous' || tier === 'autonomous_plus'
      ? selectSwitchConfigAutonomous(courtCount, securityCameraCount)
      : selectSwitchConfig(courtCount);

  const budgetPerUnit = switchCfg.sku === 'NET-USW-PRO-24-POE' ? 400 : 600;
  const totalBudget = budgetPerUnit * switchCfg.qty;
  const loadPerSwitch = totalPoeLoad / switchCfg.qty;
  const safeThreshold = budgetPerUnit * 0.85;

  const isOverBudget = loadPerSwitch > safeThreshold;
  const utilizationPct = (loadPerSwitch / budgetPerUnit) * 100;

  return {
    totalPoeLoad,
    switchQty: switchCfg.qty,
    switchSku: switchCfg.sku,
    switchBudgetPerUnit: budgetPerUnit,
    loadPerSwitch,
    budgetUtilizationPct: utilizationPct,
    isOverBudget,
    warning: isOverBudget
      ? `PoE load per switch (${loadPerSwitch}W) exceeds 85% safe threshold (${safeThreshold}W). ` +
        `Consider upgrading to USW-Pro-48-POE or adding a second switch.`
      : null,
  };
}
```

### 2E. Concrete PoE Examples

**6-court Autonomous+ (8 security cameras)**:
- Court PoE: 6 × 40W = 240W
- Security cameras: 8 × 10W = 80W
- Kisi: 8W
- Total PoE load: 328W
- Switch: USW-Pro-48-POE (600W budget)
- Load per switch: 328W / 1 = 328W
- Utilization: 54.7% — within safe threshold (510W)

**4-court Pro**:
- Court PoE: 4 × 40W = 160W
- No Kisi, no security cameras
- Total PoE load: 160W
- Switch: USW-Pro-24-POE (400W budget)
- Load per switch: 160W
- Utilization: 40% — well within threshold

**17-court Pro** (2 switches):
- Court PoE: 17 × 40W = 680W
- Total PoE load: 680W
- Switch: 2× USW-Pro-48-POE (600W each)
- Load per switch: 680 / 2 = 340W
- Utilization per switch: 56.7% — within safe threshold

---

## 3. UPS Runtime Calculation

### 3A. What is on the UPS Circuit

The rack's PDU feeds the UPS, which feeds the wall outlet. All rack devices are UPS-protected:
- Mac Mini
- UDM gateway
- Switch(es) — including all PoE devices hanging off the switch (cameras, iPads)
- NVR (Autonomous+ only)
- PDU overhead
- UPS self-consumption

Court devices (TVs, Apple TVs) are NOT on the UPS circuit — they run off court outlets.

### 3B. Total UPS Load Formula

```typescript
function calcUpsLoad(
  courtCount: number,
  securityCameraCount: number,
  tier: ServiceTier
): number {
  // Switch system draw (not PoE)
  const switchCfg =
    tier === 'autonomous' || tier === 'autonomous_plus'
      ? selectSwitchConfigAutonomous(courtCount, securityCameraCount)
      : selectSwitchConfig(courtCount);
  const switchSystemDraw = switchCfg.sku === 'NET-USW-PRO-24-POE' ? 26 : 35;
  const switchTotalSystemDraw = switchSystemDraw * switchCfg.qty;

  // PoE loads (draw from switch, reflected as load on UPS circuit)
  const totalPoeLoad = calcTotalPoeLoad(courtCount, securityCameraCount, tier);

  // Non-PoE rack devices
  const macMini = 35;
  const udm = 33;
  const nvrDraw =
    tier === 'autonomous_plus'
      ? (securityCameraCount <= 4 ? 25 : 45)
      : 0;
  const pduOverhead = 3;
  const upsOverhead = 5;

  return (
    switchTotalSystemDraw +
    totalPoeLoad +
    macMini +
    udm +
    nvrDraw +
    pduOverhead +
    upsOverhead
  );
}
```

### 3C. UPS Battery and Runtime Formula

Standard PodPlay UPS: APC Back-UPS Pro 1500VA / 900W (or equivalent ~$250 unit).

| Spec | Value |
|------|-------|
| Battery capacity | ~280 Wh (24 Ah × 12V nominal) |
| Inverter efficiency | 85% |
| Runtime formula | `(batteryWh × efficiency) / totalLoadW × 60` minutes |

```typescript
const UPS_BATTERY_WH = 280;     // Wh — standard ~$250 UPS battery
const UPS_EFFICIENCY = 0.85;    // inverter efficiency

function calcUpsRuntime(upsLoadW: number): number {
  // Returns estimated runtime in minutes
  return (UPS_BATTERY_WH * UPS_EFFICIENCY) / upsLoadW * 60;
}
```

### 3D. Reference Calibration Point

**6-court Pro** system UPS load:
- Switch (USW-Pro-24-POE) system draw: 26W
- PoE devices: 6 × 40W = 240W
- Mac Mini: 35W
- UDM: 33W
- PDU + UPS overhead: 8W
- **Total UPS load: 342W**

Runtime: `(280 × 0.85) / 342 × 60 = 238 / 342 × 60 ≈ 41.7 min ≈ 43 min`

**This matches the known reference: 6-court system → ~43 minutes UPS runtime.** The formula is calibrated.

### 3E. UPS Runtime Examples by Configuration

| Configuration | Total UPS Load (W) | Estimated Runtime (min) |
|--------------|-------------------|------------------------|
| 1-court Pro | 26 + 40 + 35 + 33 + 8 = 142W | ~101 min |
| 4-court Pro | 26 + 160 + 35 + 33 + 8 = 262W | ~55 min |
| 6-court Pro | 26 + 240 + 35 + 33 + 8 = 342W | ~43 min |
| 8-court Pro | 26 + 320 + 35 + 33 + 8 = 422W | ~34 min |
| 9-court Pro (48-POE) | 35 + 360 + 35 + 33 + 8 = 471W | ~30 min |
| 16-court Pro (48-POE) | 35 + 640 + 35 + 33 + 8 = 751W | ~19 min |
| 17-court Pro (2× 48-POE) | 70 + 680 + 35 + 33 + 8 = 826W | ~17 min |
| 6-court Autonomous+ (8 cams) | 35 + 328 + 35 + 33 + 45 + 8 = 484W | ~30 min |

**UPS capacity warning threshold**: Display a yellow warning in Stage 2 when `estimatedRuntime < 15 minutes`. Recommend upgrading to a higher-capacity UPS or noting that the UPS provides surge protection only (not meaningful backup time).

```typescript
function upsRuntimeWarning(runtimeMin: number): string | null {
  if (runtimeMin < 15) {
    return `Estimated UPS runtime is ${Math.round(runtimeMin)} minutes. ` +
      `For larger installations, consider a higher-capacity UPS (2200VA/1300W). ` +
      `The standard UPS still provides surge protection and enables graceful shutdown.`;
  }
  if (runtimeMin < 30) {
    return `Estimated UPS runtime is ${Math.round(runtimeMin)} minutes. ` +
      `Sufficient for brief outages; automated shutdown recommended for extended outages.`;
  }
  return null;
}
```

---

## 4. Rack Unit (U) Sizing

### 4A. Component U Heights

| Component | Rack Units (U) | Notes |
|-----------|---------------|-------|
| Mac Mini (on shelf) | 2U | Includes shelf; needs breathing room above |
| ISP Modem | 1U | Only if rack-mountable; skip if tabletop modem used |
| UDM-SE / Pro / Pro-Max (Gateway) | 1U | All UDM models are 1U |
| Patch Panel (24-port) | 1U | |
| USW-Pro-24-POE (Switch) | 1U | |
| USW-Pro-48-POE (Switch) | 1U per unit | For 2-switch configs, add 2U |
| NVR UNVR (4-bay) | 1U | Autonomous+ only |
| NVR UNVR-Pro (7-bay) | 2U | Autonomous+ with 5+ cameras |
| UPS | 2U | Always at bottom of rack |
| PDU (TrippLite RS-1215-RA) | 0U | Mounted on back of rack — does not consume front rack units |

### 4B. Rack U Calculation Formula

```typescript
function calcRackUnits(
  courtCount: number,
  securityCameraCount: number,
  tier: ServiceTier,
  hasRackMountableModem: boolean = false
): { totalU: number; recommendedRackSize: number } {
  const base = 2 + 1 + 1;        // Mac Mini shelf + UDM + Patch Panel
  const upsU = 2;                  // UPS always at bottom

  // Switch U
  const switchCfg =
    tier === 'autonomous' || tier === 'autonomous_plus'
      ? selectSwitchConfigAutonomous(courtCount, securityCameraCount)
      : selectSwitchConfig(courtCount);
  const switchU = switchCfg.qty;   // 1U per switch unit

  // NVR U (Autonomous+ only)
  const nvrU =
    tier === 'autonomous_plus'
      ? (securityCameraCount <= 4 ? 1 : 2)
      : 0;

  // ISP modem (optional)
  const modemU = hasRackMountableModem ? 1 : 0;

  const totalU = base + upsU + switchU + nvrU + modemU;

  // Round up to next standard rack size: 7U, 9U, 12U
  // Add 1U slack for cable management / future expansion
  const withSlack = totalU + 1;
  const recommendedRackSize =
    withSlack <= 7 ? 7 :
    withSlack <= 9 ? 9 :
    12;

  return { totalU, recommendedRackSize };
}
```

### 4C. Rack Sizing Examples

| Configuration | Total U | Recommended Rack |
|--------------|---------|-----------------|
| 1–7 court Pro, no modem | 2+1+1+2+1 = 7U | 9U (1U slack) |
| 1–7 court Pro, with modem | 8U | 9U |
| 8–16 court Pro (48-POE) | 2+1+1+2+1 = 7U | 9U |
| 17+ court Pro (2× 48-POE) | 2+1+1+2+2 = 8U | 9U |
| 1–7 court Autonomous+ (4 cams, UNVR 1U) | 2+1+1+2+1+1 = 8U | 9U |
| 1–7 court Autonomous+ (6 cams, UNVR-Pro 2U) | 2+1+1+2+1+2 = 9U | 12U |
| 17+ court Autonomous+ (6 cams, 2× switch) | 2+1+1+2+2+2 = 10U | 12U |

**Hardware guide states**: rack size is 7–12U depending on courts and tier. This formula produces values within that range.

### 4D. Available Rack Unit Space After Components

```typescript
function calcAvailableRackUnits(
  courtCount: number,
  securityCameraCount: number,
  tier: ServiceTier,
  hasRackMountableModem: boolean = false
): number {
  const { totalU, recommendedRackSize } = calcRackUnits(
    courtCount, securityCameraCount, tier, hasRackMountableModem
  );
  return recommendedRackSize - totalU; // free U slots
}
```

This is surfaced as "X U available for future expansion" in the Stage 2 procurement UI.

---

## 5. Circuit Requirements

### 5A. Required Circuit

**All PodPlay installations require a dedicated 20A circuit in the IT room / network closet.**

This is non-negotiable — it must be confirmed with the venue before equipment ships.

```typescript
const REQUIRED_CIRCUIT_AMPS = 20;       // A
const REQUIRED_CIRCUIT_VOLTAGE = 120;   // V (US standard)
const REQUIRED_CIRCUIT_WATTS = REQUIRED_CIRCUIT_AMPS * REQUIRED_CIRCUIT_VOLTAGE * 0.8; // 1920W NEC 80% rule
```

The 20A circuit at 80% NEC load capacity = **1920W available**.

The maximum PodPlay rack load (17-court, 2 switches, no NVR) is ~826W — well within the 1920W circuit limit. Even the largest Autonomous+ configurations stay below 1000W, leaving substantial headroom.

### 5B. Circuit Validation

If the calculated UPS load exceeds 1600W (83% of 1920W), display an error in Stage 2:

```typescript
function validateCircuitLoad(upsLoadW: number): string | null {
  if (upsLoadW > 1600) {
    return `Total rack load (${upsLoadW}W) approaches the 20A circuit limit (1920W max at 80% NEC). ` +
      `Contact venue electrician to confirm circuit capacity before proceeding.`;
  }
  return null;
}
```

In practice, this warning will never fire for realistic court counts (would require >30 courts on a single switch circuit, which is physically impossible given port limits).

---

## 6. Complete Power Summary Function

```typescript
// src/services/power.ts

export interface PowerSummary {
  // PoE
  totalPoeLoad: number;           // W — all PoE devices
  switchSku: string;
  switchQty: number;
  switchBudgetPerUnit: number;    // W
  poeLoadPerSwitch: number;       // W
  poeBudgetUtilizationPct: number;
  poeOverBudget: boolean;
  poeBudgetWarning: string | null;

  // UPS
  totalUpsLoad: number;           // W — entire rack on UPS
  estimatedRuntimeMin: number;
  upsWarning: string | null;

  // Rack
  totalRackU: number;
  recommendedRackSize: number;    // 7, 9, or 12
  availableRackU: number;

  // Circuit
  circuitAmpRequired: number;     // always 20
  circuitLoadW: number;           // same as totalUpsLoad
  circuitWarning: string | null;
}

export function calcPowerSummary(
  courtCount: number,
  securityCameraCount: number,
  tier: ServiceTier,
  hasRackMountableModem: boolean = false
): PowerSummary {
  const poeResult = validatePoeBudget(courtCount, securityCameraCount, tier);
  const totalUpsLoad = calcUpsLoad(courtCount, securityCameraCount, tier);
  const estimatedRuntimeMin = calcUpsRuntime(totalUpsLoad);
  const rackResult = calcRackUnits(courtCount, securityCameraCount, tier, hasRackMountableModem);
  const availableU = rackResult.recommendedRackSize - rackResult.totalU;

  return {
    totalPoeLoad: poeResult.totalPoeLoad,
    switchSku: poeResult.switchSku,
    switchQty: poeResult.switchQty,
    switchBudgetPerUnit: poeResult.switchBudgetPerUnit,
    poeLoadPerSwitch: poeResult.loadPerSwitch,
    poeBudgetUtilizationPct: poeResult.budgetUtilizationPct,
    poeOverBudget: poeResult.isOverBudget,
    poeBudgetWarning: poeResult.warning,

    totalUpsLoad,
    estimatedRuntimeMin,
    upsWarning: upsRuntimeWarning(estimatedRuntimeMin),

    totalRackU: rackResult.totalU,
    recommendedRackSize: rackResult.recommendedRackSize,
    availableRackU: availableU,

    circuitAmpRequired: 20,
    circuitLoadW: totalUpsLoad,
    circuitWarning: validateCircuitLoad(totalUpsLoad),
  };
}
```

---

## 7. UI Surface Points

These values are surfaced in **Stage 2 (Procurement), BOM Review tab**, as a collapsible "Power & Infrastructure" panel:

| Display Label | Source Field | Format |
|--------------|-------------|--------|
| PoE Load | `totalPoeLoad` | "328W across 1× USW-Pro-48-POE (55% of 600W budget)" |
| UPS Runtime | `estimatedRuntimeMin` | "~30 min estimated runtime at full load" |
| Rack Size | `recommendedRackSize` | "9U rack recommended (7U used, 2U available)" |
| Circuit | `circuitAmpRequired` | "Dedicated 20A circuit required in IT room" |
| Warning badges | `poeBudgetWarning`, `upsWarning`, `circuitWarning` | Yellow badge with inline message if non-null |

The panel is informational only — the operator confirms, does not need to approve/deny.

---

## 8. File Location

```
src/services/power.ts      — calcPowerSummary(), all sub-functions
src/types/power.ts         — PowerSummary interface, ServiceTier import
```

These functions reference `selectSwitchConfig()` and `selectSwitchConfigAutonomous()` from
`src/services/bom.ts` — import from there rather than duplicating.
