/**
 * Pre-composed Songs
 *
 * Hand-written songs designed to teach chord patterns while following
 * musically pleasing progressions in E minor pentatonic.
 */

import {
  SongConfig,
  createMeasure,
  MUSICAL_ROOTS,
} from '../static/songConfig';

// ==================== Helper Functions ====================

/**
 * Create a measure with musical root annotations.
 */
function createMusicalMeasure(
  words: (string | null)[],
  roots: (number | null)[]
): ReturnType<typeof createMeasure> {
  const measure = createMeasure(words);
  // Annotate with musical roots
  measure.beats.forEach((beat, i) => {
    if (beat.items[0] && roots[i] !== null) {
      beat.items[0].musicalRoot = roots[i] ?? undefined;
    }
  });
  return measure;
}

// ==================== "Time We Know" ====================

/**
 * "Time We Know" - The flagship CharaChorder mnemonic song.
 *
 * Lyrics follow E minor pentatonic chord progressions.
 * Single-letter words (I, a) act as melodic passing tones.
 *
 * Verse 1:
 *   "I know the time you see,
 *    we make the moment be.
 *    I see a way to know,
 *    and we are all we show."
 *
 * Chorus:
 *   "Be in the time you know,
 *    be in the light we show.
 *    A moment we can be,
 *    I see the way you see."
 */
export const TIME_WE_KNOW: SongConfig = {
  id: 'time-we-know',
  title: 'Time We Know',
  artist: 'CharaChorder Trainer',
  description:
    'A melodic song using E minor pentatonic word chords. Perfect for learning common words with musical memory.',
  difficulty: 'intermediate',
  bpm: 85,
  timeSignature: [4, 4],
  beatsPerMeasure: 4,
  key: 'Em',
  drumPattern: 'basic4_4',
  bassPattern: 'rootFifth',
  padEnabled: true,
  isPrecomposed: true,
  sections: [
    {
      name: 'verse',
      measures: [
        // Line 1: "I know the time you see"
        createMusicalMeasure(
          ['I', 'know', 'the', 'time'],
          [null, MUSICAL_ROOTS.A, MUSICAL_ROOTS.B, MUSICAL_ROOTS.A]
        ),
        createMusicalMeasure(
          ['you', 'see', null, null],
          [MUSICAL_ROOTS.D, MUSICAL_ROOTS.D, null, null]
        ),

        // Line 2: "we make the moment be"
        createMusicalMeasure(
          ['we', 'make', 'the', 'moment'],
          [MUSICAL_ROOTS.E, MUSICAL_ROOTS.A, MUSICAL_ROOTS.B, MUSICAL_ROOTS.A]
        ),
        createMusicalMeasure(
          ['be', null, null, null],
          [MUSICAL_ROOTS.E, null, null, null]
        ),

        // Line 3: "I see a way to know"
        createMusicalMeasure(
          ['I', 'see', 'a', 'way'],
          [null, MUSICAL_ROOTS.D, null, MUSICAL_ROOTS.E]
        ),
        createMusicalMeasure(
          ['to', 'know', null, null],
          [MUSICAL_ROOTS.B, MUSICAL_ROOTS.A, null, null]
        ),

        // Line 4: "and we are all we show"
        createMusicalMeasure(
          ['and', 'we', 'are', 'all'],
          [MUSICAL_ROOTS.G, MUSICAL_ROOTS.E, MUSICAL_ROOTS.B, MUSICAL_ROOTS.A]
        ),
        createMusicalMeasure(
          ['we', 'show', null, null],
          [MUSICAL_ROOTS.E, MUSICAL_ROOTS.D, null, null]
        ),
      ],
    },
    {
      name: 'chorus',
      repeatCount: 2,
      measures: [
        // Line 1: "Be in the time you know"
        createMusicalMeasure(
          ['be', 'in', 'the', 'time'],
          [MUSICAL_ROOTS.E, MUSICAL_ROOTS.G, MUSICAL_ROOTS.B, MUSICAL_ROOTS.A]
        ),
        createMusicalMeasure(
          ['you', 'know', null, null],
          [MUSICAL_ROOTS.D, MUSICAL_ROOTS.A, null, null]
        ),

        // Line 2: "be in the light we show"
        createMusicalMeasure(
          ['be', 'in', 'the', 'light'],
          [MUSICAL_ROOTS.E, MUSICAL_ROOTS.G, MUSICAL_ROOTS.B, MUSICAL_ROOTS.A]
        ),
        createMusicalMeasure(
          ['we', 'show', null, null],
          [MUSICAL_ROOTS.E, MUSICAL_ROOTS.D, null, null]
        ),

        // Line 3: "A moment we can be"
        createMusicalMeasure(
          ['a', 'moment', 'we', 'can'],
          [null, MUSICAL_ROOTS.A, MUSICAL_ROOTS.E, MUSICAL_ROOTS.A]
        ),
        createMusicalMeasure(
          ['be', null, null, null],
          [MUSICAL_ROOTS.E, null, null, null]
        ),

        // Line 4: "I see the way you see"
        createMusicalMeasure(
          ['I', 'see', 'the', 'way'],
          [null, MUSICAL_ROOTS.D, MUSICAL_ROOTS.B, MUSICAL_ROOTS.E]
        ),
        createMusicalMeasure(
          ['you', 'see', null, null],
          [MUSICAL_ROOTS.D, MUSICAL_ROOTS.D, null, null]
        ),
      ],
    },
  ],
};

