/**
 * Song Configuration Types
 *
 * Defines the data structures for rhythm-based song gameplay.
 * Songs consist of sections (verse, chorus, bridge) containing measures,
 * which contain beats with words to type.
 */

// ==================== Timing Types ====================

export type TimingAccuracy = 'perfect' | 'good' | 'early' | 'late' | 'miss';

export interface TimingResult {
  accuracy: TimingAccuracy;
  offsetMs: number; // Positive = late, negative = early
  beatPosition: number;
}

export interface TimingConfig {
  perfectWindowMs: number; // ±50ms typically
  goodWindowMs: number; // ±150ms typically
  acceptWindowMs: number; // ±300ms - still counts but early/late
}

export const DEFAULT_TIMING_CONFIG: TimingConfig = {
  perfectWindowMs: 50,
  goodWindowMs: 150,
  acceptWindowMs: 300,
};

// ==================== Beat & Measure Types ====================

export interface BeatItem {
  word: string; // The word to type (empty string for rest)
  subdivision: number; // 0 = on beat, 0.5 = off-beat (eighth note)
  duration: number; // Duration in beats
  musicalRoot?: number; // 0=E, 3=G, 5=A, 7=B, 10=D
  isRest: boolean;
  isTyped?: boolean; // For single-letter "typed" words (I, a)
}

export interface Beat {
  position: number; // Beat number within measure (1-4 for 4/4)
  items: BeatItem[]; // Items on this beat (usually 1)
}

export interface Measure {
  beats: Beat[];
}

// ==================== Song Structure Types ====================

export type SectionName = 'intro' | 'verse' | 'chorus' | 'bridge' | 'outro';

export interface SongSection {
  name: SectionName;
  measures: Measure[];
  repeatCount?: number; // How many times to repeat this section
}

export type SongDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface SongConfig {
  id: string;
  title: string;
  artist?: string;
  description: string;
  difficulty: SongDifficulty;

  // Tempo and timing
  bpm: number; // Beats per minute (60-120 for typing)
  timeSignature: [number, number]; // e.g., [4, 4] for 4/4 time
  beatsPerMeasure: number; // Typically 4

  // Musical key (E minor pentatonic is native to finger notes)
  key: 'E' | 'Em';

  // Song structure
  sections: SongSection[];

  // Audio settings
  drumPattern: string; // ID from drumPatterns.ts
  bassPattern: string; // ID from bassPatterns.ts
  padEnabled: boolean;

  // Timing thresholds (can override defaults)
  timing?: Partial<TimingConfig>;

  // Metadata
  isPrecomposed: boolean;
  totalBeats?: number; // Calculated
  estimatedDurationSec?: number; // Calculated
}

// ==================== Song Results ====================

export interface SongResults {
  songId: string;
  songTitle: string;
  difficulty: SongDifficulty;

  // Accuracy counts
  perfectCount: number;
  goodCount: number;
  earlyCount: number;
  lateCount: number;
  missCount: number;
  totalWords: number;

  // Calculated stats
  accuracy: number; // 0-1
  score: number;
  maxCombo: number;
  averageOffsetMs: number;

  // Time
  totalTimeMs: number;
  completedAt: Date;
}

// ==================== BPM Ranges by Difficulty ====================

export const BPM_RANGES: Record<SongDifficulty, { min: number; max: number }> = {
  beginner: { min: 60, max: 80 },
  intermediate: { min: 80, max: 100 },
  advanced: { min: 100, max: 120 },
};

// ==================== Musical Root Mapping ====================

/**
 * Maps words to their musical root in E minor pentatonic.
 * Root values are semitones from E:
 *   0 = E (tonic)
 *   3 = G (minor 3rd)
 *   5 = A (perfect 4th)
 *   7 = B (perfect 5th)
 *   10 = D (minor 7th)
 */
export const MUSICAL_ROOTS = {
  E: 0,
  G: 3,
  A: 5,
  B: 7,
  D: 10,
} as const;

export type MusicalRoot = (typeof MUSICAL_ROOTS)[keyof typeof MUSICAL_ROOTS];

