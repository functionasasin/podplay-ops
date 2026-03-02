/**
 * NCC_ARTICLE_DESCRIPTIONS — Full New Civil Code + Family Code article map (spec §4.5).
 *
 * Used by StatuteCitationsSection to display full article descriptions
 * when an heir row is expanded to show the statutory basis for their share.
 */

export const NCC_ARTICLE_DESCRIPTIONS: Record<string, string> = {
  // Compulsory heirs
  "Art.887": "Compulsory heirs in the direct descending line (Art. 887 NCC)",
  "Art.888": "Legitimate children's legitime = 1/2 of estate shared equally among all",
  "Art.889": "Legitimate parents' or ascendants' legitime = 1/2 of estate",
  "Art.890": "Ascendants' legitime when illegitimate children also survive = 1/4 of estate",
  "Art.892": "Surviving spouse's legitime concurring with legitimate children",
  "Art.893": "Surviving spouse's legitime concurring with legitimate ascendants = 1/4",
  "Art.894": "Surviving spouse's legitime concurring with illegitimate children = 1/3 each",
  "Art.895": "Illegitimate children's legitime = 1/2 of each legitimate child's share",
  "Art.896": "When no legitimate children: illegitimate children's legitime = 1/4 of estate",
  "Art.899": "LC + IC + SS combined: LC=1/2, SS=1/4, IC splits remaining",
  "Art.900": "Surviving spouse alone: legitime = 1/2 of estate",
  "Art.901": "Illegitimate children alone: collective legitime = 1/2 of estate",
  "Art.903": "Parents of illegitimate decedent: their legitime = 1/2 of estate",
  "Art.908": "Gross estate for legitime = net estate plus collatable donations from heirs",
  "Art.911": "Order of reduction: voluntary institutions, then non-preferred, then preferred",

  // Representation
  "Art.970": "Right of representation (Art. 970 NCC)",
  "Art.971": "Representatives shall inherit in the manner prescribed for representation (Art. 971 NCC)",
  "Art.972": "Right of representation in the collateral line (Art. 972 NCC)",
  "Art.974": "Representation in collateral line: only to nephews/nieces",
  "Art.975": "Children of a repudiating heir may represent the parent",
  "Art.977": "Heirs who repudiate cannot be represented",

  // Intestate succession
  "Art.960": "Intestate succession opens: no will, void will, or heir repudiates",
  "Art.962": "Order: children → parents → siblings → other relatives → state",
  "Art.966": "Degree of relationship: each generation = one degree",
  "Art.980": "Children of the deceased shall always inherit from him (Art. 980 NCC)",
  "Art.981": "Grandchildren and descendants shall inherit by right of representation (Art. 981 NCC)",
  "Art.982": "Grandchildren represent predeceased legitimate children",
  "Art.985": "In the absence of legitimate children, ascending line inherits (Art. 985 NCC)",
  "Art.987": "Relatives of same degree inherit in equal shares",
  "Art.988": "Surviving spouse in intestate succession (Art. 988 NCC)",
  "Art.991": "Illegitimate children may be represented by their descendants",
  "Art.992": "Iron Curtain Rule — illegitimate child cannot inherit ab intestato from legitimate relatives",
  "Art.995": "Surviving spouse with legitimate children: spouse takes one LC share",
  "Art.996": "Surviving spouse with legitimate children (Art. 996 NCC)",
  "Art.997": "Surviving spouse with legitimate ascendants: each takes 1/2 of estate",
  "Art.998": "Surviving spouse with illegitimate children: spouse = 1/3, IC collectively = 1/3",
  "Art.1000": "Illegitimate children with legitimate ascendants: 1/2 each",
  "Art.1001": "Surviving spouse with legitimate parents (Art. 1001 NCC)",
  "Art.1002": "Guilty spouse in legal separation not entitled to intestate share",
  "Art.1004": "Collateral relatives of same degree inherit in equal shares",
  "Art.1005": "Brothers and sisters may be represented by nephews and nieces",
  "Art.1006": "Full and half-blood siblings (Art. 1006 NCC)",
  "Art.1007": "Half blood siblings take 1/2 of full blood sibling share",
  "Art.1008": "Nephews and nieces by representation take only what parent would have taken",
  "Art.1009": "No other collateral relative: estate goes to surviving spouse",
  "Art.1010": "No surviving spouse or collateral: estate escheats to municipal/city government",
  "Art.1011": "Escheat to the State (Art. 1011 NCC)",

  // Disinheritance
  "Art.916": "Disinheritance can only be made through a valid will",
  "Art.917": "Disinheritance must state a legal cause expressly in the will",
  "Art.918": "Invalid disinheritance treated as if not made — heir reinstated",
  "Art.919": "Grounds for disinheriting a child or descendant (8 enumerated causes)",
  "Art.920": "Grounds for disinheriting a parent or ascendant (8 enumerated causes)",
  "Art.921": "Grounds for disinheriting a spouse (6 enumerated causes)",
  "Art.923": "Children of disinherited heir may represent parent in the legitime",

  // Collation
  "Art.1061": "Collation of donations inter vivos (Art. 1061 NCC)",
  "Art.1062": "Collation not required if donor expressly exempts the donation",
  "Art.1067": "Exempt from collation: support, education, medical, emergency, customary gifts",
  "Art.1071": "Collation is made at value of donation at time of gift",

  // General succession
  "Art.774": "Inheritance defined — transmission of decedent's property, rights, and obligations",
  "Art.776": "Inheritance includes all property, rights, and obligations not extinguished by death",
  "Art.777": "Rights to succession transmitted from the moment of the decedent's death",
  "Art.782": "Legatee/devisee — one receiving a specific legacy or devise by will",
  "Art.838": "No will shall pass property without being probated",
  "Art.840": "Institution of heir — act giving a person part of the estate by will",
  "Art.854": "Preterition — omission of a compulsory heir in the direct line annuls institution of heirs",

  // Legitime provisions
  "Art.886": "Legitime — portion reserved by law that testator cannot freely dispose of",

  // Unworthiness / incapacity
  "Art.1032": "Grounds for incapacity/unworthiness (Art. 1032 NCC)",
  "Art.1041": "Renunciation of inheritance (Art. 1041 NCC)",

  // Accretion
  "Art.1016": "Accretion — vacant portion accretes to co-heirs in same proportion",
  "Art.1021": "Vacant legitime accretes to co-compulsory heirs in own right",

  // Family Code
  "FC172": "Filiation of legitimate children — established by birth certificate or final judgment",
  "FC176": "Illegitimate children entitled to support and legitime; use surname of mother",
  "FC Art.179": "Family Code Art. 179 — property regime provisions applicable to succession",
};