// ==================== "We Are The One" ====================

/**
 * "We Are The One" - Short, powerful chorus-like song.
 *
 * Uses the most common chords for quick wins.
 * Strong E → B progression (tonic → dominant).
 */
export const WE_ARE_THE_ONE: SongConfig = {
  id: 'we-are-the-one',
  title: 'We Are The One',
  artist: 'CharaChorder Trainer',
  description: 'A short, powerful song using the most common chords. Great for beginners.',
  difficulty: 'beginner',
  bpm: 75,
  timeSignature: [4, 4],
  beatsPerMeasure: 4,
  key: 'Em',
  drumPattern: 'halftime',
  bassPattern: 'sustained',
  padEnabled: true,
  isPrecomposed: true,
  sections: [
    {
      name: 'chorus',
      repeatCount: 2,
      measures: [
        // "We and you"
        createMusicalMeasure(
          ['we', 'and', 'you', null],
          [MUSICAL_ROOTS.E, MUSICAL_ROOTS.G, MUSICAL_ROOTS.D, null]
        ),
        // "are the one"
        createMusicalMeasure(
          ['are', 'the', 'one', null],
          [MUSICAL_ROOTS.B, MUSICAL_ROOTS.B, MUSICAL_ROOTS.A, null]
        ),
        // "Be the time"
        createMusicalMeasure(
          ['be', 'the', 'time', null],
          [MUSICAL_ROOTS.E, MUSICAL_ROOTS.B, MUSICAL_ROOTS.A, null]
        ),
        // "you see"
        createMusicalMeasure(
          ['you', 'see', null, null],
          [MUSICAL_ROOTS.D, MUSICAL_ROOTS.D, null, null]
        ),
      ],
    },
  ],
};

// ==================== "In The Know" ====================

/**
 * "In The Know" - Practice common prepositions and articles.
 *
 * Focuses on short, high-frequency words.
 * Descending folk cadence: G → B → A
 */
export const IN_THE_KNOW: SongConfig = {
  id: 'in-the-know',
  title: 'In The Know',
  artist: 'CharaChorder Trainer',
  description: 'Practice common prepositions and articles with a descending folk progression.',
  difficulty: 'beginner',
  bpm: 70,
  timeSignature: [4, 4],
  beatsPerMeasure: 4,
  key: 'Em',
  drumPattern: 'minimal',
  bassPattern: 'rootNotes',
  padEnabled: true,
  isPrecomposed: true,
  sections: [
    {
      name: 'verse',
      repeatCount: 2,
      measures: [
        // "In the know"
        createMusicalMeasure(
          ['in', 'the', 'know', null],
          [MUSICAL_ROOTS.G, MUSICAL_ROOTS.B, MUSICAL_ROOTS.A, null]
        ),
        // "you and I"
        createMusicalMeasure(
          ['you', 'and', 'I', null],
          [MUSICAL_ROOTS.D, MUSICAL_ROOTS.G, null, null]
        ),
        // "we can be"
        createMusicalMeasure(
          ['we', 'can', 'be', null],
          [MUSICAL_ROOTS.E, MUSICAL_ROOTS.A, MUSICAL_ROOTS.E, null]
        ),
        // "in the time"
        createMusicalMeasure(
          ['in', 'the', 'time', null],
          [MUSICAL_ROOTS.G, MUSICAL_ROOTS.B, MUSICAL_ROOTS.A, null]
        ),
      ],
    },
  ],
};

