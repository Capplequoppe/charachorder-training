/**
 * Utility Functions
 *
 * Shared utilities for the application.
 */

export { spawnParticles, spawnConfetti, spawnStars } from './particles';
export type { ParticleConfig } from './particles';

export {
  detectChordUsage,
  detectChordFromEvents,
  ChordDetectionTracker,
  createChordDetectionTracker,
  isPunctuation,
  isWordBoundary,
  normalizeWordInput,
  compareWords,
  CHORD_THRESHOLD_MS,
  SEQUENTIAL_THRESHOLD_MS,
} from './chordDetection';
export type {
  ChordUsageResult,
  KeystrokeEvent,
} from './chordDetection';

export {
  needsVisualReference,
  getCharacterName,
  getCharacterDisplayInfo,
  CHARACTERS_NEEDING_REFERENCE,
  CHARACTER_NAMES,
} from './characterDisplay';
