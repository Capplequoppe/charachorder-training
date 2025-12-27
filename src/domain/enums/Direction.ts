/**
 * Represents the direction a finger moves to produce a character.
 * Each finger can produce up to 4 characters plus a center press.
 */
export enum Direction {
  UP = 'up',
  DOWN = 'down',
  LEFT = 'left',
  RIGHT = 'right',
  PRESS = 'press',
}

/**
 * Array of all directions for iteration.
 */
export const ALL_DIRECTIONS: Direction[] = [
  Direction.UP,
  Direction.DOWN,
  Direction.LEFT,
  Direction.RIGHT,
  Direction.PRESS,
];

/**
 * Cardinal directions only (no press).
 */
export const CARDINAL_DIRECTIONS: Direction[] = [
  Direction.UP,
  Direction.DOWN,
  Direction.LEFT,
  Direction.RIGHT,
];