// ==================== "Say What You See" ====================

/**
 * "Say What You See" - Practice question and observation words.
 *
 * Focuses on D root words (you, say, see) with resolution to E.
 */
export const SAY_WHAT_YOU_SEE: SongConfig = {
  id: 'say-what-you-see',
  title: 'Say What You See',
  artist: 'CharaChorder Trainer',
  description: 'Practice observation and communication words. D minor flavor resolving to E.',
  difficulty: 'intermediate',
  bpm: 90,
  timeSignature: [4, 4],
  beatsPerMeasure: 4,
  key: 'Em',
  drumPattern: 'syncopated',
  bassPattern: 'eighthNotes',
  padEnabled: true,
  isPrecomposed: true,
  sections: [
    {
      name: 'verse',
      measures: [
        // "Say what you see"
        createMusicalMeasure(
          ['say', 'what', 'you', 'see'],
          [MUSICAL_ROOTS.D, MUSICAL_ROOTS.E, MUSICAL_ROOTS.D, MUSICAL_ROOTS.D]
        ),
        // "is what we know"
        createMusicalMeasure(
          ['is', 'what', 'we', 'know'],
          [MUSICAL_ROOTS.D, MUSICAL_ROOTS.E, MUSICAL_ROOTS.E, MUSICAL_ROOTS.A]
        ),
        // "just say it"
        createMusicalMeasure(
          ['just', 'say', 'it', null],
          [MUSICAL_ROOTS.D, MUSICAL_ROOTS.D, MUSICAL_ROOTS.B, null]
        ),
        // "let it be"
        createMusicalMeasure(
          ['let', 'it', 'be', null],
          [MUSICAL_ROOTS.A, MUSICAL_ROOTS.B, MUSICAL_ROOTS.E, null]
        ),
      ],
    },
    {
      name: 'chorus',
      repeatCount: 2,
      measures: [
        // "You see it"
        createMusicalMeasure(
          ['you', 'see', 'it', null],
          [MUSICAL_ROOTS.D, MUSICAL_ROOTS.D, MUSICAL_ROOTS.B, null]
        ),
        // "I see it"
        createMusicalMeasure(
          ['I', 'see', 'it', null],
          [null, MUSICAL_ROOTS.D, MUSICAL_ROOTS.B, null]
        ),
        // "we all see"
        createMusicalMeasure(
          ['we', 'all', 'see', null],
          [MUSICAL_ROOTS.E, MUSICAL_ROOTS.A, MUSICAL_ROOTS.D, null]
        ),
        // "what can be"
        createMusicalMeasure(
          ['what', 'can', 'be', null],
          [MUSICAL_ROOTS.E, MUSICAL_ROOTS.A, MUSICAL_ROOTS.E, null]
        ),
      ],
    },
  ],
};

// ==================== "Time And Time" ====================

/**
 * "Time And Time" - Advanced song with faster tempo.
 *
 * Focuses on smooth transitions between all pentatonic roots.
 */