/**
 * High-frequency words grouped by their dominant musical root.
 * Based on the finger note assignments forming E minor pentatonic.
 */
export const WORDS_BY_ROOT: Record<number, string[]> = {
  [MUSICAL_ROOTS.E]: ['be', 'we', 'were', 'was', 'what', 'went', 'well', 'way', 'when', 'where'],
  [MUSICAL_ROOTS.G]: ['and', 'of', 'in', 'have', 'had', 'that', 'than', 'then', 'there', 'them'],
  [MUSICAL_ROOTS.A]: ['my', 'can', 'know', 'me', 'make', 'time', 'may', 'more', 'made', 'man'],
  [MUSICAL_ROOTS.B]: ['the', 'an', 'are', 'to', 'it', 'this', 'at', 'its', 'into', 'also'],
  [MUSICAL_ROOTS.D]: ['is', 'you', 'say', 'just', 'see', 'so', 'some', 'such', 'said', 'your'],
};

/**
 * Single-letter words that act as melodic passing tones.
 * These are typed (not chorded) and provide rhythmic variety.
 */
export const TYPED_WORDS = ['I', 'a'];

// ==================== Chord Progressions ====================

/**
 * Common chord progressions in E minor pentatonic.
 * Values are musical roots (semitones from E).
 */
export const PROGRESSIONS = {
  simple: [0, 5, 7, 0], // i-iv-v-i
  verse: [0, 3, 5, 7, 5, 3, 0, 0], // Longer melodic phrase
  chorus: [0, 7, 5, 0], // Punchy, memorable
  bridge: [3, 5, 7, 10, 7, 5, 3, 0], // More harmonic movement
  ascending: [0, 3, 5, 7, 10], // Rising tension
  descending: [10, 7, 5, 3, 0], // Falling resolution
} as const;

export type ProgressionName = keyof typeof PROGRESSIONS;

// ==================== Utility Functions ====================

/**
 * Calculate total beats in a song.
 */
export function calculateTotalBeats(config: SongConfig): number {
  let total = 0;
  for (const section of config.sections) {
    const repeatCount = section.repeatCount ?? 1;
    const sectionBeats = section.measures.length * config.beatsPerMeasure;
    total += sectionBeats * repeatCount;
  }
  return total;
}

/**
 * Calculate estimated duration in seconds.
 */
export function calculateDuration(config: SongConfig): number {
  const totalBeats = calculateTotalBeats(config);
  return (totalBeats / config.bpm) * 60;
}

/**
 * Get timing config with defaults.
 */
export function getTimingConfig(config: SongConfig): TimingConfig {
  return {
    ...DEFAULT_TIMING_CONFIG,
    ...config.timing,
  };
}

/**
 * Create a beat item for a word.
 */
export function createBeatItem(
  word: string,
  musicalRoot?: number,
  isTyped = false
): BeatItem {
  const isRest = word === '' || word === null;
  return {
    word: isRest ? '' : word,
    subdivision: 0,
    duration: 1,
    musicalRoot,
    isRest,
    isTyped: isTyped || TYPED_WORDS.includes(word),
  };
}

/**
 * Create a measure from an array of words.
 */
export function createMeasure(
  words: (string | null)[],
  beatsPerMeasure = 4
): Measure {
  const beats: Beat[] = [];

  for (let i = 0; i < beatsPerMeasure; i++) {
    const word = words[i] ?? null;
    beats.push({
      position: i + 1,
      items: [createBeatItem(word ?? '')],
    });
  }

  return { beats };
}

/**
 * Flatten a song into a sequence of beat items for playback.
 */
export function flattenSong(config: SongConfig): BeatItem[] {
  const items: BeatItem[] = [];

  for (const section of config.sections) {
    const repeatCount = section.repeatCount ?? 1;

    for (let r = 0; r < repeatCount; r++) {
      for (const measure of section.measures) {
        for (const beat of measure.beats) {
          for (const item of beat.items) {
            items.push(item);
          }
        }
      }
    }
  }

  return items;
}
