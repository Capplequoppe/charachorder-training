/**
 * Chord Extension Configuration
 *
 * Defines how 2-key power chords can be extended to form words
 * by adding one or more characters. This enables the "Lego model"
 * training approach where complex chords are built from simpler ones.
 */

import { SemanticCategory } from './semanticCategories';

/**
 * Represents an extension of a base power chord to form a word.
 */
export interface ChordExtension {
  /** Base power chord ID (e.g., 'ht' for T+H) */
  baseChordId: string;
  /** Character(s) added to form the word */
  addedChars: string[];
  /** The resulting word */
  resultWord: string;
  /** All characters in the final chord */
  resultChordChars: string[];
  /** Semantic category for grouping */
  category?: SemanticCategory;
}

/**
 * Chord extension definitions organized by base power chord.
 */
export const CHORD_EXTENSIONS: ChordExtension[] = [
  // ==================== TH (T+H) Extensions ====================
  // Most common digraph, produces many function words
  {
    baseChordId: 'ht',
    addedChars: ['e'],
    resultWord: 'the',
    resultChordChars: ['t', 'h', 'e'],
    category: 'determiner',
  },
  {
    baseChordId: 'ht',
    addedChars: ['a', 't'],
    resultWord: 'that',
    resultChordChars: ['t', 'h', 'a'],
    category: 'determiner',
  },
  {
    baseChordId: 'ht',
    addedChars: ['i', 's'],
    resultWord: 'this',
    resultChordChars: ['t', 'h', 'i', 's'],
    category: 'determiner',
  },
  {
    baseChordId: 'ht',
    addedChars: ['e', 'n'],
    resultWord: 'then',
    resultChordChars: ['t', 'h', 'e', 'n'],
    category: 'time',
  },
  {
    baseChordId: 'ht',
    addedChars: ['e', 'y'],
    resultWord: 'they',
    resultChordChars: ['t', 'h', 'e', 'y'],
    category: 'pronoun',
  },
  {
    baseChordId: 'ht',
    addedChars: ['e', 'm'],
    resultWord: 'them',
    resultChordChars: ['t', 'h', 'e', 'm'],
    category: 'pronoun',
  },
  {
    baseChordId: 'ht',
    addedChars: ['e', 'r'],
    resultWord: 'there',
    resultChordChars: ['t', 'h', 'e', 'r'],
    category: 'place',
  },
  {
    baseChordId: 'ht',
    addedChars: ['a', 'n'],
    resultWord: 'than',
    resultChordChars: ['t', 'h', 'a', 'n'],
    category: 'conjunction',
  },
  {
    baseChordId: 'ht',
    addedChars: ['e', 's'],
    resultWord: 'these',
    resultChordChars: ['t', 'h', 'e', 's'],
    category: 'determiner',
  },
  {
    baseChordId: 'ht',
    addedChars: ['o', 's', 'e'],
    resultWord: 'those',
    resultChordChars: ['t', 'h', 'o', 's', 'e'],
    category: 'determiner',
  },
  {
    baseChordId: 'ht',
    addedChars: ['i', 'n', 'k'],
    resultWord: 'think',
    resultChordChars: ['t', 'h', 'i', 'n', 'k'],
    category: 'action',
  },
  {
    baseChordId: 'ht',
    addedChars: ['i', 'n', 'g'],
    resultWord: 'thing',
    resultChordChars: ['t', 'h', 'i', 'n', 'g'],
    category: 'common',
  },

  // ==================== ER (E+R) Extensions ====================
  {
    baseChordId: 'er',
    addedChars: ['h'],
    resultWord: 'her',
    resultChordChars: ['h', 'e', 'r'],
    category: 'pronoun',
  },
  {
    baseChordId: 'er',
    addedChars: ['v', 'y'],
    resultWord: 'very',
    resultChordChars: ['v', 'e', 'r', 'y'],
    category: 'common',
  },
  {
    baseChordId: 'er',
    addedChars: ['w'],
    resultWord: 'were',
    resultChordChars: ['w', 'e', 'r'],
    category: 'action',
  },
  {
    baseChordId: 'er',
    addedChars: ['o', 'v'],
    resultWord: 'over',
    resultChordChars: ['o', 'v', 'e', 'r'],
    category: 'preposition',
  },
  {
    baseChordId: 'er',
    addedChars: ['v'],
    resultWord: 'ever',
    resultChordChars: ['e', 'v', 'e', 'r'],
    category: 'time',
  },
  {
    baseChordId: 'er',
    addedChars: ['n', 'v'],
    resultWord: 'never',
    resultChordChars: ['n', 'e', 'v', 'e', 'r'],
    category: 'negation',
  },
  {
    baseChordId: 'er',
    addedChars: ['o', 't', 'h'],
    resultWord: 'other',
    resultChordChars: ['o', 't', 'h', 'e', 'r'],
    category: 'common',
  },
  {
    baseChordId: 'er',
    addedChars: ['e', 'v', 'y'],
    resultWord: 'every',
    resultChordChars: ['e', 'v', 'e', 'r', 'y'],
    category: 'common',
  },

  // ==================== ST (S+T) Extensions ====================
  {
    baseChordId: 'st',
    addedChars: ['i', 'l'],
    resultWord: 'still',
    resultChordChars: ['s', 't', 'i', 'l'],
    category: 'time',
  },
  {
    baseChordId: 'st',
    addedChars: ['a', 'r'],
    resultWord: 'start',
    resultChordChars: ['s', 't', 'a', 'r'],
    category: 'action',
  },
  {
    baseChordId: 'st',
    addedChars: ['o', 'p'],
    resultWord: 'stop',
    resultChordChars: ['s', 't', 'o', 'p'],
    category: 'action',
  },
  {
    baseChordId: 'st',
    addedChars: ['o', 'r', 'y'],
    resultWord: 'story',
    resultChordChars: ['s', 't', 'o', 'r', 'y'],
    category: 'common',
  },
  {
    baseChordId: 'st',
    addedChars: ['e', 'p'],
    resultWord: 'step',
    resultChordChars: ['s', 't', 'e', 'p'],
    category: 'action',
  },
  {
    baseChordId: 'st',
    addedChars: ['a', 'e'],
    resultWord: 'state',
    resultChordChars: ['s', 't', 'a', 'e'],
    category: 'common',
  },
  {
    baseChordId: 'st',
    addedChars: ['a', 'n', 'd'],
    resultWord: 'stand',
    resultChordChars: ['s', 't', 'a', 'n', 'd'],
    category: 'action',
  },
  {
    baseChordId: 'st',
    addedChars: ['a', 'y'],
    resultWord: 'stay',
    resultChordChars: ['s', 't', 'a', 'y'],
    category: 'action',
  },

  // ==================== OU (O+U) Extensions ====================
  {
    baseChordId: 'ou',
    addedChars: ['y'],
    resultWord: 'you',
    resultChordChars: ['y', 'o', 'u'],
    category: 'pronoun',
  },
  {
    baseChordId: 'ou',
    addedChars: ['t'],
    resultWord: 'out',
    resultChordChars: ['o', 'u', 't'],
    category: 'place',
  },
  {
    baseChordId: 'ou',
    addedChars: ['r'],
    resultWord: 'our',
    resultChordChars: ['o', 'u', 'r'],
    category: 'pronoun',
  },
  {
    baseChordId: 'ou',
    addedChars: ['w', 'l', 'd'],
    resultWord: 'would',
    resultChordChars: ['w', 'o', 'u', 'l', 'd'],
    category: 'action',
  },
  {
    baseChordId: 'ou',
    addedChars: ['c', 'l', 'd'],
    resultWord: 'could',
    resultChordChars: ['c', 'o', 'u', 'l', 'd'],
    category: 'action',
  },
  {
    baseChordId: 'ou',
    addedChars: ['s', 'h', 'l', 'd'],
    resultWord: 'should',
    resultChordChars: ['s', 'h', 'o', 'u', 'l', 'd'],
    category: 'action',
  },
  {
    baseChordId: 'ou',
    addedChars: ['a', 'b', 't'],
    resultWord: 'about',
    resultChordChars: ['a', 'b', 'o', 'u', 't'],
    category: 'preposition',
  },

  // ==================== AN (A+N) Extensions ====================
  {
    baseChordId: 'an',
    addedChars: ['d'],
    resultWord: 'and',
    resultChordChars: ['a', 'n', 'd'],
    category: 'conjunction',
  },
  {
    baseChordId: 'an',
    addedChars: ['c'],
    resultWord: 'can',
    resultChordChars: ['c', 'a', 'n'],
    category: 'action',
  },
  {
    baseChordId: 'an',
    addedChars: ['m'],
    resultWord: 'man',
    resultChordChars: ['m', 'a', 'n'],
    category: 'common',
  },
  {
    baseChordId: 'an',
    addedChars: ['y'],
    resultWord: 'any',
    resultChordChars: ['a', 'n', 'y'],
    category: 'common',
  },

  // ==================== IN (I+N) Extensions ====================
  {
    baseChordId: 'in',
    addedChars: ['t', 'o'],
    resultWord: 'into',
    resultChordChars: ['i', 'n', 't', 'o'],
    category: 'preposition',
  },

  // ==================== EN (E+N) Extensions ====================
  {
    baseChordId: 'en',
    addedChars: ['w', 'h'],
    resultWord: 'when',
    resultChordChars: ['w', 'h', 'e', 'n'],
    category: 'question',
  },
  {
    baseChordId: 'en',
    addedChars: ['b'],
    resultWord: 'been',
    resultChordChars: ['b', 'e', 'e', 'n'],
    category: 'action',
  },
  {
    baseChordId: 'en',
    addedChars: ['v'],
    resultWord: 'even',
    resultChordChars: ['e', 'v', 'e', 'n'],
    category: 'common',
  },

  // ==================== IT (I+T) Extensions ====================
  {
    baseChordId: 'it',
    addedChars: ['w', 'h'],
    resultWord: 'with',
    resultChordChars: ['w', 'i', 't', 'h'],
    category: 'preposition',
  },

  // ==================== ON (O+N) Extensions ====================
  {
    baseChordId: 'on',
    addedChars: ['e'],
    resultWord: 'one',
    resultChordChars: ['o', 'n', 'e'],
    category: 'common',
  },
  {
    baseChordId: 'on',
    addedChars: ['l', 'y'],
    resultWord: 'only',
    resultChordChars: ['o', 'n', 'l', 'y'],
    category: 'common',
  },
  {
    baseChordId: 'on',
    addedChars: ['l', 'g'],
    resultWord: 'long',
    resultChordChars: ['l', 'o', 'n', 'g'],
    category: 'common',
  },
  {
    baseChordId: 'on',
    addedChars: ['d', 'e'],
    resultWord: 'done',
    resultChordChars: ['d', 'o', 'n', 'e'],
    category: 'action',
  },

  // ==================== OR (O+R) Extensions ====================
  {
    baseChordId: 'or',
    addedChars: ['f'],
    resultWord: 'for',
    resultChordChars: ['f', 'o', 'r'],
    category: 'preposition',
  },
  {
    baseChordId: 'or',
    addedChars: ['m', 'e'],
    resultWord: 'more',
    resultChordChars: ['m', 'o', 'r', 'e'],
    category: 'common',
  },
  {
    baseChordId: 'or',
    addedChars: ['y', 'u'],
    resultWord: 'your',
    resultChordChars: ['y', 'o', 'u', 'r'],
    category: 'pronoun',
  },
  {
    baseChordId: 'or',
    addedChars: ['w', 'k'],
    resultWord: 'work',
    resultChordChars: ['w', 'o', 'r', 'k'],
    category: 'action',
  },
  {
    baseChordId: 'or',
    addedChars: ['w', 'l', 'd'],
    resultWord: 'world',
    resultChordChars: ['w', 'o', 'r', 'l', 'd'],
    category: 'place',
  },

  // ==================== AS (A+S) Extensions ====================
  {
    baseChordId: 'as',
    addedChars: ['w'],
    resultWord: 'was',
    resultChordChars: ['w', 'a', 's'],
    category: 'action',
  },
  {
    baseChordId: 'as',
    addedChars: ['h'],
    resultWord: 'has',
    resultChordChars: ['h', 'a', 's'],
    category: 'action',
  },

  // ==================== AT (A+T) Extensions ====================
  {
    baseChordId: 'at',
    addedChars: ['w', 'h'],
    resultWord: 'what',
    resultChordChars: ['w', 'h', 'a', 't'],
    category: 'question',
  },

  // ==================== IS (I+S) Extensions ====================
  {
    baseChordId: 'is',
    addedChars: ['h'],
    resultWord: 'his',
    resultChordChars: ['h', 'i', 's'],
    category: 'pronoun',
  },

  // ==================== OT (O+T) Extensions ====================
  {
    baseChordId: 'ot',
    addedChars: ['n'],
    resultWord: 'not',
    resultChordChars: ['n', 'o', 't'],
    category: 'negation',
  },
  {
    baseChordId: 'ot',
    addedChars: ['g'],
    resultWord: 'got',
    resultChordChars: ['g', 'o', 't'],
    category: 'action',
  },

  // ==================== OS (O+S) Extensions ====================
  {
    baseChordId: 'os',
    addedChars: ['m', 't'],
    resultWord: 'most',
    resultChordChars: ['m', 'o', 's', 't'],
    category: 'common',
  },
  {
    baseChordId: 'os',
    addedChars: ['a', 'l'],
    resultWord: 'also',
    resultChordChars: ['a', 'l', 's', 'o'],
    category: 'common',
  },

  // ==================== EL (E+L) Extensions ====================
  {
    baseChordId: 'el',
    addedChars: ['w'],
    resultWord: 'well',
    resultChordChars: ['w', 'e', 'l'],
    category: 'common',
  },
  {
    baseChordId: 'el',
    addedChars: ['t'],
    resultWord: 'tell',
    resultChordChars: ['t', 'e', 'l'],
    category: 'action',
  },
  {
    baseChordId: 'el',
    addedChars: ['f'],
    resultWord: 'feel',
    resultChordChars: ['f', 'e', 'e', 'l'],
    category: 'action',
  },

  // ==================== HS (H+S) Extensions ====================
  {
    baseChordId: 'hs',
    addedChars: ['e'],
    resultWord: 'she',
    resultChordChars: ['s', 'h', 'e'],
    category: 'pronoun',
  },
  {
    baseChordId: 'hs',
    addedChars: ['o', 'w'],
    resultWord: 'show',
    resultChordChars: ['s', 'h', 'o', 'w'],
    category: 'action',
  },

  // ==================== AD (A+D) Extensions ====================
  {
    baseChordId: 'ad',
    addedChars: ['h'],
    resultWord: 'had',
    resultChordChars: ['h', 'a', 'd'],
    category: 'action',
  },
  {
    baseChordId: 'ad',
    addedChars: ['m', 'e'],
    resultWord: 'made',
    resultChordChars: ['m', 'a', 'd', 'e'],
    category: 'action',
  },

  // ==================== AH (A+H) Extensions ====================
  {
    baseChordId: 'ah',
    addedChars: ['v', 'e'],
    resultWord: 'have',
    resultChordChars: ['h', 'a', 'v', 'e'],
    category: 'action',
  },

  // ==================== ET (E+T) Extensions ====================
  {
    baseChordId: 'et',
    addedChars: ['g'],
    resultWord: 'get',
    resultChordChars: ['g', 'e', 't'],
    category: 'action',
  },
  {
    baseChordId: 'et',
    addedChars: ['l'],
    resultWord: 'let',
    resultChordChars: ['l', 'e', 't'],
    category: 'action',
  },
  {
    baseChordId: 'et',
    addedChars: ['s'],
    resultWord: 'set',
    resultChordChars: ['s', 'e', 't'],
    category: 'action',
  },
  {
    baseChordId: 'et',
    addedChars: ['y'],
    resultWord: 'yet',
    resultChordChars: ['y', 'e', 't'],
    category: 'time',
  },

  // ==================== ES (E+S) Extensions ====================
  {
    baseChordId: 'es',
    addedChars: ['y'],
    resultWord: 'yes',
    resultChordChars: ['y', 'e', 's'],
    category: 'common',
  },
];

