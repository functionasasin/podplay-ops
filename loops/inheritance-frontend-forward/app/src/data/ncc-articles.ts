/**
 * NCC_ARTICLE_DESCRIPTIONS — Full New Civil Code + Family Code article map (spec §4.5).
 *
 * Used by StatuteCitationsSection to display full article descriptions
 * when an heir row is expanded to show the statutory basis for their share.
 */

export const NCC_ARTICLE_DESCRIPTIONS: Record<string, string> = {};

/**
 * Parse an article key from a legal_basis string.
 * E.g. "Art.887" → "Art.887", "Art. 887" → "Art.887"
 * Returns null if the string doesn't match an article pattern.
 */
export function parseArticleKey(_legalBasis: string): string | null {
  return null;
}

/**
 * Get the full article description for an article key.
 * Returns the description from NCC_ARTICLE_DESCRIPTIONS, or the raw key
 * if no matching description is found.
 */
export function getArticleDescription(_key: string): string {
  return _key;
}
