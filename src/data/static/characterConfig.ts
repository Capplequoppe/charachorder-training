/**
 * Character-to-finger mapping configuration based on CharaChorder 2.1 layout.
 *
 * Each entry maps a typeable character to:
 * - The finger that produces it
 * - The direction that finger moves
 */

import { FingerId, Direction } from '../../domain';

/**
 * Configuration entry for a single character mapping.
 */
export interface CharacterConfigEntry {
  /** The character (lowercase) */
  char: string;
  /** The finger that produces this character */
  fingerId: FingerId;
  /** The direction to produce this character */
  direction: Direction;
}

/**
 * CharaChorder 2.1 character layout.
 * Based on the actual device configuration.
 */
export const CHARACTER_CONFIG: CharacterConfigEntry[] = [
  // ==================== LEFT INDEX ====================
  { char: 'e', fingerId: 'l_index', direction: Direction.DOWN },
  { char: 'r', fingerId: 'l_index', direction: Direction.RIGHT },
  // UP = Backspace (not a character)
  // RIGHT = Space (not a character)

  // ==================== LEFT MIDDLE (Long) ====================
  { char: 'o', fingerId: 'l_middle', direction: Direction.DOWN },
  { char: '.', fingerId: 'l_middle', direction: Direction.LEFT },
  { char: 'i', fingerId: 'l_middle', direction: Direction.RIGHT },
  // UP = Delete (not a character)

  // ==================== LEFT RING ====================
  { char: 'u', fingerId: 'l_ring', direction: Direction.DOWN },
  { char: ',', fingerId: 'l_ring', direction: Direction.LEFT },
  { char: "'", fingerId: 'l_ring', direction: Direction.RIGHT },
  // UP = Ctrl (not a character)

  // ==================== LEFT PINKY ====================
  // No printable characters - only modifiers (Alt, Shift, Layer2)

  // ==================== LEFT THUMB FIRST ====================
  { char: 'v', fingerId: 'l_thumb_first', direction: Direction.UP },
  { char: 'c', fingerId: 'l_thumb_first', direction: Direction.DOWN },
  { char: 'm', fingerId: 'l_thumb_first', direction: Direction.LEFT },
  { char: 'k', fingerId: 'l_thumb_first', direction: Direction.RIGHT },

  // ==================== LEFT THUMB SECOND ====================
  { char: 'z', fingerId: 'l_thumb_second', direction: Direction.DOWN },
  { char: 'g', fingerId: 'l_thumb_second', direction: Direction.LEFT },
  { char: 'w', fingerId: 'l_thumb_second', direction: Direction.RIGHT },
  // UP = unused

  // ==================== LEFT THUMB THIRD ====================
  // No printable characters by default - only modifiers (Shift, Ctrl, etc.)
  // Can be customized via layout profiles

  // ==================== LEFT ARROW ====================
  // No printable characters by default - only arrow keys
  // Can be customized via layout profiles

  // ==================== LEFT TRACKBALL ====================
  // No printable characters by default - only mouse/trackball controls
  // Can be customized via layout profiles

  // ==================== RIGHT INDEX ====================
  { char: 't', fingerId: 'r_index', direction: Direction.DOWN },
  { char: 'a', fingerId: 'r_index', direction: Direction.LEFT },
  // UP = Enter (not a character)
  // RIGHT = Space (not a character)

  // ==================== RIGHT MIDDLE (Long) ====================
  { char: 'n', fingerId: 'r_middle', direction: Direction.DOWN },
  { char: 'l', fingerId: 'r_middle', direction: Direction.LEFT },
  { char: 'j', fingerId: 'r_middle', direction: Direction.RIGHT },
  // UP = Tab (not a character)

  // ==================== RIGHT RING ====================
  { char: 's', fingerId: 'r_ring', direction: Direction.DOWN },
  { char: 'y', fingerId: 'r_ring', direction: Direction.LEFT },
  { char: ';', fingerId: 'r_ring', direction: Direction.RIGHT },
  // UP = Ctrl (not a character)

  // ==================== RIGHT PINKY ====================
  // No printable characters - only modifiers (Alt, Shift, Layer2)
  // Can be customized via layout profiles

  // ==================== RIGHT THUMB FIRST ====================
  { char: 'p', fingerId: 'r_thumb_first', direction: Direction.UP },
  { char: 'd', fingerId: 'r_thumb_first', direction: Direction.DOWN },
  { char: 'f', fingerId: 'r_thumb_first', direction: Direction.LEFT },
  { char: 'h', fingerId: 'r_thumb_first', direction: Direction.RIGHT },

  // ==================== RIGHT THUMB SECOND ====================
  { char: 'x', fingerId: 'r_thumb_second', direction: Direction.UP },
  { char: 'q', fingerId: 'r_thumb_second', direction: Direction.DOWN },
  { char: 'b', fingerId: 'r_thumb_second', direction: Direction.LEFT },
  // RIGHT = DUP (not a character)

  // ==================== RIGHT THUMB THIRD ====================
  // No printable characters by default - only modifiers (Shift, Ctrl, etc.)
  // Can be customized via layout profiles

  // ==================== RIGHT ARROW ====================
  // No printable characters by default - only arrow keys
  // Can be customized via layout profiles

  // ==================== RIGHT TRACKBALL ====================
  // No printable characters by default - only mouse/trackball controls
  // Can be customized via layout profiles
];

/**
 * Map from character to its configuration.
 */
export const CHAR_TO_CONFIG: Map<string, CharacterConfigEntry> = new Map(
  CHARACTER_CONFIG.map((entry) => [entry.char.toLowerCase(), entry])
);

/**
 * Map from finger+direction to character.
 */
export const FINGER_DIRECTION_TO_CHAR: Map<string, string> = new Map(
  CHARACTER_CONFIG.map((entry) => [
    `${entry.fingerId}:${entry.direction}`,
    entry.char,
  ])
);

/**
 * Gets all characters for a specific finger.
 */
export function getCharsForFinger(fingerId: FingerId): string[] {
  return CHARACTER_CONFIG.filter((entry) => entry.fingerId === fingerId).map(
    (entry) => entry.char
  );
}

/**
 * Gets the configuration for a character.
 */
export function getConfigForChar(
  char: string
): CharacterConfigEntry | undefined {
  return CHAR_TO_CONFIG.get(char.toLowerCase());
}

/**
 * Gets the character for a finger+direction combination.
 */
export function getCharForFingerDirection(
  fingerId: FingerId,
  direction: Direction
): string | undefined {
  return FINGER_DIRECTION_TO_CHAR.get(`${fingerId}:${direction}`);
}

/**
 * All printable characters in the layout.
 */
export const ALL_CHARACTERS: string[] = CHARACTER_CONFIG.map(
  (entry) => entry.char
);

/**
 * Number of characters per finger.
 */
export const CHARS_PER_FINGER: Record<FingerId, number> = CHARACTER_CONFIG.reduce(
  (acc, entry) => {
    acc[entry.fingerId] = (acc[entry.fingerId] || 0) + 1;
    return acc;
  },
  {} as Record<FingerId, number>
);
