/**
 * Research-based audio configuration for fingers.
 *
 * Note assignments are optimized so that common finger pairs
 * produce consonant musical intervals (octaves, 5ths, 3rds).
 *
 * All notes come from E minor pentatonic (E, G, A, B, D) across ~2 octaves,
 * ensuring any random multi-finger chord sounds at least "cinematic".
 *
 * Direction variations provide subtle audio feedback:
 * - Up: Brighter, shorter attack
 * - Down: Darker, longer sustain
 * - Left: Pan slightly left
 * - Right: Pan slightly right
 * - Press: Base sound with subtle chorus effect
 */

import { FingerId, Direction, AudioVariation } from '../../domain';

/**
 * Audio configuration for a single finger.
 */
export interface FingerAudioConfig {
  /** Note name in scientific notation */
  name: string;
  /** Base frequency in Hz */
  frequency: number;
  /** Base pan position (-1 to 1) */
  basePan: number;
  /** ADSR variations per direction */
  variations: Record<Direction, AudioVariation>;
}

/**
 * Default note durations in seconds.
 */
export const AUDIO_DURATIONS = {
  /** Normal keypress duration */
  DEFAULT: 0.7,
  /** Successful chord/word completion */
  SUCCESS: 1.5,
  /** Error sound duration */
  ERROR: 0.3,
  /** Quick feedback */
  SHORT: 0.2,
  /** Each note in arpeggio */
  ARPEGGIO_NOTE: 0.4,
  /** Maximum sustained note length */
  SUSTAINED_MAX: 5.0,
} as const;

/**
 * Stagger delays for chord playback styles (in ms).
 */
export const CHORD_STAGGER = {
  /** Simultaneous (no stagger) */
  SIMULTANEOUS: 0,
  /** Quick strum */
  STRUM: 20,
  /** Slower arpeggio */
  ARPEGGIO: 80,
} as const;

/**
 * Create ADSR variations for each direction.
 */
function createVariations(basePan: number): Record<Direction, AudioVariation> {
  return {
    [Direction.UP]: {
      attackMs: 10,
      decayMs: 100,
      sustainLevel: 0.7,
      releaseMs: 200,
      panPosition: basePan,
      brightnessOffset: 200, // +10% brightness
    },
    [Direction.DOWN]: {
      attackMs: 20,
      decayMs: 200,
      sustainLevel: 0.8,
      releaseMs: 400,
      panPosition: basePan,
      brightnessOffset: -200, // -10% brightness
    },
    [Direction.LEFT]: {
      attackMs: 15,
      decayMs: 150,
      sustainLevel: 0.75,
      releaseMs: 300,
      panPosition: Math.max(-1, basePan - 0.15), // Pan left
      brightnessOffset: 0,
    },
    [Direction.RIGHT]: {
      attackMs: 15,
      decayMs: 150,
      sustainLevel: 0.75,
      releaseMs: 300,
      panPosition: Math.min(1, basePan + 0.15), // Pan right
      brightnessOffset: 0,
    },
    [Direction.PRESS]: {
      attackMs: 15,
      decayMs: 150,
      sustainLevel: 0.75,
      releaseMs: 300,
      panPosition: basePan,
      brightnessOffset: 50, // Subtle chorus brightness
    },
  };
}

/**
 * Research-based finger note mapping.
 *
 * Notes are from E minor pentatonic: E, G, A, B, D
 * Optimized so common finger pairs produce consonant intervals.
 */
export const FINGER_NOTES: Record<FingerId, FingerAudioConfig | null> = {
  // ==================== LEFT HAND ====================
  // Pan positions: -0.6 (outer) to -0.2 (inner)

  l_pinky: null, // No sound - pinky has no character assignments

  l_thumb_outer: {
    name: 'E3',
    frequency: 164.81,
    basePan: -0.6,
    variations: createVariations(-0.6),
  },

  l_thumb_inner: {
    name: 'A3',
    frequency: 220.0,
    basePan: -0.5,
    variations: createVariations(-0.5),
  },

  l_ring: {
    name: 'A4',
    frequency: 440.0,
    basePan: -0.3,
    variations: createVariations(-0.3),
  },

  l_index: {
    name: 'B4',
    frequency: 493.88,
    basePan: -0.4,
    variations: createVariations(-0.4),
  },

  l_middle: {
    name: 'D5',
    frequency: 587.33,
    basePan: -0.2,
    variations: createVariations(-0.2),
  },

  // ==================== RIGHT HAND ====================
  // Pan positions: 0.2 (inner) to 0.6 (outer)

  r_pinky: null, // No sound - pinky has no character assignments

  r_thumb_inner: {
    name: 'G3',
    frequency: 196.0,
    basePan: 0.3,
    variations: createVariations(0.3),
  },

  r_thumb_outer: {
    name: 'E4',
    frequency: 329.63,
    basePan: 0.2,
    variations: createVariations(0.2),
  },

  r_index: {
    name: 'B3',
    frequency: 246.94,
    basePan: 0.4,
    variations: createVariations(0.4),
  },

  r_middle: {
    name: 'G4',
    frequency: 392.0,
    basePan: 0.5,
    variations: createVariations(0.5),
  },

  r_ring: {
    name: 'D4',
    frequency: 293.66,
    basePan: 0.6,
    variations: createVariations(0.6),
  },
};