export const TIME_AND_TIME: SongConfig = {
  id: 'time-and-time',
  title: 'Time And Time',
  artist: 'CharaChorder Trainer',
  description: 'Advanced practice with faster tempo and complex progressions.',
  difficulty: 'advanced',
  bpm: 110,
  timeSignature: [4, 4],
  beatsPerMeasure: 4,
  key: 'Em',
  drumPattern: 'fourOnFloor',
  bassPattern: 'walking',
  padEnabled: true,
  isPrecomposed: true,
  sections: [
    {
      name: 'verse',
      measures: [
        // "Time and time"
        createMusicalMeasure(
          ['time', 'and', 'time', null],
          [MUSICAL_ROOTS.A, MUSICAL_ROOTS.G, MUSICAL_ROOTS.A, null]
        ),
        // "we make the way"
        createMusicalMeasure(
          ['we', 'make', 'the', 'way'],
          [MUSICAL_ROOTS.E, MUSICAL_ROOTS.A, MUSICAL_ROOTS.B, MUSICAL_ROOTS.E]
        ),
        // "you and I"
        createMusicalMeasure(
          ['you', 'and', 'I', 'know'],
          [MUSICAL_ROOTS.D, MUSICAL_ROOTS.G, null, MUSICAL_ROOTS.A]
        ),
        // "what to say"
        createMusicalMeasure(
          ['what', 'to', 'say', null],
          [MUSICAL_ROOTS.E, MUSICAL_ROOTS.B, MUSICAL_ROOTS.D, null]
        ),
      ],
    },
    {
      name: 'chorus',
      repeatCount: 2,
      measures: [
        createMusicalMeasure(
          ['be', 'in', 'the', 'time'],
          [MUSICAL_ROOTS.E, MUSICAL_ROOTS.G, MUSICAL_ROOTS.B, MUSICAL_ROOTS.A]
        ),
        createMusicalMeasure(
          ['we', 'can', 'be', 'all'],
          [MUSICAL_ROOTS.E, MUSICAL_ROOTS.A, MUSICAL_ROOTS.E, MUSICAL_ROOTS.A]
        ),
        createMusicalMeasure(
          ['that', 'you', 'see', null],
          [MUSICAL_ROOTS.G, MUSICAL_ROOTS.D, MUSICAL_ROOTS.D, null]
        ),
        createMusicalMeasure(
          ['it', 'is', 'me', null],
          [MUSICAL_ROOTS.B, MUSICAL_ROOTS.D, MUSICAL_ROOTS.A, null]
        ),
      ],
    },
    {
      name: 'bridge',
      measures: [
        createMusicalMeasure(
          ['know', 'what', 'you', 'know'],
          [MUSICAL_ROOTS.A, MUSICAL_ROOTS.E, MUSICAL_ROOTS.D, MUSICAL_ROOTS.A]
        ),
        createMusicalMeasure(
          ['see', 'what', 'you', 'see'],
          [MUSICAL_ROOTS.D, MUSICAL_ROOTS.E, MUSICAL_ROOTS.D, MUSICAL_ROOTS.D]
        ),
        createMusicalMeasure(
          ['be', 'what', 'you', 'be'],
          [MUSICAL_ROOTS.E, MUSICAL_ROOTS.E, MUSICAL_ROOTS.D, MUSICAL_ROOTS.E]
        ),
        createMusicalMeasure(
          ['we', 'are', 'free', null],
          [MUSICAL_ROOTS.E, MUSICAL_ROOTS.B, MUSICAL_ROOTS.A, null]
        ),
      ],
    },
  ],
};

// ==================== Song Registry ====================

export const PRECOMPOSED_SONGS: SongConfig[] = [
  TIME_WE_KNOW,
  WE_ARE_THE_ONE,
  IN_THE_KNOW,
  SAY_WHAT_YOU_SEE,
  TIME_AND_TIME,
];

/**
 * Get all pre-composed songs.
 */
export function getAllPrecomposedSongs(): SongConfig[] {
  return PRECOMPOSED_SONGS;
}

/**
 * Get songs by difficulty.
 */
export function getSongsByDifficulty(
  difficulty: 'beginner' | 'intermediate' | 'advanced'
): SongConfig[] {
  return PRECOMPOSED_SONGS.filter((song) => song.difficulty === difficulty);
}

/**
 * Get a song by ID.
 */
export function getSongById(id: string): SongConfig | undefined {
  return PRECOMPOSED_SONGS.find((song) => song.id === id);
}
