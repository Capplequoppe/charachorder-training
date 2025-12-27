/**
 * Finger Mapping Configuration
 *
 * This module provides convenient re-exports from the domain/static layer
 * for components that need finger, character, and audio mappings.
 *
 * It also contains the unique KEY_MAPPING configuration for the CharaChorder 2.1 layout.
 */

import { FingerId, Direction } from '../domain';
import { CHAR_TO_CONFIG } from '../data/static/characterConfig';
import { FINGER_CONFIG, FINGERS_IN_ORDER as FINGERS_ORDER } from '../data/static/fingerConfig';
import { FINGER_COLORS as COLOR_CONFIG, getFingerColor } from '../data/static/colorConfig';
import { FINGER_NOTES as AUDIO_CONFIG } from '../data/static/audioConfig';

// Re-export domain types
export { Direction } from '../domain';
export type { FingerId } from '../domain';

// Type alias for backwards compatibility
export type Finger = FingerId;

// Re-export from static layer
export {
  // Finger configuration
  FINGER_CONFIG,
  getAllFingers,
  getFingersWithCharacters,
} from '../data/static/fingerConfig';

export {
  // Character configuration
  CHARACTER_CONFIG,
  CHAR_TO_CONFIG,
  getCharsForFinger,
  getConfigForChar,
  ALL_CHARACTERS,
} from '../data/static/characterConfig';

export {
  // Color configuration (full config)
  getFingerColor,
  DIRECTION_SYMBOLS,
} from '../data/static/colorConfig';

export {
  // Audio configuration
  FINGER_NOTES,
  getFingerFrequency,
  getFingerNoteName,
  fingerHasSound,
  getFingersWithSound,
} from '../data/static/audioConfig';

// ============================================================================
// Backwards Compatibility Exports
// ============================================================================

/**
 * Finger const object for value access (e.g., Finger.L_INDEX).
 * Allows using Finger as both a type and a value.
 */
export const Finger = {
  // Left hand
  L_INDEX: 'l_index' as const,
  L_MIDDLE: 'l_middle' as const,
  L_RING: 'l_ring' as const,
  L_PINKY: 'l_pinky' as const,
  L_THUMB_INNER: 'l_thumb_inner' as const,
  L_THUMB_OUTER: 'l_thumb_outer' as const,
  // Right hand
  R_INDEX: 'r_index' as const,
  R_MIDDLE: 'r_middle' as const,
  R_RING: 'r_ring' as const,
  R_PINKY: 'r_pinky' as const,
  R_THUMB_INNER: 'r_thumb_inner' as const,
  R_THUMB_OUTER: 'r_thumb_outer' as const,
} as const;

/**
 * Fingers ordered left to right for UI rendering.
 */
export const FINGERS_IN_ORDER: FingerId[] = FINGERS_ORDER;

/**
 * Simple finger colors - just the base color string for each finger.
 * Use getFingerColor() for directional variations.
 */
export const FINGER_COLORS: Record<FingerId, string> = Object.fromEntries(
  Object.entries(COLOR_CONFIG).map(([id, config]) => [id, config.base])
) as Record<FingerId, string>;

/**
 * Finger display names.
 */
export const FINGER_NAMES: Record<FingerId, string> = Object.fromEntries(
  Object.entries(FINGER_CONFIG).map(([id, finger]) => [id, finger.displayName])
) as Record<FingerId, string>;

// ============================================================================
// Convenience Helper Functions
// ============================================================================

/**
 * Get finger for a character (case insensitive).
 */
export function getFingerForChar(char: string): FingerId | null {
  const config = CHAR_TO_CONFIG.get(char.toLowerCase());
  return config?.fingerId ?? null;
}

/**
 * Get color for a character.
 */
export function getColorForChar(char: string): string {
  const config = CHAR_TO_CONFIG.get(char.toLowerCase());
  if (!config) return '#888888';
  return getFingerColor(config.fingerId, config.direction);
}

/**
 * Get note info for a character.
 */
export function getNoteForChar(char: string): { note: string; frequency: number } | null {
  const config = CHAR_TO_CONFIG.get(char.toLowerCase());
  if (!config) return null;
  const audioConfig = AUDIO_CONFIG[config.fingerId];
  if (!audioConfig) return null;
  return { note: audioConfig.name, frequency: audioConfig.frequency };
}

/**
 * Get the note name for a finger, or a fallback if not available.
 */
