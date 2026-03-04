import { describe, it, expect } from 'vitest';
import {
  NCC_ARTICLE_DESCRIPTIONS,
  parseArticleKey,
  getArticleDescription,
} from '../ncc-articles';

// --------------------------------------------------------------------------
// Tests — NCC_ARTICLE_DESCRIPTIONS map
// --------------------------------------------------------------------------

describe('ncc-article > NCC_ARTICLE_DESCRIPTIONS map', () => {
  it('has at least 60 entries', () => {
    expect(Object.keys(NCC_ARTICLE_DESCRIPTIONS).length).toBeGreaterThanOrEqual(60);
  });

  it('includes core compulsory heir articles', () => {
    expect(NCC_ARTICLE_DESCRIPTIONS['Art.887']).toContain('Compulsory heirs');
    expect(NCC_ARTICLE_DESCRIPTIONS['Art.888']).toContain('Legitimate children');
    expect(NCC_ARTICLE_DESCRIPTIONS['Art.892']).toContain('Surviving spouse');
    expect(NCC_ARTICLE_DESCRIPTIONS['Art.895']).toContain('Illegitimate children');
  });

  it('includes representation articles', () => {
    expect(NCC_ARTICLE_DESCRIPTIONS['Art.970']).toContain('representation');
    expect(NCC_ARTICLE_DESCRIPTIONS['Art.971']).toBeDefined();
    expect(NCC_ARTICLE_DESCRIPTIONS['Art.972']).toContain('collateral');
  });

  it('includes intestate succession articles', () => {
    expect(NCC_ARTICLE_DESCRIPTIONS['Art.960']).toBeDefined();
    expect(NCC_ARTICLE_DESCRIPTIONS['Art.962']).toBeDefined();
    expect(NCC_ARTICLE_DESCRIPTIONS['Art.980']).toContain('Children of the deceased');
    expect(NCC_ARTICLE_DESCRIPTIONS['Art.985']).toContain('ascending');
    expect(NCC_ARTICLE_DESCRIPTIONS['Art.988']).toContain('Surviving spouse');
    expect(NCC_ARTICLE_DESCRIPTIONS['Art.996']).toBeDefined();
    expect(NCC_ARTICLE_DESCRIPTIONS['Art.1001']).toBeDefined();
    expect(NCC_ARTICLE_DESCRIPTIONS['Art.1011']).toContain('Escheat');
  });

  it('includes disinheritance articles', () => {
    expect(NCC_ARTICLE_DESCRIPTIONS['Art.916']).toContain('Disinheritance');
    expect(NCC_ARTICLE_DESCRIPTIONS['Art.917']).toContain('legal cause');
    expect(NCC_ARTICLE_DESCRIPTIONS['Art.919']).toContain('child');
    expect(NCC_ARTICLE_DESCRIPTIONS['Art.923']).toContain('disinherited');
  });

  it('includes collation articles', () => {
    expect(NCC_ARTICLE_DESCRIPTIONS['Art.1061']).toContain('Collation');
    expect(NCC_ARTICLE_DESCRIPTIONS['Art.1062']).toContain('exempt');
    expect(NCC_ARTICLE_DESCRIPTIONS['Art.1067']).toContain('support');
  });

  it('includes general succession articles', () => {
    expect(NCC_ARTICLE_DESCRIPTIONS['Art.774']).toContain('Inheritance defined');
    expect(NCC_ARTICLE_DESCRIPTIONS['Art.777']).toContain('moment of the decedent');
    expect(NCC_ARTICLE_DESCRIPTIONS['Art.854']).toContain('Preterition');
  });

  it('includes Family Code articles', () => {
    expect(NCC_ARTICLE_DESCRIPTIONS['FC172']).toBeDefined();
    expect(NCC_ARTICLE_DESCRIPTIONS['FC176']).toContain('Illegitimate children');
  });

  it('includes collateral sibling articles', () => {
    expect(NCC_ARTICLE_DESCRIPTIONS['Art.1006']).toContain('Full');
    expect(NCC_ARTICLE_DESCRIPTIONS['Art.1007']).toContain('Half blood');
    expect(NCC_ARTICLE_DESCRIPTIONS['Art.1004']).toContain('Collateral');
  });

  it('includes legitime provision articles', () => {
    expect(NCC_ARTICLE_DESCRIPTIONS['Art.886']).toContain('Legitime');
    expect(NCC_ARTICLE_DESCRIPTIONS['Art.889']).toBeDefined();
    expect(NCC_ARTICLE_DESCRIPTIONS['Art.890']).toBeDefined();
    expect(NCC_ARTICLE_DESCRIPTIONS['Art.893']).toBeDefined();
    expect(NCC_ARTICLE_DESCRIPTIONS['Art.900']).toContain('Surviving spouse alone');
    expect(NCC_ARTICLE_DESCRIPTIONS['Art.901']).toContain('Illegitimate children alone');
  });

  it('includes accretion articles', () => {
    expect(NCC_ARTICLE_DESCRIPTIONS['Art.1016']).toContain('Accretion');
    expect(NCC_ARTICLE_DESCRIPTIONS['Art.1021']).toContain('legitime');
  });

  it('includes Iron Curtain Rule article', () => {
    expect(NCC_ARTICLE_DESCRIPTIONS['Art.992']).toContain('Iron Curtain');
  });
});

// --------------------------------------------------------------------------
// Tests — parseArticleKey
// --------------------------------------------------------------------------

describe('ncc-article > parseArticleKey', () => {
  it('parses "Art.887" to "Art.887"', () => {
    expect(parseArticleKey('Art.887')).toBe('Art.887');
  });

  it('parses "Art. 887" (with space) to "Art.887"', () => {
    expect(parseArticleKey('Art. 887')).toBe('Art.887');
  });

  it('parses "Art.1011" to "Art.1011"', () => {
    expect(parseArticleKey('Art.1011')).toBe('Art.1011');
  });

  it('parses "FC172" to "FC172"', () => {
    expect(parseArticleKey('FC172')).toBe('FC172');
  });

  it('parses "FC Art.179" to "FC Art.179"', () => {
    expect(parseArticleKey('FC Art.179')).toBe('FC Art.179');
  });

  it('returns null for empty string', () => {
    expect(parseArticleKey('')).toBeNull();
  });

  it('returns null for non-article string', () => {
    expect(parseArticleKey('random text')).toBeNull();
  });
});

// --------------------------------------------------------------------------
// Tests — getArticleDescription
// --------------------------------------------------------------------------

describe('ncc-article > getArticleDescription', () => {
  it('returns correct description for Art.887', () => {
    const desc = getArticleDescription('Art.887');
    expect(desc).toContain('Compulsory heirs');
  });

  it('returns correct description for Art.970', () => {
    const desc = getArticleDescription('Art.970');
    expect(desc).toContain('representation');
  });

  it('returns correct description for Art.854', () => {
    const desc = getArticleDescription('Art.854');
    expect(desc).toContain('Preterition');
  });

  it('returns correct description for Art.1011', () => {
    const desc = getArticleDescription('Art.1011');
    expect(desc).toContain('Escheat');
  });

  it('returns raw key for unknown article', () => {
    const desc = getArticleDescription('Art.9999');
    expect(desc).toBe('Art.9999');
  });

  it('returns raw key for non-article string', () => {
    const desc = getArticleDescription('SomeUnknown');
    expect(desc).toBe('SomeUnknown');
  });
});
