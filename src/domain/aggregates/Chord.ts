import { Character } from '../entities/Character';
import { FingerId } from '../entities/Finger';
import { ColorDefinition } from '../valueObjects/ColorDefinition';

/**
 * Represents any combination of characters pressed simultaneously.
 * A Chord can be a single character, a power chord (2 keys),
 * or a full word chord (3+ keys).
 *
 * This is an Aggregate - a cluster of related objects treated as a unit.
 */
export class Chord {
  /**
   * Unique identifier.
   * Sorted, lowercase character string (e.g., 'eht' for 'the').
   */
  readonly id: string;

  /** All characters in this chord */
  readonly characters: readonly Character[];

  /** All finger IDs involved in this chord */
  readonly fingerIds: readonly FingerId[];

  /** Number of keys in the chord */
  readonly size: number;

  /**
   * Blended color from combining all finger colors.
   * Uses additive color mixing.
   */
  readonly blendedColor: string;

  /**
   * All note frequencies for audio playback.
   * Creates a multi-note chord sound.
   */
  readonly noteFrequencies: readonly number[];

  /** Optional frequency rank if this chord produces a word */
  readonly frequencyRank?: number;

  /**
   * Creates a new Chord aggregate.
   * Private constructor - use static factory methods.
   */
  private constructor(params: {
    id: string;
    characters: Character[];
    fingerIds: FingerId[];
    blendedColor: string;
    noteFrequencies: number[];
    frequencyRank?: number;
  }) {
    this.id = params.id;
    this.characters = Object.freeze([...params.characters]);
    this.fingerIds = Object.freeze([...params.fingerIds]);
    this.size = params.fingerIds.length;
    this.blendedColor = params.blendedColor;
    this.noteFrequencies = Object.freeze([...params.noteFrequencies]);
    this.frequencyRank = params.frequencyRank;
  }

  /**
   * Creates a Chord ID from a set of characters.
   * The ID is the sorted, lowercase characters.
   */
  static createId(characters: string | Character[]): string {
    const chars =
      typeof characters === 'string'
        ? characters.toLowerCase().split('')
        : characters.map((c) => c.char.toLowerCase());

    return [...new Set(chars)].sort().join('');
  }

  /**
   * Blends multiple colors together.
   */
  static blendMultipleColors(colors: string[]): string {
    return ColorDefinition.blendMultiple(colors);
  }

  /**
   * Creates a Chord from a list of characters.
   */
  static create(
    characters: Character[],
    noteFrequencies: number[],
    frequencyRank?: number
  ): Chord {
    const id = Chord.createId(characters);
    const fingerIds = characters.map((c) => c.fingerId);
    const colors = characters.map((c) => c.color);

    return new Chord({
      id,
      characters,
      fingerIds,
      blendedColor: Chord.blendMultipleColors(colors),
      noteFrequencies,
      frequencyRank,
    });
  }

  /**
   * Creates a Chord from finger IDs and colors (used when Character objects aren't available).
   * This is a simplified version for services that work with fingerIds directly.
   */
  static createFromFingerIds(
    fingerIds: FingerId[],
    colors: string[],
    noteFrequencies?: number[]
  ): Chord {
    const id = [...new Set(fingerIds)].sort().join('');

    return new Chord({
      id,
      characters: [], // Empty - no character info available
      fingerIds,
      blendedColor: Chord.blendMultipleColors(colors),
      noteFrequencies: noteFrequencies ?? [],
    });
  }

  /**
   * Returns true if this chord equals another.
   * Chords are equal if they have the same id.
   */
  equals(other: Chord): boolean {
    return this.id === other.id;
  }

  /**
   * Returns true if this chord contains the given character.
   */
  hasCharacter(char: string): boolean {
    return this.characters.some((c) => c.char === char.toLowerCase());
  }

  /**
   * Returns true if this chord contains the given finger ID.
   */
  hasFinger(fingerId: FingerId): boolean {
    return this.fingerIds.includes(fingerId);
  }

  /**
   * Returns true if this is a single-key chord.
   */
  get isSingleKey(): boolean {
    return this.size === 1;
  }

  /**
   * Returns true if this is a power chord (2 keys).
   */
  get isPowerChord(): boolean {
    return this.size === 2;
  }

  /**
   * Returns true if this is a word chord (3+ keys).
   */
  get isWordChord(): boolean {
    return this.size >= 3;
  }

  /**
   * Returns the display string for this chord.
   */
  get displayString(): string {
    if (this.characters.length === 0) {
      return this.id.toUpperCase();
    }
    return this.characters.map((c) => c.displayChar).join(' + ');
  }

  /**
   * Returns true if all fingers are on the left hand.
   */
  get isLeftHandOnly(): boolean {
    return this.fingerIds.every((id) => id.startsWith('l_'));
  }

  /**
   * Returns true if all fingers are on the right hand.
   */
  get isRightHandOnly(): boolean {
    return this.fingerIds.every((id) => id.startsWith('r_'));
  }

  /**
   * Returns true if fingers are on both hands.
   */
  get isCrossHand(): boolean {
    return !this.isLeftHandOnly && !this.isRightHandOnly;
  }

  /**
   * Returns a string representation for debugging.
   */
  toString(): string {
    return `Chord(${this.id}, size=${this.size})`;
  }
}
