/**
 * Drum Pattern Definitions
 *
 * Defines drum patterns for background music in song mode.
 * Patterns are defined as arrays of hits with timing and velocity.
 */

// ==================== Types ====================

export type DrumSound = 'kick' | 'snare' | 'hihat' | 'hihatOpen' | 'rim' | 'clap';

export interface DrumHit {
  sound: DrumSound;
  beat: number; // Beat position within measure (1-4 for 4/4)
  subdivision: number; // 0 = on beat, 0.25/0.5/0.75 for 16th/8th notes
  velocity: number; // 0-1 volume
}

export interface DrumPattern {
  id: string;
  name: string;
  description: string;
  hits: DrumHit[];
  measuresPerLoop: number; // How many measures before pattern repeats
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

// ==================== Pattern Definitions ====================

/**
 * Basic 4/4 pattern - simple kick/snare with hi-hats.
 * Good for beginners, clear downbeat.
 */
const basic4_4: DrumPattern = {
  id: 'basic4_4',
  name: 'Basic 4/4',
  description: 'Simple kick and snare pattern with eighth-note hi-hats',
  measuresPerLoop: 1,
  difficulty: 'beginner',
  hits: [
    // Kick on 1 and 3
    { sound: 'kick', beat: 1, subdivision: 0, velocity: 1.0 },
    { sound: 'kick', beat: 3, subdivision: 0, velocity: 0.9 },
    // Snare on 2 and 4 (backbeat)
    { sound: 'snare', beat: 2, subdivision: 0, velocity: 0.95 },
    { sound: 'snare', beat: 4, subdivision: 0, velocity: 1.0 },
    // Hi-hats on every eighth note
    { sound: 'hihat', beat: 1, subdivision: 0, velocity: 0.7 },
    { sound: 'hihat', beat: 1, subdivision: 0.5, velocity: 0.5 },
    { sound: 'hihat', beat: 2, subdivision: 0, velocity: 0.6 },
    { sound: 'hihat', beat: 2, subdivision: 0.5, velocity: 0.5 },
    { sound: 'hihat', beat: 3, subdivision: 0, velocity: 0.7 },
    { sound: 'hihat', beat: 3, subdivision: 0.5, velocity: 0.5 },
    { sound: 'hihat', beat: 4, subdivision: 0, velocity: 0.6 },
    { sound: 'hihat', beat: 4, subdivision: 0.5, velocity: 0.5 },
  ],
};

/**
 * Minimal pattern - just kick and snare, no hi-hats.
 * Very sparse, lets the typing sounds stand out.
 */
const minimal: DrumPattern = {
  id: 'minimal',
  name: 'Minimal',
  description: 'Sparse kick and snare only',
  measuresPerLoop: 1,
  difficulty: 'beginner',
  hits: [
    { sound: 'kick', beat: 1, subdivision: 0, velocity: 1.0 },
    { sound: 'snare', beat: 3, subdivision: 0, velocity: 0.9 },
  ],
};

/**
 * Half-time feel - snare on 3 only.
 * Slower, more relaxed feel even at faster tempos.
 */
const halftime: DrumPattern = {
  id: 'halftime',
  name: 'Half-time',
  description: 'Relaxed half-time feel with snare on beat 3',
  measuresPerLoop: 1,
  difficulty: 'beginner',
  hits: [
    { sound: 'kick', beat: 1, subdivision: 0, velocity: 1.0 },
    { sound: 'snare', beat: 3, subdivision: 0, velocity: 0.95 },
    { sound: 'hihat', beat: 1, subdivision: 0, velocity: 0.6 },
    { sound: 'hihat', beat: 2, subdivision: 0, velocity: 0.5 },
    { sound: 'hihat', beat: 3, subdivision: 0, velocity: 0.6 },
    { sound: 'hihat', beat: 4, subdivision: 0, velocity: 0.5 },
  ],
};

/**
 * Four-on-the-floor - kick on every beat.
 * Driving, dance-like feel.
 */
const fourOnFloor: DrumPattern = {
  id: 'fourOnFloor',
  name: 'Four on the Floor',
  description: 'Kick on every beat, dance-style',
  measuresPerLoop: 1,
  difficulty: 'intermediate',
  hits: [
    // Kick on every beat
    { sound: 'kick', beat: 1, subdivision: 0, velocity: 1.0 },
    { sound: 'kick', beat: 2, subdivision: 0, velocity: 0.85 },
    { sound: 'kick', beat: 3, subdivision: 0, velocity: 0.9 },
    { sound: 'kick', beat: 4, subdivision: 0, velocity: 0.85 },
    // Snare on 2 and 4
    { sound: 'snare', beat: 2, subdivision: 0, velocity: 0.9 },
    { sound: 'snare', beat: 4, subdivision: 0, velocity: 0.95 },
    // Open hi-hat on off-beats
    { sound: 'hihatOpen', beat: 1, subdivision: 0.5, velocity: 0.7 },
    { sound: 'hihatOpen', beat: 2, subdivision: 0.5, velocity: 0.7 },
    { sound: 'hihatOpen', beat: 3, subdivision: 0.5, velocity: 0.7 },
    { sound: 'hihatOpen', beat: 4, subdivision: 0.5, velocity: 0.7 },
  ],
};

/**
 * Syncopated pattern - kick anticipates beat 3.
 * More groove, slightly more complex.
 */
const syncopated: DrumPattern = {
  id: 'syncopated',
  name: 'Syncopated',
  description: 'Groovy pattern with syncopated kick',
  measuresPerLoop: 1,
  difficulty: 'intermediate',
  hits: [
    // Kick on 1, and before 3 (syncopation)
    { sound: 'kick', beat: 1, subdivision: 0, velocity: 1.0 },
    { sound: 'kick', beat: 2, subdivision: 0.5, velocity: 0.8 }, // Anticipates beat 3
    { sound: 'kick', beat: 4, subdivision: 0, velocity: 0.75 },
    // Snare on 2 and 4
    { sound: 'snare', beat: 2, subdivision: 0, velocity: 0.9 },
    { sound: 'snare', beat: 4, subdivision: 0, velocity: 0.95 },
    // Hi-hats with accent pattern
    { sound: 'hihat', beat: 1, subdivision: 0, velocity: 0.8 },
    { sound: 'hihat', beat: 1, subdivision: 0.5, velocity: 0.4 },
    { sound: 'hihat', beat: 2, subdivision: 0, velocity: 0.5 },
    { sound: 'hihat', beat: 2, subdivision: 0.5, velocity: 0.4 },
    { sound: 'hihat', beat: 3, subdivision: 0, velocity: 0.7 },
    { sound: 'hihat', beat: 3, subdivision: 0.5, velocity: 0.4 },
    { sound: 'hihat', beat: 4, subdivision: 0, velocity: 0.5 },
    { sound: 'hihat', beat: 4, subdivision: 0.5, velocity: 0.4 },
  ],
};

/**
 * Breakbeat pattern - more complex 2-bar pattern.
 * Funky, energetic feel.
 */
const breakbeat: DrumPattern = {
  id: 'breakbeat',
  name: 'Breakbeat',
  description: 'Funky two-bar pattern with syncopation',
  measuresPerLoop: 2,
  difficulty: 'advanced',
  hits: [
    // Measure 1
    { sound: 'kick', beat: 1, subdivision: 0, velocity: 1.0 },
    { sound: 'snare', beat: 2, subdivision: 0, velocity: 0.9 },
    { sound: 'kick', beat: 2, subdivision: 0.5, velocity: 0.7 },
    { sound: 'kick', beat: 4, subdivision: 0, velocity: 0.85 },
    { sound: 'snare', beat: 4, subdivision: 0.5, velocity: 0.8 },
    // Hi-hats measure 1
    { sound: 'hihat', beat: 1, subdivision: 0, velocity: 0.7 },
    { sound: 'hihat', beat: 1, subdivision: 0.5, velocity: 0.5 },
    { sound: 'hihat', beat: 2, subdivision: 0.5, velocity: 0.5 },
    { sound: 'hihat', beat: 3, subdivision: 0, velocity: 0.7 },
    { sound: 'hihat', beat: 3, subdivision: 0.5, velocity: 0.5 },
    { sound: 'hihat', beat: 4, subdivision: 0.5, velocity: 0.5 },
    // Measure 2 (add 4 to beat numbers)
    { sound: 'kick', beat: 5, subdivision: 0, velocity: 0.95 },
    { sound: 'snare', beat: 6, subdivision: 0, velocity: 0.9 },
    { sound: 'kick', beat: 7, subdivision: 0, velocity: 0.9 },
    { sound: 'kick', beat: 7, subdivision: 0.5, velocity: 0.7 },
    { sound: 'snare', beat: 8, subdivision: 0, velocity: 1.0 },
    // Hi-hats measure 2
    { sound: 'hihat', beat: 5, subdivision: 0, velocity: 0.7 },
    { sound: 'hihat', beat: 5, subdivision: 0.5, velocity: 0.5 },
    { sound: 'hihat', beat: 6, subdivision: 0.5, velocity: 0.5 },
    { sound: 'hihat', beat: 7, subdivision: 0, velocity: 0.7 },
    { sound: 'hihat', beat: 7, subdivision: 0.5, velocity: 0.5 },
    { sound: 'hihat', beat: 8, subdivision: 0.5, velocity: 0.5 },
  ],
};

/**
 * Metronome - just clicks, no drums.
 * Pure timing reference.
 */
const metronome: DrumPattern = {
  id: 'metronome',
  name: 'Metronome',
  description: 'Simple click on every beat',
  measuresPerLoop: 1,
  difficulty: 'beginner',
  hits: [
    { sound: 'rim', beat: 1, subdivision: 0, velocity: 1.0 }, // Accent beat 1
    { sound: 'rim', beat: 2, subdivision: 0, velocity: 0.6 },
    { sound: 'rim', beat: 3, subdivision: 0, velocity: 0.6 },
    { sound: 'rim', beat: 4, subdivision: 0, velocity: 0.6 },
  ],
};

/**
 * Silent - no drums at all.
 * For practice without audio distraction.
 */
const silent: DrumPattern = {
  id: 'silent',
  name: 'Silent',
  description: 'No drum sounds',
  measuresPerLoop: 1,
  difficulty: 'beginner',
  hits: [],
};

// ==================== Pattern Registry ====================

export const DRUM_PATTERNS: Record<string, DrumPattern> = {
  basic4_4,
  minimal,
  halftime,
  fourOnFloor,
  syncopated,
  breakbeat,
  metronome,
  silent,
};

/**
 * Get patterns by difficulty.
 */
export function getPatternsByDifficulty(
  difficulty: 'beginner' | 'intermediate' | 'advanced'
): DrumPattern[] {
  return Object.values(DRUM_PATTERNS).filter((p) => p.difficulty === difficulty);
}

/**
 * Get pattern by ID with fallback.
 */
export function getPattern(id: string): DrumPattern {
  return DRUM_PATTERNS[id] ?? DRUM_PATTERNS.basic4_4;
}

/**
 * Get all pattern IDs.
 */
export function getPatternIds(): string[] {
  return Object.keys(DRUM_PATTERNS);
}
