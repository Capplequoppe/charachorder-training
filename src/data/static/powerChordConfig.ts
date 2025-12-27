/**
 * Power chord configuration based on statistical frequency analysis.
 *
 * Power chords are 2-key combinations that are:
 * 1. Statistically frequent in English text
 * 2. Ergonomically comfortable to press
 * 3. Musically consonant when played together
 *
 * The frequency rank determines learning priority.
 */

import { PowerChordHand } from '../../domain';

/**
 * Configuration entry for a power chord.
 */
export interface PowerChordConfigEntry {
  /** Unique identifier (sorted characters) */
  id: string;
  /** The two characters that make up this power chord */
  chars: [string, string];
  /** Hand type: same hand or cross-hand */
  hand: PowerChordHand;
  /** Frequency rank (1 = most common) */
  frequencyRank: number;
  /** Normalized frequency weight (0-1) */
  frequencyWeight: number;
  /** Words that this power chord can produce or extend to */
  producesWords: string[];
}

/**
 * Power chord definitions from research analysis.
 * Organized by hand type for efficient querying.
 */
export const POWER_CHORD_CONFIG: PowerChordConfigEntry[] = [
  // ==================== RIGHT HAND POWER CHORDS ====================
  // Most common digraphs typed with right hand fingers

  {
    id: 'ht',
    chars: ['t', 'h'],
    hand: 'right',
    frequencyRank: 1,
    frequencyWeight: 1.0,
    producesWords: ['the', 'that', 'this', 'they', 'then', 'them', 'there', 'than', 'think', 'through'],
  },
  {
    id: 'st',
    chars: ['s', 't'],
    hand: 'right',
    frequencyRank: 2,
    frequencyWeight: 0.85,
    producesWords: ['still', 'start', 'stop', 'story', 'step', 'state', 'stand'],
  },
  {
    id: 'hs',
    chars: ['h', 's'],
    hand: 'right',
    frequencyRank: 3,
    frequencyWeight: 0.75,
    producesWords: ['she', 'should', 'show'],
  },
  {
    id: 'at',
    chars: ['a', 't'],
    hand: 'right',
    frequencyRank: 4,
    frequencyWeight: 0.70,
    producesWords: ['at', 'that', 'what'],
  },
  {
    id: 'dt',
    chars: ['d', 't'],
    hand: 'right',
    frequencyRank: 5,
    frequencyWeight: 0.65,
    producesWords: ["don't", "didn't", "doesn't"],
  },
  {
    id: 'an',
    chars: ['a', 'n'],
    hand: 'right',
    frequencyRank: 6,
    frequencyWeight: 0.60,
    producesWords: ['an', 'and', 'can', 'man', 'than'],
  },
  {
    id: 'as',
    chars: ['a', 's'],
    hand: 'right',
    frequencyRank: 7,
    frequencyWeight: 0.55,
    producesWords: ['as', 'was', 'has'],
  },
  {
    id: 'ad',
    chars: ['a', 'd'],
    hand: 'right',
    frequencyRank: 8,
    frequencyWeight: 0.50,
    producesWords: ['had', 'add', 'made'],
  },
  {
    id: 'ah',
    chars: ['a', 'h'],
    hand: 'right',
    frequencyRank: 9,
    frequencyWeight: 0.45,
    producesWords: ['have', 'had', 'what'],
  },
  {
    id: 'ns',
    chars: ['n', 's'],
    hand: 'right',
    frequencyRank: 10,
    frequencyWeight: 0.40,
    producesWords: ["isn't", "wasn't"],
  },

  // ==================== LEFT HAND POWER CHORDS ====================
  // Most common digraphs typed with left hand fingers

  {
    id: 'er',
    chars: ['e', 'r'],
    hand: 'left',
    frequencyRank: 1,
    frequencyWeight: 1.0,
    producesWords: ['her', 'were', 'very', 'over', 'ever', 'never', 'other'],
  },
  {
    id: 'or',
    chars: ['o', 'r'],
    hand: 'left',
    frequencyRank: 2,
    frequencyWeight: 0.85,
    producesWords: ['or', 'for', 'more', 'your', 'work', 'world'],
  },
  {
    id: 'eo',
    chars: ['e', 'o'],
    hand: 'left',
    frequencyRank: 3,
    frequencyWeight: 0.75,
    producesWords: ['people', 'one'],
  },
  {
    id: 'ou',
    chars: ['o', 'u'],
    hand: 'left',
    frequencyRank: 4,
    frequencyWeight: 0.70,
    producesWords: ['you', 'out', 'our', 'would', 'could', 'should', 'about'],
  },
  {
    id: 'ei',
    chars: ['e', 'i'],
    hand: 'left',
    frequencyRank: 5,
    frequencyWeight: 0.65,
    producesWords: ['their', 'being'],
  },
  {
    id: 'ir',
    chars: ['i', 'r'],
    hand: 'left',
    frequencyRank: 6,
    frequencyWeight: 0.60,
    producesWords: ['first', 'girl'],
  },
  {
    id: 'io',
    chars: ['i', 'o'],
    hand: 'left',
    frequencyRank: 7,
    frequencyWeight: 0.55,
    producesWords: ['into'],
  },
  {
    id: 'ru',
    chars: ['r', 'u'],
    hand: 'left',
    frequencyRank: 8,
    frequencyWeight: 0.50,
    producesWords: ['true', 'run'],
  },
  {
    id: 'ew',
    chars: ['e', 'w'],
    hand: 'left',
    frequencyRank: 9,
    frequencyWeight: 0.45,
    producesWords: ['new', 'few', 'knew'],
  },
  {
    id: 'iu',
    chars: ['i', 'u'],
    hand: 'left',
    frequencyRank: 10,
    frequencyWeight: 0.40,
    producesWords: ['just'],
  },

  // ==================== CROSS-HAND POWER CHORDS ====================
  // Common combinations requiring both hands

  {
    id: 'et',
    chars: ['e', 't'],
    hand: 'cross',
    frequencyRank: 1,
    frequencyWeight: 1.0,
    producesWords: ['get', 'let', 'set', 'yet', 'between'],
  },
  {
    id: 'in',
    chars: ['i', 'n'],
    hand: 'cross',
    frequencyRank: 2,
    frequencyWeight: 0.90,
    producesWords: ['in', 'into', 'thing', 'think'],
  },
  {
    id: 'en',
    chars: ['e', 'n'],
    hand: 'cross',
    frequencyRank: 3,
    frequencyWeight: 0.80,
    producesWords: ['when', 'then', 'been', 'even', 'men'],
  },
  {
    id: 'it',
    chars: ['i', 't'],
    hand: 'cross',
    frequencyRank: 4,
    frequencyWeight: 0.75,
    producesWords: ['it', 'with', 'its'],
  },
  {
    id: 'on',
    chars: ['o', 'n'],
    hand: 'cross',
    frequencyRank: 5,
    frequencyWeight: 0.70,
    producesWords: ['on', 'one', 'only', 'long', 'done'],
  },
  {
    id: 'es',
    chars: ['e', 's'],
    hand: 'cross',
    frequencyRank: 6,
    frequencyWeight: 0.65,
    producesWords: ['yes', 'eyes'],
  },
  {
    id: 'is',
    chars: ['i', 's'],
    hand: 'cross',
    frequencyRank: 7,
    frequencyWeight: 0.60,
    producesWords: ['is', 'his', 'this'],
  },
  {
    id: 'ot',
    chars: ['o', 't'],
    hand: 'cross',
    frequencyRank: 8,
    frequencyWeight: 0.55,
    producesWords: ['to', 'not', 'got', 'too'],
  },
  {
    id: 'os',
    chars: ['o', 's'],
    hand: 'cross',
    frequencyRank: 9,
    frequencyWeight: 0.50,
    producesWords: ['so', 'also', 'most'],
  },
  {
    id: 'el',
    chars: ['e', 'l'],
    hand: 'cross',
    frequencyRank: 10,
    frequencyWeight: 0.45,
    producesWords: ['well', 'tell', 'feel'],
  },
];

