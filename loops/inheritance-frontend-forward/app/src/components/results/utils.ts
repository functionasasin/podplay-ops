/**
 * Results view utility functions.
 * Source: synthesis/results-view.md
 */

import type { SuccessionType, ScenarioCode } from '../../types';

export type ResultsLayout =
  | 'standard-distribution'
  | 'testate-with-dispositions'
  | 'mixed-succession'
  | 'preterition-override'
  | 'collateral-weighted'
  | 'escheat'
  | 'no-compulsory-full-fp';

/**
 * Determine the layout variant based on succession type and scenario code.
 */
export function getResultsLayout(
  successionType: SuccessionType,
  scenarioCode: ScenarioCode,
): ResultsLayout {
  // TODO: implement
  return 'standard-distribution';
}

/**
 * Render narrative text: **bold** → <strong>bold</strong>.
 * Only bold markers are used by the engine.
 */
export function renderNarrativeText(text: string): string {
  // TODO: implement
  return text;
}

/**
 * Strip Markdown bold markers from text for plain-text copy.
 */
export function stripMarkdownBold(text: string): string {
  // TODO: implement
  return text;
}

/**
 * Determine warning severity from category.
 */
export function getWarningSeverity(category: string): 'error' | 'warning' | 'info' {
  // TODO: implement
  return 'info';
}

/**
 * Badge color by succession type.
 */
export const SUCCESSION_TYPE_BADGE_COLOR: Record<SuccessionType, string> = {
  Testate: 'green',
  Intestate: 'blue',
  Mixed: 'amber',
  IntestateByPreterition: 'red',
};

/**
 * Category badge styles.
 */
export const CATEGORY_BADGE_STYLE: Record<string, { color: string; label: string }> = {
  LegitimateChildGroup: { color: 'blue', label: 'Legitimate Child' },
  IllegitimateChildGroup: { color: 'purple', label: 'Illegitimate Child' },
  SurvivingSpouseGroup: { color: 'green', label: 'Surviving Spouse' },
  LegitimateAscendantGroup: { color: 'orange', label: 'Legitimate Ascendant' },
  CollateralGroup: { color: 'gray', label: 'Collateral Relative' },
};
