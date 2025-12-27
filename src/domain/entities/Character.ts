import { FingerId } from './Finger';
import { Direction } from '../enums/Direction';

/**
 * Represents a typeable character mapped to a finger + direction.
 * This is the fundamental unit of input for CharaChorder.
 *
 * This is an Entity - has identity based on its char value.
 */
export class Character {
  /** The actual character (lowercase, e.g., 'e') */
  readonly char: string;

  /** Display version (uppercase for visibility, e.g., 'E') */
  readonly displayChar: string;

  /** The finger that produces this character */
  readonly fingerId: FingerId;

  /** The direction the finger moves to produce this character */
  readonly direction: Direction;

  /**
   * Resolved color from finger + direction.
   * This is a derived property computed from the finger's color variations.
   */
  readonly color: string;

  /**
   * Whether this is a printable character (vs. modifier/special key).
   * Only printable characters are used in chord training.
   */
  readonly isPrintable: boolean;

  /**
   * Creates a new Character entity.
   * Private constructor - use static factory method.
   */
  private constructor(
    char: string,
    fingerId: FingerId,
    direction: Direction,
    color: string,
    isPrintable: boolean
  ) {
    this.char = char.toLowerCase();
    this.displayChar = char.toUpperCase();
    this.fingerId = fingerId;
    this.direction = direction;
    this.color = color;
    this.isPrintable = isPrintable;
  }

  /**
   * Creates a new Character entity.
   */
  static create(
    char: string,
    fingerId: FingerId,
    direction: Direction,
    color: string,
    isPrintable: boolean = true
  ): Character {
    return new Character(char, fingerId, direction, color, isPrintable);
  }

  /**
   * Gets the unique identifier for this character's mapping.
   * Used for lookups and deduplication.
   */
  get key(): string {
    return Character.getKey(this.fingerId, this.direction);
  }

  /**
   * Static method to get a key for a finger+direction combo.
   */
  static getKey(fingerId: FingerId, direction: Direction): string {
    return `${fingerId}:${direction}`;
  }

  /**
   * Returns true if this character equals another.
   * Characters are equal if they have the same char value.
   */
  equals(other: Character): boolean {
    return this.char === other.char;
  }

  /**
   * Returns true if this character matches the given char string.
   */
  matches(char: string): boolean {
    return this.char === char.toLowerCase();
  }

  /**
   * Returns true if this character is on the left hand.
   */
  get isLeftHand(): boolean {
    return this.fingerId.startsWith('l_');
  }

  /**
   * Returns true if this character is on the right hand.
   */
  get isRightHand(): boolean {
    return this.fingerId.startsWith('r_');
  }

  /**
   * Returns true if this character is produced by a thumb.
   */
  get isThumb(): boolean {
    return this.fingerId.includes('thumb');
  }

  /**
   * Returns a string representation for debugging.
   */
  toString(): string {
    return `Character(${this.displayChar}, ${this.fingerId}, ${this.direction})`;
  }
}
