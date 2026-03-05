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
  if (scenarioCode === 'I15') return 'escheat';
  if (scenarioCode === 'T13') return 'no-compulsory-full-fp';
  if (successionType === 'IntestateByPreterition') return 'preterition-override';
  if (successionType === 'Mixed') return 'mixed-succession';
  if (['I12', 'I13', 'I14'].includes(scenarioCode)) return 'collateral-weighted';
  if (successionType === 'Testate') return 'testate-with-dispositions';
  return 'standard-distribution';
}

/**
 * Render narrative text: **bold** → <strong>bold</strong>.
 * Only bold markers are used by the engine.
 */
export function renderNarrativeText(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

/**
 * Strip Markdown bold markers from text for plain-text copy.
 */
export function stripMarkdownBold(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, '$1');
}

/**
 * Determine warning severity from category.
 */
export function getWarningSeverity(category: string): 'error' | 'warning' | 'info' {
  const severity: Record<string, 'error' | 'warning' | 'info'> = {
    preterition: 'error',
    max_restarts: 'error',
    inofficiousness: 'warning',
    disinheritance: 'warning',
    vacancy_unresolved: 'warning',
    unknown_donee: 'info',
  };
  return severity[category] ?? 'info';
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
 * Format ISO date string as "dd Mon YYYY" using string splitting (no new Date())
 * to avoid timezone issues. §4.13
 */
export function formatDateOfDeath(dod: string): string {
  const [year, month, day] = dod.split('-') as [string, string, string];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${parseInt(day)} ${months[parseInt(month) - 1]!} ${year}`;
}

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
