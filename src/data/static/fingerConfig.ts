/**
 * Static finger configuration based on research-optimized mappings.
 *
 * Color mapping: Based on pitch-color psychology
 * - High pitch -> cool/bright colors (blues, greens)
 * - Low pitch -> warm/dark colors (reds, oranges)
 *
 * Note mapping: Optimized for consonant intervals between
 * frequently paired fingers (power chords).
 */

import {
  Hand,
  FingerType,
  FingerId,
  Finger,
  ColorDefinition,
  NoteDefinition,
} from '../../domain';
import { FINGER_COLORS } from './colorConfig';

/**
 * Helper to create ColorDefinition from FINGER_COLORS config.
 */
function colorFromConfig(fingerId: FingerId) {
  const config = FINGER_COLORS[fingerId];
  return ColorDefinition.createWithVariations(config.base, config.name, config.variations);
}

/**
 * Research-based finger configuration.
 * Each finger has:
 * - Unique color based on its note's pitch (from colorConfig)
 * - Musical note optimized for consonant power chord intervals
 * - Visual position for hand diagram rendering
 */
export const FINGER_CONFIG: Record<FingerId, Finger> = {
  // ==================== LEFT HAND ====================

  l_pinky: Finger.create({
    id: 'l_pinky',
    hand: Hand.LEFT,
    type: FingerType.PINKY,
    displayName: 'Left Pinky',
    shortName: 'L.Pinky',
    color: colorFromConfig('l_pinky'),
    note: undefined, // Pinky has modifiers by default, no note needed
    visualPosition: { x: 5, y: 30 },
    hasCharacters: false, // No characters by default, but can be mapped
  }),

  l_ring: Finger.create({
    id: 'l_ring',
    hand: Hand.LEFT,
    type: FingerType.RING,
    displayName: 'Left Ring',
    shortName: 'L.Ring',
    color: colorFromConfig('l_ring'),
    note: NoteDefinition.create('A4', 440.0, -0.3), // Mid-high pitch
    visualPosition: { x: 12, y: 15 },
    hasCharacters: true,
  }),

  l_middle: Finger.create({
    id: 'l_middle',
    hand: Hand.LEFT,
    type: FingerType.MIDDLE,
    displayName: 'Left Middle',
    shortName: 'L.Middle',
    color: colorFromConfig('l_middle'),
    note: NoteDefinition.create('D5', 587.33, -0.2), // Highest left, airy
    visualPosition: { x: 20, y: 8 },
    hasCharacters: true,
  }),

  l_index: Finger.create({
    id: 'l_index',
    hand: Hand.LEFT,
    type: FingerType.INDEX,
    displayName: 'Left Index',
    shortName: 'L.Index',
    color: colorFromConfig('l_index'),
    note: NoteDefinition.create('B4', 493.88, -0.4), // High, pairs with R_index
    visualPosition: { x: 28, y: 12 },
    hasCharacters: true,
  }),

  l_thumb_first: Finger.create({
    id: 'l_thumb_first',
    hand: Hand.LEFT,
    type: FingerType.THUMB_FIRST,
    displayName: 'Left Thumb 1',
    shortName: 'L.Thumb1',
    color: colorFromConfig('l_thumb_first'),
    note: NoteDefinition.create('A3', 220.0, -0.5), // 4th/5th with common partners
    visualPosition: { x: 35, y: 55 },
    hasCharacters: true,
  }),

  l_thumb_second: Finger.create({
    id: 'l_thumb_second',
    hand: Hand.LEFT,
    type: FingerType.THUMB_SECOND,
    displayName: 'Left Thumb 2',
    shortName: 'L.Thumb2',
    color: colorFromConfig('l_thumb_second'),
    note: NoteDefinition.create('E3', 164.81, -0.6), // Root, foundational
    visualPosition: { x: 42, y: 65 },
    hasCharacters: true,
  }),

  l_thumb_third: Finger.create({
    id: 'l_thumb_third',
    hand: Hand.LEFT,
    type: FingerType.THUMB_THIRD,
    displayName: 'Left Thumb 3',
    shortName: 'L.Thumb3',
    color: colorFromConfig('l_thumb_third'),
    note: undefined, // Third thumb has modifiers by default
    visualPosition: { x: 48, y: 72 },
    hasCharacters: false, // No characters by default, but can be mapped
  }),

  l_arrow: Finger.create({
    id: 'l_arrow',
    hand: Hand.LEFT,
    type: FingerType.ARROW,
    displayName: 'Left Arrow Keys',
    shortName: 'L.Arrow',
    color: colorFromConfig('l_arrow'),
    note: undefined, // Arrow keys have navigation by default
    visualPosition: { x: 15, y: 75 },
    hasCharacters: false, // No characters by default, but can be mapped
  }),

  l_trackball: Finger.create({
    id: 'l_trackball',
    hand: Hand.LEFT,
    type: FingerType.TRACKBALL,
    displayName: 'Left Trackball',
    shortName: 'L.Track',
    color: colorFromConfig('l_trackball'),
    note: undefined, // Trackball has navigation by default
    visualPosition: { x: 25, y: 80 },
    hasCharacters: false, // No characters by default, but can be mapped
  }),

  // ==================== RIGHT HAND ====================

  r_thumb_second: Finger.create({
    id: 'r_thumb_second',
    hand: Hand.RIGHT,
    type: FingerType.THUMB_SECOND,
    displayName: 'Right Thumb 2',
    shortName: 'R.Thumb2',
    color: colorFromConfig('r_thumb_second'),
    note: NoteDefinition.create('E4', 329.63, 0.2), // Middle bright
    visualPosition: { x: 58, y: 65 },
    hasCharacters: true,
  }),

  r_thumb_first: Finger.create({
    id: 'r_thumb_first',
    hand: Hand.RIGHT,
    type: FingerType.THUMB_FIRST,
    displayName: 'Right Thumb 1',
    shortName: 'R.Thumb1',
    color: colorFromConfig('r_thumb_first'),
    note: NoteDefinition.create('G3', 196.0, 0.3), // Warm, resonant
    visualPosition: { x: 65, y: 55 },
    hasCharacters: true,
  }),

  r_thumb_third: Finger.create({
    id: 'r_thumb_third',
    hand: Hand.RIGHT,
    type: FingerType.THUMB_THIRD,
    displayName: 'Right Thumb 3',
    shortName: 'R.Thumb3',
    color: colorFromConfig('r_thumb_third'),
    note: undefined, // Third thumb has modifiers by default
    visualPosition: { x: 52, y: 72 },
    hasCharacters: false, // No characters by default, but can be mapped
  }),

  r_arrow: Finger.create({
    id: 'r_arrow',
    hand: Hand.RIGHT,
    type: FingerType.ARROW,
    displayName: 'Right Arrow Keys',
    shortName: 'R.Arrow',
    color: colorFromConfig('r_arrow'),
    note: undefined, // Arrow keys have navigation by default
    visualPosition: { x: 85, y: 75 },
    hasCharacters: false, // No characters by default, but can be mapped
  }),

  r_trackball: Finger.create({
    id: 'r_trackball',
    hand: Hand.RIGHT,
    type: FingerType.TRACKBALL,
    displayName: 'Right Trackball',
    shortName: 'R.Track',
    color: colorFromConfig('r_trackball'),
    note: undefined, // Trackball has navigation by default
    visualPosition: { x: 75, y: 80 },
    hasCharacters: false, // No characters by default, but can be mapped
  }),

  r_index: Finger.create({
    id: 'r_index',
    hand: Hand.RIGHT,
    type: FingerType.INDEX,
    displayName: 'Right Index',
    shortName: 'R.Index',
    color: colorFromConfig('r_index'),
    note: NoteDefinition.create('B3', 246.94, 0.4), // Octave with L_index
    visualPosition: { x: 72, y: 12 },
    hasCharacters: true,
  }),

  r_middle: Finger.create({
    id: 'r_middle',
    hand: Hand.RIGHT,
    type: FingerType.MIDDLE,
    displayName: 'Right Middle',
    shortName: 'R.Middle',
    color: colorFromConfig('r_middle'),
    note: NoteDefinition.create('G4', 392.0, 0.5), // Mid-high, emotional
    visualPosition: { x: 80, y: 8 },
    hasCharacters: true,
  }),

  r_ring: Finger.create({
    id: 'r_ring',
    hand: Hand.RIGHT,
    type: FingerType.RING,
    displayName: 'Right Ring',
    shortName: 'R.Ring',
    color: colorFromConfig('r_ring'),
    note: NoteDefinition.create('D4', 293.66, 0.6), // Middle, consonant
    visualPosition: { x: 88, y: 15 },
    hasCharacters: true,
  }),

  r_pinky: Finger.create({
    id: 'r_pinky',
    hand: Hand.RIGHT,
    type: FingerType.PINKY,
    displayName: 'Right Pinky',
    shortName: 'R.Pinky',
    color: colorFromConfig('r_pinky'),
    note: undefined, // Pinky has modifiers by default, no note needed
    visualPosition: { x: 95, y: 30 },
    hasCharacters: false, // No characters by default, but can be mapped
  }),
};

/**
 * Fingers ordered left to right for UI rendering.
 */
export const FINGERS_IN_ORDER: FingerId[] = [
  'l_pinky',
  'l_ring',
  'l_middle',
  'l_index',
  'l_thumb_first',
  'l_thumb_second',
  'l_thumb_third',
  'l_arrow',
  'l_trackball',
  'r_trackball',
  'r_arrow',
  'r_thumb_third',
  'r_thumb_second',
  'r_thumb_first',
  'r_index',
  'r_middle',
  'r_ring',
  'r_pinky',
];

/**
 * Gets all fingers as an array.
 */
export function getAllFingers(): Finger[] {
  return FINGERS_IN_ORDER.map((id) => FINGER_CONFIG[id]);
}

/**
 * Gets fingers that have characters assigned.
 */
export function getFingersWithCharacters(): Finger[] {
  return getAllFingers().filter((f) => f.hasCharacters);
}
