/**
 * CharacterMapping Value Object
 *
 * Represents a mapping of a character to a finger and direction.
 * This is a Value Object - immutable and defined by its attributes.
 */

import { FingerId } from '../entities/Finger';
import { Direction } from '../enums/Direction';

/**
 * Represents a character-to-finger mapping.
 * Immutable value object used in layout profiles.
 */
export class CharacterMapping {
  /** The character (lowercase) */
  readonly char: string;

  /** The finger that produces this character */
  readonly fingerId: FingerId;

  /** The direction to produce this character */
  readonly direction: Direction;

  /**
   * Private constructor - use static factory methods.
   */
  private constructor(char: string, fingerId: FingerId, direction: Direction) {
    this.char = char.toLowerCase();
    this.fingerId = fingerId;
    this.direction = direction;
  }

  /**
   * Creates a new CharacterMapping.
   * @param char - The character (will be normalized to lowercase)
   * @param fingerId - The finger that produces this character
   * @param direction - The direction to move the finger
   * @throws Error if char is not a single printable character
   */
  static create(
    char: string,
    fingerId: FingerId,
    direction: Direction
  ): CharacterMapping {
    const normalizedChar = char.toLowerCase();

    // Validate single character
    if (normalizedChar.length !== 1) {
      throw new Error('CharacterMapping requires exactly one character');
    }

    // Validate printable character
    if (!/^[a-z0-9.,;'\-=\[\]\\\/`]$/.test(normalizedChar)) {
      throw new Error(`Invalid character for mapping: ${char}`);
    }

    return new CharacterMapping(normalizedChar, fingerId, direction);
  }

  /**
   * Creates a CharacterMapping from a plain object (for deserialization).
   * @param data - Plain object with char, fingerId, and direction
   */
  static fromPlain(data: {
    char: string;
    fingerId: FingerId;
    direction: Direction;
  }): CharacterMapping {
    return CharacterMapping.create(data.char, data.fingerId, data.direction);
  }

  /**
   * Converts to a plain object (for serialization).
   */
  toPlain(): { char: string; fingerId: FingerId; direction: Direction } {
    return {
      char: this.char,
      fingerId: this.fingerId,
      direction: this.direction,
    };
  }

  /**
   * Returns the unique key for this mapping (fingerId:direction).
   */
  getKey(): string {
    return `${this.fingerId}:${this.direction}`;
  }

  /**
   * Returns true if this CharacterMapping equals another.
   * Value objects are equal if all their attributes are equal.
   */
  equals(other: CharacterMapping): boolean {
    return (
      this.char === other.char &&
      this.fingerId === other.fingerId &&
      this.direction === other.direction
    );
  }

  /**
   * Returns true if this mapping is for the same character.
   */
  isForChar(char: string): boolean {
    return this.char === char.toLowerCase();
  }

  /**
   * Returns true if this mapping is for the same finger+direction.
   */
  isForFingerDirection(fingerId: FingerId, direction: Direction): boolean {
    return this.fingerId === fingerId && this.direction === direction;
  }

  /**
   * Returns a string representation for debugging.
   */
  toString(): string {
    return `CharacterMapping(${this.char} -> ${this.fingerId}:${this.direction})`;
  }
}