/**
 * Map from power chord ID to its configuration.
 */
export const POWER_CHORD_MAP: Map<string, PowerChordConfigEntry> = new Map(
  POWER_CHORD_CONFIG.map((entry) => [entry.id, entry])
);

/**
 * Gets power chords by hand type.
 */
export function getPowerChordsByHand(
  hand: PowerChordHand
): PowerChordConfigEntry[] {
  return POWER_CHORD_CONFIG.filter((entry) => entry.hand === hand);
}

/**
 * Gets power chords that contain a specific character.
 */
export function getPowerChordsWithChar(char: string): PowerChordConfigEntry[] {
  const lowerChar = char.toLowerCase();
  return POWER_CHORD_CONFIG.filter(
    (entry) =>
      entry.chars[0] === lowerChar || entry.chars[1] === lowerChar
  );
}

/**
 * Gets the top N power chords by frequency.
 */
export function getTopPowerChords(n: number): PowerChordConfigEntry[] {
  return [...POWER_CHORD_CONFIG]
    .sort((a, b) => {
      // Sort by hand first (right, left, cross), then by rank
      const handOrder = { right: 0, left: 1, cross: 2 };
      if (a.hand !== b.hand) {
        return handOrder[a.hand] - handOrder[b.hand];
      }
      return a.frequencyRank - b.frequencyRank;
    })
    .slice(0, n);
}