/**
 * Map from base chord ID to its extensions.
 */
export const EXTENSIONS_BY_BASE: Map<string, ChordExtension[]> = new Map();

// Build the map
CHORD_EXTENSIONS.forEach((ext) => {
  const existing = EXTENSIONS_BY_BASE.get(ext.baseChordId) || [];
  existing.push(ext);
  EXTENSIONS_BY_BASE.set(ext.baseChordId, existing);
});

/**
 * Map from result word to its extension.
 */
export const EXTENSION_BY_WORD: Map<string, ChordExtension> = new Map(
  CHORD_EXTENSIONS.map((ext) => [ext.resultWord, ext])
);

/**
 * Gets extensions for a base power chord.
 */
export function getExtensionsForBase(baseChordId: string): ChordExtension[] {
  return EXTENSIONS_BY_BASE.get(baseChordId) || [];
}

/**
 * Gets an extension by its result word.
 */
export function getExtensionByWord(word: string): ChordExtension | undefined {
  return EXTENSION_BY_WORD.get(word.toLowerCase());
}

/**
 * Gets extensions by semantic category.
 */
export function getExtensionsByCategory(
  category: SemanticCategory
): ChordExtension[] {
  return CHORD_EXTENSIONS.filter((ext) => ext.category === category);
}

/**
 * Gets all unique base chord IDs that have extensions.
 */
export function getBaseChordIdsWithExtensions(): string[] {
  return Array.from(EXTENSIONS_BY_BASE.keys());
}

/**
 * Gets total count of extensions.
 */
export function getExtensionCount(): number {
  return CHORD_EXTENSIONS.length;
}