export function getFingerNoteNameLegacy(finger: FingerId): string {
  const note = AUDIO_CONFIG[finger];
  return note?.name ?? '—';
}

/**
 * Get unique fingers used in a chord string.
 */
export function getFingersForChord(chord: string): FingerId[] {
  const fingers = new Set<FingerId>();
  for (const char of chord.toLowerCase()) {
    const finger = getFingerForChar(char);
    if (finger) {
      fingers.add(finger);
    }
  }
  return Array.from(fingers);
}

/**
 * Get finger display name.
 */
export function getFingerName(fingerId: FingerId): string {
  return FINGER_CONFIG[fingerId]?.displayName ?? fingerId;
}

/**
 * Get the direction for a character.
 */
export function getDirectionForChar(char: string): Direction | null {
  const config = CHAR_TO_CONFIG.get(char.toLowerCase());
  return config?.direction ?? null;
}

/**
 * Get direction symbol/arrow.
 */
export function getDirectionSymbol(direction: Direction | null): string {
  switch (direction) {
    case Direction.UP: return '↑';
    case Direction.DOWN: return '↓';
    case Direction.LEFT: return '←';
    case Direction.RIGHT: return '→';
    default: return '';
  }
}

// ============================================================================
// KEY_MAPPING - Unique to this file
// Detailed key layout for CharaChorder 2.1 learning/reference UI
// ============================================================================

export interface KeyInfo {
  key: string | null;
  char: string | null;
}

export interface FingerKeys {
  up: KeyInfo;
  down: KeyInfo;
  left: KeyInfo;
  right: KeyInfo;
}

export interface HandMapping {
  index: FingerKeys;
  middle: FingerKeys;
  ring: FingerKeys;
  pinky: FingerKeys;
  thumbInner: FingerKeys;
  thumbOuter: FingerKeys;
}

export interface KeyMapping {
  left: HandMapping;
  right: HandMapping;
}

/**
 * Detailed key mapping for learning section.
 * Maps each finger position to what key/character it produces.
 */
export const KEY_MAPPING: KeyMapping = {
  // Left hand
  left: {
    index: {
      up: { key: 'Backspace', char: null },
      down: { key: 'e', char: 'e' },
      left: { key: 'Space', char: null },
      right: { key: 'r', char: 'r' },
    },
    middle: {
      up: { key: 'Delete', char: null },
      down: { key: 'o', char: 'o' },
      left: { key: '.', char: '.' },
      right: { key: 'i', char: 'i' },
    },
    ring: {
      up: { key: 'Ctrl', char: null },
      down: { key: 'u', char: 'u' },
      left: { key: ',', char: ',' },
      right: { key: "'", char: "'" },
    },
    pinky: {
      up: { key: 'Alt', char: null },
      down: { key: null, char: null },
      left: { key: 'Layer2', char: null },
      right: { key: 'Shift', char: null },
    },
    thumbInner: {
      up: { key: 'v', char: 'v' },
      down: { key: 'c', char: 'c' },
      left: { key: 'm', char: 'm' },
      right: { key: 'k', char: 'k' },
    },
    thumbOuter: {
      up: { key: null, char: null },
      down: { key: 'z', char: 'z' },
      left: { key: 'g', char: 'g' },
      right: { key: 'w', char: 'w' },
    },
  },
  // Right hand
  right: {
    index: {
      up: { key: 'Enter', char: null },
      down: { key: 't', char: 't' },
      left: { key: 'a', char: 'a' },
      right: { key: 'Space', char: null },
    },
    middle: {
      up: { key: 'Tab', char: null },
      down: { key: 'n', char: 'n' },
      left: { key: 'l', char: 'l' },
      right: { key: 'j', char: 'j' },
    },
    ring: {
      up: { key: 'Ctrl', char: null },
      down: { key: 's', char: 's' },
      left: { key: 'y', char: 'y' },
      right: { key: ';', char: ';' },
    },
    pinky: {
      up: { key: 'Alt', char: null },
      down: { key: null, char: null },
      left: { key: 'Shift', char: null },
      right: { key: 'Layer2', char: null },
    },
    thumbInner: {
      up: { key: 'p', char: 'p' },
      down: { key: 'd', char: 'd' },
      left: { key: 'f', char: 'f' },
      right: { key: 'h', char: 'h' },
    },
    thumbOuter: {
      up: { key: 'x', char: 'x' },
      down: { key: 'q', char: 'q' },
      left: { key: 'b', char: 'b' },
      right: { key: 'DUP', char: null },
    },
  },
};