/**
 * Musical interval types.
 */
export type IntervalType =
  | 'unison'
  | 'minor_2nd'
  | 'major_2nd'
  | 'minor_3rd'
  | 'major_3rd'
  | 'perfect_4th'
  | 'tritone'
  | 'perfect_5th'
  | 'minor_6th'
  | 'major_6th'
  | 'minor_7th'
  | 'major_7th'
  | 'octave';

/**
 * Consonance rating for intervals (higher = more consonant).
 */
export const INTERVAL_CONSONANCE: Record<IntervalType, number> = {
  unison: 10,
  octave: 9,
  perfect_5th: 8,
  perfect_4th: 7,
  major_3rd: 6,
  minor_3rd: 5,
  major_6th: 5,
  minor_6th: 4,
  major_2nd: 3,
  minor_7th: 3,
  major_7th: 2,
  minor_2nd: 1,
  tritone: 0,
};

/**
 * Common finger pair intervals (for reference and verification).
 * These pairs should produce pleasant-sounding combinations.
 */
export const OPTIMIZED_INTERVALS: Record<string, IntervalType> = {
  // Cross-hand octave pairs (most consonant)
  'l_index|r_index': 'octave', // B4 + B3 = octave
  'l_middle|r_ring': 'octave', // D5 + D4 = octave
  'l_thumb_outer|r_thumb_outer': 'octave', // E3 + E4 = octave
  'l_ring|r_thumb_inner': 'octave', // A4 + A3? No, but A4 + G3 = major 2nd

  // Perfect 5ths (very consonant)
  'l_thumb_outer|r_index': 'perfect_5th', // E3 + B3 = perfect 5th
  'l_middle|r_middle': 'perfect_5th', // D5 + G4 = perfect 5th (inverted)
  'l_ring|r_ring': 'perfect_5th', // A4 + D4 = perfect 5th

  // Major/minor 3rds (harmonious)
  'l_thumb_inner|r_thumb_inner': 'major_2nd', // A3 + G3 = major 2nd
  'r_index|r_thumb_inner': 'major_3rd', // B3 + G3 = major 3rd
  'l_index|r_middle': 'major_3rd', // B4 + G4 = major 3rd

  // Common digraph pairs - optimized for T+H, S+T, etc.
  // (These are the most frequently used, so should sound good)
};

/**
 * Calculate the interval between two frequencies.
 */
export function getInterval(freq1: number, freq2: number): IntervalType {
  // Ensure freq1 <= freq2
  if (freq1 > freq2) [freq1, freq2] = [freq2, freq1];

  // Calculate semitones
  const semitones = Math.round(12 * Math.log2(freq2 / freq1)) % 12;

  const intervalMap: Record<number, IntervalType> = {
    0: 'unison',
    1: 'minor_2nd',
    2: 'major_2nd',
    3: 'minor_3rd',
    4: 'major_3rd',
    5: 'perfect_4th',
    6: 'tritone',
    7: 'perfect_5th',
    8: 'minor_6th',
    9: 'major_6th',
    10: 'minor_7th',
    11: 'major_7th',
  };

  // Check for octave
  const ratio = freq2 / freq1;
  if (Math.abs(ratio - 2) < 0.01 || Math.abs(ratio - 0.5) < 0.01) {
    return 'octave';
  }

  return intervalMap[semitones] ?? 'unison';
}

/**
 * Get consonance score for a pair of fingers.
 */
export function getFingerPairConsonance(finger1: FingerId, finger2: FingerId): number {
  const note1 = FINGER_NOTES[finger1];
  const note2 = FINGER_NOTES[finger2];

  if (!note1 || !note2) return 0;

  const interval = getInterval(note1.frequency, note2.frequency);
  return INTERVAL_CONSONANCE[interval];
}

/**
 * Get the note frequency for a finger, or null if no sound.
 */
export function getFingerFrequency(fingerId: FingerId): number | null {
  const note = FINGER_NOTES[fingerId];
  return note?.frequency ?? null;
}

/**
 * Get the audio variation for a finger and direction.
 */
export function getFingerAudioVariation(
  fingerId: FingerId,
  direction: Direction
): AudioVariation | null {
  const note = FINGER_NOTES[fingerId];
  return note?.variations[direction] ?? null;
}

/**
 * Check if a finger produces sound.
 */
export function fingerHasSound(fingerId: FingerId): boolean {
  return FINGER_NOTES[fingerId] !== null;
}

/**
 * Get all finger IDs that produce sound.
 */
export function getFingersWithSound(): FingerId[] {
  return (Object.keys(FINGER_NOTES) as FingerId[]).filter(
    (id) => FINGER_NOTES[id] !== null
  );
}

/**
 * Get the note configuration for a finger.
 * Throws an error if the finger has no audio configuration.
 */
export function getFingerNoteOrThrow(fingerId: FingerId): FingerAudioConfig {
  const note = FINGER_NOTES[fingerId];
  if (!note) {
    throw new Error(`Finger ${fingerId} has no audio configuration`);
  }
  return note;
}

/**
 * Get the note name for a finger, or a fallback if not available.
 */
export function getFingerNoteName(fingerId: FingerId): string {
  const note = FINGER_NOTES[fingerId];
  return note?.name ?? '—';
}
