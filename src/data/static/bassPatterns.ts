/**
 * Bass Pattern Definitions
 *
 * Defines bass line patterns for background music in song mode.
 * Bass follows E minor pentatonic and can dynamically change root
 * based on the typed word's musical root.
 */

// ==================== Types ====================

export interface BassNote {
  beat: number; // Beat position within measure (1-4)
  subdivision: number; // 0 = on beat, 0.5 = eighth note, etc.
  rootOffset: number; // Semitones from current root (0, 3, 5, 7, 10 for pentatonic)
  octave: number; // -1, 0, 1 relative to base octave
  duration: number; // Duration in beats
  velocity: number; // 0-1 volume
}

export interface BassPattern {
  id: string;
  name: string;
  description: string;
  notes: BassNote[];
  measuresPerLoop: number;
  followsChordRoot: boolean; // If true, root changes with typed word
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

// ==================== Base Frequency ====================

/**
 * E2 is the base frequency for bass notes.
 * This is the root of our E minor pentatonic system.
 */
export const BASS_BASE_FREQUENCY = 82.41; // E2 in Hz

/**
 * E minor pentatonic intervals in semitones from root.
 */
export const PENTATONIC_INTERVALS = [0, 3, 5, 7, 10] as const;

// ==================== Pattern Definitions ====================

/**
 * Root notes only - plays root on beat 1 and 3.
 * Simple foundation, good for beginners.
 */
const rootNotes: BassPattern = {
  id: 'rootNotes',
  name: 'Root Notes',
  description: 'Simple root notes on beats 1 and 3',
  measuresPerLoop: 1,
  followsChordRoot: true,
  difficulty: 'beginner',
  notes: [
    { beat: 1, subdivision: 0, rootOffset: 0, octave: 0, duration: 1.5, velocity: 1.0 },
    { beat: 3, subdivision: 0, rootOffset: 0, octave: 0, duration: 1.5, velocity: 0.9 },
  ],
};

/**
 * Root with fifth - classic rock/pop bass line.
 */
const rootFifth: BassPattern = {
  id: 'rootFifth',
  name: 'Root & Fifth',
  description: 'Root note with fifth interval',
  measuresPerLoop: 1,
  followsChordRoot: true,
  difficulty: 'beginner',
  notes: [
    { beat: 1, subdivision: 0, rootOffset: 0, octave: 0, duration: 1, velocity: 1.0 },
    { beat: 2, subdivision: 0, rootOffset: 7, octave: 0, duration: 1, velocity: 0.8 },
    { beat: 3, subdivision: 0, rootOffset: 0, octave: 0, duration: 1, velocity: 0.9 },
    { beat: 4, subdivision: 0, rootOffset: 7, octave: 0, duration: 1, velocity: 0.8 },
  ],
};

/**
 * Eighth note groove - steady pulse.
 */
const eighthNotes: BassPattern = {
  id: 'eighthNotes',
  name: 'Eighth Notes',
  description: 'Steady eighth-note pulse on the root',
  measuresPerLoop: 1,
  followsChordRoot: true,
  difficulty: 'intermediate',
  notes: [
    { beat: 1, subdivision: 0, rootOffset: 0, octave: 0, duration: 0.5, velocity: 1.0 },
    { beat: 1, subdivision: 0.5, rootOffset: 0, octave: 0, duration: 0.5, velocity: 0.7 },
    { beat: 2, subdivision: 0, rootOffset: 0, octave: 0, duration: 0.5, velocity: 0.8 },
    { beat: 2, subdivision: 0.5, rootOffset: 0, octave: 0, duration: 0.5, velocity: 0.7 },
    { beat: 3, subdivision: 0, rootOffset: 0, octave: 0, duration: 0.5, velocity: 0.9 },
    { beat: 3, subdivision: 0.5, rootOffset: 0, octave: 0, duration: 0.5, velocity: 0.7 },
    { beat: 4, subdivision: 0, rootOffset: 0, octave: 0, duration: 0.5, velocity: 0.8 },
    { beat: 4, subdivision: 0.5, rootOffset: 0, octave: 0, duration: 0.5, velocity: 0.7 },
  ],
};

/**
 * Walking bass - moves through pentatonic scale.
 */
const walking: BassPattern = {
  id: 'walking',
  name: 'Walking Bass',
  description: 'Walks through the pentatonic scale',
  measuresPerLoop: 2,
  followsChordRoot: true,
  difficulty: 'intermediate',
  notes: [
    // Measure 1
    { beat: 1, subdivision: 0, rootOffset: 0, octave: 0, duration: 1, velocity: 1.0 },
    { beat: 2, subdivision: 0, rootOffset: 3, octave: 0, duration: 1, velocity: 0.85 },
    { beat: 3, subdivision: 0, rootOffset: 5, octave: 0, duration: 1, velocity: 0.9 },
    { beat: 4, subdivision: 0, rootOffset: 7, octave: 0, duration: 1, velocity: 0.85 },
    // Measure 2
    { beat: 5, subdivision: 0, rootOffset: 10, octave: 0, duration: 1, velocity: 0.9 },
    { beat: 6, subdivision: 0, rootOffset: 7, octave: 0, duration: 1, velocity: 0.85 },
    { beat: 7, subdivision: 0, rootOffset: 5, octave: 0, duration: 1, velocity: 0.9 },
    { beat: 8, subdivision: 0, rootOffset: 3, octave: 0, duration: 1, velocity: 0.85 },
  ],
};

/**
 * Syncopated groove - accents off-beats.
 */
const syncopated: BassPattern = {
  id: 'syncopatedBass',
  name: 'Syncopated',
  description: 'Groovy syncopated bass line',
  measuresPerLoop: 1,
  followsChordRoot: true,
  difficulty: 'intermediate',
  notes: [
    { beat: 1, subdivision: 0, rootOffset: 0, octave: 0, duration: 0.5, velocity: 1.0 },
    { beat: 1, subdivision: 0.5, rootOffset: 0, octave: 0, duration: 0.25, velocity: 0.6 },
    { beat: 2, subdivision: 0.5, rootOffset: 0, octave: 0, duration: 0.5, velocity: 0.8 }, // Syncopation
    { beat: 3, subdivision: 0, rootOffset: 5, octave: 0, duration: 0.5, velocity: 0.9 },
    { beat: 3, subdivision: 0.5, rootOffset: 7, octave: 0, duration: 0.25, velocity: 0.7 },
    { beat: 4, subdivision: 0, rootOffset: 0, octave: 0, duration: 1, velocity: 0.85 },
  ],
};

/**
 * Octave jump - bounces between low and high octave.
 */
const octaveJump: BassPattern = {
  id: 'octaveJump',
  name: 'Octave Jump',
  description: 'Bounces between low and high octave',
  measuresPerLoop: 1,
  followsChordRoot: true,
  difficulty: 'advanced',
  notes: [
    { beat: 1, subdivision: 0, rootOffset: 0, octave: 0, duration: 0.5, velocity: 1.0 },
    { beat: 1, subdivision: 0.5, rootOffset: 0, octave: 1, duration: 0.5, velocity: 0.8 },
    { beat: 2, subdivision: 0, rootOffset: 0, octave: 0, duration: 0.5, velocity: 0.9 },
    { beat: 2, subdivision: 0.5, rootOffset: 0, octave: 1, duration: 0.5, velocity: 0.7 },
    { beat: 3, subdivision: 0, rootOffset: 0, octave: 0, duration: 0.5, velocity: 0.9 },
    { beat: 3, subdivision: 0.5, rootOffset: 0, octave: 1, duration: 0.5, velocity: 0.8 },
    { beat: 4, subdivision: 0, rootOffset: 0, octave: 0, duration: 0.5, velocity: 0.85 },
    { beat: 4, subdivision: 0.5, rootOffset: 7, octave: 0, duration: 0.5, velocity: 0.7 },
  ],
};

/**
 * Funky pattern - complex rhythmic figure.
 */
const funky: BassPattern = {
  id: 'funky',
  name: 'Funky',
  description: 'Complex funky bass line',
  measuresPerLoop: 2,
  followsChordRoot: true,
  difficulty: 'advanced',
  notes: [
    // Measure 1 - syncopated groove
    { beat: 1, subdivision: 0, rootOffset: 0, octave: 0, duration: 0.25, velocity: 1.0 },
    { beat: 1, subdivision: 0.25, rootOffset: 0, octave: 0, duration: 0.25, velocity: 0.5 },
    { beat: 1, subdivision: 0.75, rootOffset: 3, octave: 0, duration: 0.25, velocity: 0.8 },
    { beat: 2, subdivision: 0.5, rootOffset: 5, octave: 0, duration: 0.5, velocity: 0.85 },
    { beat: 3, subdivision: 0, rootOffset: 0, octave: 0, duration: 0.25, velocity: 0.9 },
    { beat: 3, subdivision: 0.5, rootOffset: 7, octave: 0, duration: 0.5, velocity: 0.75 },
    { beat: 4, subdivision: 0, rootOffset: 5, octave: 0, duration: 0.25, velocity: 0.8 },
    { beat: 4, subdivision: 0.5, rootOffset: 3, octave: 0, duration: 0.5, velocity: 0.7 },
    // Measure 2 - variation
    { beat: 5, subdivision: 0, rootOffset: 0, octave: 0, duration: 0.5, velocity: 1.0 },
    { beat: 5, subdivision: 0.75, rootOffset: 0, octave: 1, duration: 0.25, velocity: 0.7 },
    { beat: 6, subdivision: 0.25, rootOffset: 10, octave: 0, duration: 0.25, velocity: 0.8 },
    { beat: 6, subdivision: 0.5, rootOffset: 7, octave: 0, duration: 0.5, velocity: 0.85 },
    { beat: 7, subdivision: 0, rootOffset: 5, octave: 0, duration: 0.5, velocity: 0.9 },
    { beat: 7, subdivision: 0.5, rootOffset: 3, octave: 0, duration: 0.5, velocity: 0.75 },
    { beat: 8, subdivision: 0, rootOffset: 0, octave: 0, duration: 1, velocity: 0.95 },
  ],
};

/**
 * Sustained - long notes, minimal movement.
 */
const sustained: BassPattern = {
  id: 'sustained',
  name: 'Sustained',
  description: 'Long sustained notes',
  measuresPerLoop: 1,
  followsChordRoot: true,
  difficulty: 'beginner',
  notes: [
    { beat: 1, subdivision: 0, rootOffset: 0, octave: 0, duration: 4, velocity: 0.9 },
  ],
};

/**
 * Silent - no bass at all.
 */
const silent: BassPattern = {
  id: 'silentBass',
  name: 'Silent',
  description: 'No bass sounds',
  measuresPerLoop: 1,
  followsChordRoot: false,
  difficulty: 'beginner',
  notes: [],
};

// ==================== Pattern Registry ====================

export const BASS_PATTERNS: Record<string, BassPattern> = {
  rootNotes,
  rootFifth,
  eighthNotes,
  walking,
  syncopated: syncopated,
  octaveJump,
  funky,
  sustained,
  silent,
};

/**
 * Get patterns by difficulty.
 */
export function getBassPatternsByDifficulty(
  difficulty: 'beginner' | 'intermediate' | 'advanced'
): BassPattern[] {
  return Object.values(BASS_PATTERNS).filter((p) => p.difficulty === difficulty);
}

/**
 * Get pattern by ID with fallback.
 */
export function getBassPattern(id: string): BassPattern {
  return BASS_PATTERNS[id] ?? BASS_PATTERNS.rootNotes;
}

/**
 * Get all pattern IDs.
 */
export function getBassPatternIds(): string[] {
  return Object.keys(BASS_PATTERNS);
}

/**
 * Calculate frequency for a bass note given the current root.
 */
export function calculateBassFrequency(
  note: BassNote,
  currentRootSemitones: number
): number {
  const totalSemitones = currentRootSemitones + note.rootOffset + note.octave * 12;
  return BASS_BASE_FREQUENCY * Math.pow(2, totalSemitones / 12);
}
