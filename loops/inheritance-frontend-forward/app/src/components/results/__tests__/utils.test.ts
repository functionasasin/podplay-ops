import { describe, it, expect } from 'vitest';
import {
  getResultsLayout,
  renderNarrativeText,
  stripMarkdownBold,
  getWarningSeverity,
  SUCCESSION_TYPE_BADGE_COLOR,
  CATEGORY_BADGE_STYLE,
} from '../utils';
import type { SuccessionType, ScenarioCode } from '../../../types';

// --------------------------------------------------------------------------
// Tests — results utilities
// --------------------------------------------------------------------------

describe('results > getResultsLayout', () => {
  it('returns "escheat" for I15', () => {
    expect(getResultsLayout('Intestate', 'I15')).toBe('escheat');
  });

  it('returns "no-compulsory-full-fp" for T13', () => {
    expect(getResultsLayout('Testate', 'T13')).toBe('no-compulsory-full-fp');
  });

  it('returns "preterition-override" for IntestateByPreterition', () => {
    expect(getResultsLayout('IntestateByPreterition', 'T3')).toBe('preterition-override');
  });

  it('returns "mixed-succession" for Mixed succession type', () => {
    expect(getResultsLayout('Mixed', 'T3')).toBe('mixed-succession');
  });

  it('returns "collateral-weighted" for I12', () => {
    expect(getResultsLayout('Intestate', 'I12')).toBe('collateral-weighted');
  });

  it('returns "collateral-weighted" for I13', () => {
    expect(getResultsLayout('Intestate', 'I13')).toBe('collateral-weighted');
  });

  it('returns "collateral-weighted" for I14', () => {
    expect(getResultsLayout('Intestate', 'I14')).toBe('collateral-weighted');
  });

  it('returns "testate-with-dispositions" for T1', () => {
    expect(getResultsLayout('Testate', 'T1')).toBe('testate-with-dispositions');
  });

  it('returns "testate-with-dispositions" for T12', () => {
    expect(getResultsLayout('Testate', 'T12')).toBe('testate-with-dispositions');
  });

  it('returns "standard-distribution" for I1 intestate', () => {
    expect(getResultsLayout('Intestate', 'I1')).toBe('standard-distribution');
  });

  it('returns "standard-distribution" for I4 intestate', () => {
    expect(getResultsLayout('Intestate', 'I4')).toBe('standard-distribution');
  });

  it('I15 escheat takes precedence over Intestate type', () => {
    // scenarioCode check comes before successionType
    expect(getResultsLayout('Intestate', 'I15')).toBe('escheat');
  });

  it('T13 takes precedence over Testate type', () => {
    expect(getResultsLayout('Testate', 'T13')).toBe('no-compulsory-full-fp');
  });
});

describe('results > renderNarrativeText', () => {
  it('converts **bold** to <strong>bold</strong>', () => {
    expect(renderNarrativeText('**Maria Cruz** receives **₱500,000**')).toBe(
      '<strong>Maria Cruz</strong> receives <strong>₱500,000</strong>',
    );
  });

  it('handles text with no bold markers', () => {
    expect(renderNarrativeText('plain text')).toBe('plain text');
  });

  it('handles multiple bold segments in one line', () => {
    const input = '**A** and **B** and **C**';
    const expected = '<strong>A</strong> and <strong>B</strong> and <strong>C</strong>';
    expect(renderNarrativeText(input)).toBe(expected);
  });

  it('handles empty string', () => {
    expect(renderNarrativeText('')).toBe('');
  });
});

describe('results > stripMarkdownBold', () => {
  it('removes ** markers from text', () => {
    expect(stripMarkdownBold('**Maria Cruz** receives **₱500,000**')).toBe(
      'Maria Cruz receives ₱500,000',
    );
  });

  it('returns plain text unchanged', () => {
    expect(stripMarkdownBold('no bold here')).toBe('no bold here');
  });
});

describe('results > getWarningSeverity', () => {
  it('returns "error" for preterition', () => {
    expect(getWarningSeverity('preterition')).toBe('error');
  });

  it('returns "error" for max_restarts', () => {
    expect(getWarningSeverity('max_restarts')).toBe('error');
  });

  it('returns "warning" for inofficiousness', () => {
    expect(getWarningSeverity('inofficiousness')).toBe('warning');
  });

  it('returns "warning" for disinheritance', () => {
    expect(getWarningSeverity('disinheritance')).toBe('warning');
  });

  it('returns "warning" for vacancy_unresolved', () => {
    expect(getWarningSeverity('vacancy_unresolved')).toBe('warning');
  });

  it('returns "info" for unknown_donee', () => {
    expect(getWarningSeverity('unknown_donee')).toBe('info');
  });

  it('returns "info" for unknown category (default)', () => {
    expect(getWarningSeverity('some_unknown_category')).toBe('info');
  });
});

describe('results > SUCCESSION_TYPE_BADGE_COLOR', () => {
  it('maps Testate to green', () => {
    expect(SUCCESSION_TYPE_BADGE_COLOR.Testate).toBe('green');
  });

  it('maps Intestate to blue', () => {
    expect(SUCCESSION_TYPE_BADGE_COLOR.Intestate).toBe('blue');
  });

  it('maps Mixed to amber', () => {
    expect(SUCCESSION_TYPE_BADGE_COLOR.Mixed).toBe('amber');
  });

  it('maps IntestateByPreterition to red', () => {
    expect(SUCCESSION_TYPE_BADGE_COLOR.IntestateByPreterition).toBe('red');
  });
});

describe('results > CATEGORY_BADGE_STYLE', () => {
  it('LegitimateChildGroup has blue color', () => {
    expect(CATEGORY_BADGE_STYLE.LegitimateChildGroup.color).toBe('blue');
    expect(CATEGORY_BADGE_STYLE.LegitimateChildGroup.label).toBe('Legitimate Child');
  });

  it('IllegitimateChildGroup has purple color', () => {
    expect(CATEGORY_BADGE_STYLE.IllegitimateChildGroup.color).toBe('purple');
  });

  it('SurvivingSpouseGroup has green color', () => {
    expect(CATEGORY_BADGE_STYLE.SurvivingSpouseGroup.color).toBe('green');
  });

  it('LegitimateAscendantGroup has orange color', () => {
    expect(CATEGORY_BADGE_STYLE.LegitimateAscendantGroup.color).toBe('orange');
  });

  it('CollateralGroup has gray color', () => {
    expect(CATEGORY_BADGE_STYLE.CollateralGroup.color).toBe('gray');
  });
});