/**
 * Parse an article key from a legal_basis string.
 * E.g. "Art.887" → "Art.887", "Art. 887" → "Art.887"
 * Handles FC-prefixed articles like "FC172" and "FC Art.179".
 * Returns null if the string doesn't match an article pattern.
 */
export function parseArticleKey(legalBasis: string): string | null {
  if (!legalBasis) return null;

  // Match "FC Art.NNN" or "FC Art. NNN"
  const fcArtMatch = legalBasis.match(/^FC\s*Art\.\s*(\d+)$/);
  if (fcArtMatch) {
    return `FC Art.${fcArtMatch[1]}`;
  }

  // Match "FCNNN"
  const fcMatch = legalBasis.match(/^FC\s*(\d+)$/);
  if (fcMatch) {
    return `FC${fcMatch[1]}`;
  }

  // Match "Art.NNN" or "Art. NNN"
  const artMatch = legalBasis.match(/^Art\.\s*(\d+)$/);
  if (artMatch) {
    return `Art.${artMatch[1]}`;
  }

  return null;
}

/**
 * Get the full article description for an article key.
 * Returns the description from NCC_ARTICLE_DESCRIPTIONS, or the raw key
 * if no matching description is found.
 */
export function getArticleDescription(key: string): string {
  return NCC_ARTICLE_DESCRIPTIONS[key] ?? key;
}
