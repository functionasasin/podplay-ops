import type { ServiceTier } from '@/lib/types';
import { selectSwitchConfig, selectSwitchConfigAutonomous } from '@/services/bom';

// UPS constants — APC Back-UPS Pro 1500VA / 900W
const UPS_BATTERY_WH = 280;
const UPS_EFFICIENCY = 0.85;

export interface PowerSummary {
  // PoE
  totalPoeLoad: number;
  switchSku: string;
  switchQty: number;
  switchBudgetPerUnit: number;
  poeLoadPerSwitch: number;
  poeBudgetUtilizationPct: number;
  poeOverBudget: boolean;
  poeBudgetWarning: string | null;

  // UPS
  totalUpsLoad: number;
  estimatedRuntimeMin: number;
  upsWarning: string | null;

  // Rack
  totalRackU: number;
  recommendedRackSize: number;
  availableRackU: number;

  // Circuit
  circuitAmpRequired: number;
  circuitLoadW: number;
  circuitWarning: string | null;
}

function calcTotalPoeLoad(
  courtCount: number,
  securityCameraCount: number,
  tier: ServiceTier,
): number {
  const courtPoe = courtCount * 40;
  const secCamPoe = securityCameraCount * 10;
  const kisiPoe = tier === 'autonomous' || tier === 'autonomous_plus' ? 8 : 0;
  return courtPoe + secCamPoe + kisiPoe;
}

function validatePoeBudget(
  courtCount: number,
  securityCameraCount: number,
  tier: ServiceTier,
) {
  const totalPoeLoad = calcTotalPoeLoad(courtCount, securityCameraCount, tier);
  const switchCfg =
    tier === 'autonomous' || tier === 'autonomous_plus'
      ? selectSwitchConfigAutonomous(courtCount, securityCameraCount)
      : selectSwitchConfig(courtCount);

  const budgetPerUnit = switchCfg.sku === 'NET-USW-PRO-24-POE' ? 400 : 600;
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

function calcUpsLoad(
  courtCount: number,
  securityCameraCount: number,
  tier: ServiceTier,
): number {
  const switchCfg =
    tier === 'autonomous' || tier === 'autonomous_plus'
      ? selectSwitchConfigAutonomous(courtCount, securityCameraCount)
      : selectSwitchConfig(courtCount);
  const switchSystemDraw = switchCfg.sku === 'NET-USW-PRO-24-POE' ? 26 : 35;
  const switchTotalSystemDraw = switchSystemDraw * switchCfg.qty;

  const totalPoeLoad = calcTotalPoeLoad(courtCount, securityCameraCount, tier);

  const macMini = 35;
  const udm = 33;
  const nvrDraw =
    tier === 'autonomous_plus' ? (securityCameraCount <= 4 ? 25 : 45) : 0;
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

function calcUpsRuntime(upsLoadW: number): number {
  return ((UPS_BATTERY_WH * UPS_EFFICIENCY) / upsLoadW) * 60;
}

function upsRuntimeWarning(runtimeMin: number): string | null {
  if (runtimeMin < 15) {
    return (
      `Estimated UPS runtime is ${Math.round(runtimeMin)} minutes. ` +
      `For larger installations, consider a higher-capacity UPS (2200VA/1300W). ` +
      `The standard UPS still provides surge protection and enables graceful shutdown.`
    );
  }
  if (runtimeMin < 30) {
    return (
      `Estimated UPS runtime is ${Math.round(runtimeMin)} minutes. ` +
      `Sufficient for brief outages; automated shutdown recommended for extended outages.`
    );
  }
  return null;
}

function calcRackUnits(
  courtCount: number,
  securityCameraCount: number,
  tier: ServiceTier,
  hasRackMountableModem: boolean = false,
): { totalU: number; recommendedRackSize: number } {
  const base = 2 + 1 + 1; // Mac Mini shelf + UDM + Patch Panel
  const upsU = 2;

  const switchCfg =
    tier === 'autonomous' || tier === 'autonomous_plus'
      ? selectSwitchConfigAutonomous(courtCount, securityCameraCount)
      : selectSwitchConfig(courtCount);
  const switchU = switchCfg.qty;

  const nvrU =
    tier === 'autonomous_plus' ? (securityCameraCount <= 4 ? 1 : 2) : 0;

  const modemU = hasRackMountableModem ? 1 : 0;

  const totalU = base + upsU + switchU + nvrU + modemU;

  const withSlack = totalU + 1;
  const recommendedRackSize = withSlack <= 7 ? 7 : withSlack <= 9 ? 9 : 12;

  return { totalU, recommendedRackSize };
}

function validateCircuitLoad(upsLoadW: number): string | null {
  if (upsLoadW > 1600) {
    return (
      `Total rack load (${upsLoadW}W) approaches the 20A circuit limit (1920W max at 80% NEC). ` +
      `Contact venue electrician to confirm circuit capacity before proceeding.`
    );
  }
  return null;
}

export function calcPowerSummary(
  courtCount: number,
  securityCameraCount: number,
  tier: ServiceTier,
  hasRackMountableModem: boolean = false,
): PowerSummary {
  const poeResult = validatePoeBudget(courtCount, securityCameraCount, tier);
  const totalUpsLoad = calcUpsLoad(courtCount, securityCameraCount, tier);
  const estimatedRuntimeMin = calcUpsRuntime(totalUpsLoad);
  const rackResult = calcRackUnits(
    courtCount,
    securityCameraCount,
    tier,
    hasRackMountableModem,
  );
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
